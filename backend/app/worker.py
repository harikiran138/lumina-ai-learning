import os
import asyncio
from celery import Celery
from app.services.ocr_service import ocr_service
from app.services.grader_service import grader_service
from app.store.assignment_store import AssignmentStore
from app.services.storage import storage_service
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
        # OCR Service is synchronous in its core, but heavy. Running in worker process is fine.
        extracted_text = ocr_service.digitize_image(temp_path)

        # 4. Grade
        print(f"[Worker] Grading...")
        from app.core.async_utils import run_async

        result = run_async(grader_service.grade_submission(extracted_text, description))

        result["ocr_text"] = extracted_text

        # 5. Update DB
        print(f"[Worker] Saving results...")
        store.update_submission_grade(
            submission_id, result["score"], result["feedback"], extracted_text
        )

        return {"status": "success", "submission_id": submission_id, "score": result["score"]}

    except Exception as e:
        print(f"[Worker] Error: {e}")
        # Optionally update DB with error status
        return {"status": "error", "error": str(e)}

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
