import os
from celery import Celery
from app.services.ocr_service import ocr_service
from app.services.grader_service import grader_service
from app.services.personalization_service import get_personalization_service
from app.store.assignment_store import AssignmentStore
from app.services.storage import storage_service
from app.personalization.schemas import LearningEventType, SubmissionScorecard
import tempfile

# Initialize Celery
# Broker URL from env or default to docker service
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")

celery_app = Celery("lumina_worker", broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)

store = AssignmentStore()


@celery_app.task(bind=True)
def task_grade_submission(
    self, assignment_id: str, submission_id: str, description: str, file_path: str
):
    """
    Async Task: Download file -> OCR -> Grade -> Update DB
    """
    print(f"[Worker] Starting grading for submission {submission_id}")

    # 1. Prepare Temp File
    ext = file_path.split(".")[-1] if "." in file_path else "pdf"

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as temp_file:
        temp_path = temp_file.name

    try:
        # 2. Download from Storage (S3/Local)
        print(f"[Worker] Downloading {file_path}...")
        storage_service.download_file(file_path, temp_path)

        # 3. OCR
        print(f"[Worker] Running OCR...")
        extracted_text = ocr_service.extract_text(temp_path, file_type=ext)

        # 4. Grade
        print(f"[Worker] Grading...")
        from app.core.async_utils import run_async

        result = grader_service.grade_submission(extracted_text, description)

        result["ocr_text"] = extracted_text

        # 5. Update DB
        print(f"[Worker] Saving results...")
        run_async(
            store.update_submission_grade(
                submission_id, result["score"], result["feedback"], extracted_text
            )
        )

        personalization = get_personalization_service()
        run_async(
            personalization.store.upsert_scorecard(
                SubmissionScorecard(
                    submission_id=submission_id,
                    overall_score=result["score"],
                    confidence=0.45 if result["score"] < 60 else 0.7,
                    review_required=result["score"] < 60,
                    rationale={
                        "grading_model": "semantic_similarity",
                        "details": result.get("details"),
                        "source_text_length": len(extracted_text or ""),
                    },
                )
            )
        )

        submissions = run_async(store.get_submissions(assignment_id))
        submission = next((item for item in submissions if item.get("id") == submission_id), None)
        if submission:
            run_async(
                personalization.record_event(
                    submission["student_id"],
                    LearningEventType.ASSIGNMENT_GRADED,
                    payload={
                        "assignment_id": assignment_id,
                        "submission_id": submission_id,
                        "score": result["score"],
                        "feedback": result["feedback"],
                    },
                    source="grading_worker",
                    topic_id=assignment_id,
                    session_id=submission_id,
                )
            )

        return {"status": "success", "submission_id": submission_id, "score": result["score"]}

    except Exception as e:
        print(f"[Worker] Error: {e}")
        # Optionally update DB with error status
        return {"status": "error", "error": str(e)}

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
