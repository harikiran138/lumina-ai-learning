import os
from datetime import datetime
from celery import Celery
from app.services.ocr_service import ocr_service
from app.services.grader_service import grader_service
from app.services.personalization_service import get_personalization_service
from app.store.assignment_store import AssignmentStore
from app.store.unit_store import UnitStore
from app.services.storage import storage_service
from app.services.unit_pipeline import (
    unit_enrichment_service,
    unit_pdf_parser,
    unit_presentation_service,
)
from app.personalization.schemas import LearningEventType, RubricDefinition, RubricScore, SubmissionScorecard
import tempfile

# Initialize Celery
# Broker URL from env or default to docker service
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")

celery_app = Celery("lumina_worker", broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)

store = AssignmentStore()
unit_store = UnitStore()


# ────────────────────────────────────────────────────────────────────────────
# WS8: Automation Layer Celery Tasks
# ────────────────────────────────────────────────────────────────────────────

@celery_app.task(bind=True)
def task_run_weekly_digest(self, course_id: str):
    """Celery task: generate and persist a weekly class digest."""
    from app.automation.jobs import run_weekly_class_digest
    result = run_weekly_class_digest(course_id)
    print(f"[Worker] Weekly digest complete for course {course_id}: {result.at_risk_count} at-risk students")
    return result.model_dump(mode="json")


@celery_app.task(bind=True)
def task_run_inactivity_alert(self, threshold_hours: float = 48.0):
    """Celery task: scan all learners for inactivity and generate alerts."""
    from app.automation.jobs import run_inactivity_alert_scan
    alerts = run_inactivity_alert_scan(threshold_hours)
    print(f"[Worker] Inactivity scan complete: {len(alerts)} alerts generated")
    return [a.model_dump(mode="json") for a in alerts]


@celery_app.task(bind=True)
def task_run_post_assessment_remediation(self, user_id: str, score: float, course_id: str = None):
    """Celery task: generate a remediation plan for a low-scoring student."""
    from app.automation.jobs import run_post_assessment_remediation
    plan = run_post_assessment_remediation(user_id, score, course_id)
    if plan:
        print(f"[Worker] Remediation plan created for user {user_id}, score={score:.0%}")
        return plan.model_dump(mode="json")
    return {"status": "no_remediation_needed"}


@celery_app.task(bind=True)
def task_run_profile_refresh(self, limit: int = 500):
    """Celery task: recompute KPI/risk/cognitive-load signals across profiles."""
    from app.automation.jobs import run_profile_refresh
    result = run_profile_refresh(limit)
    print(f"[Worker] Profile refresh complete: {result.get('updated_profiles', 0)} profiles updated")
    return result



@celery_app.task(bind=True)
def task_grade_submission(
    self, assignment_id: str, submission_id: str, description: str, file_path: str, rubric: dict = None
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
        handwriting_analysis = None
        if ext in {"png", "jpg", "jpeg"}:
            try:
                from ai_engine.swarm.handwriting_agent import HandwritingAgent

                handwriting_analysis = HandwritingAgent().analyze(temp_path, answer_key=description)
                candidate_text = handwriting_analysis.get("extracted_text") if handwriting_analysis else None
                if candidate_text and "Error during extraction" not in candidate_text:
                    extracted_text = candidate_text
            except Exception as exc:
                print(f"[Worker] Handwriting analysis failed: {exc}")

        # 4. Grade
        print(f"[Worker] Grading...")
        from app.core.async_utils import run_async

        result = grader_service.grade_submission(extracted_text, description)

        result["ocr_text"] = extracted_text
        if handwriting_analysis:
            result["handwriting_analysis"] = handwriting_analysis

        # 5. Update DB
        print(f"[Worker] Saving results...")
        run_async(
            store.update_submission_grade(
                submission_id, result["score"], result["feedback"], extracted_text
            )
        )

        personalization = get_personalization_service()

        rubric_scores = []
        rubric_meta = None
        if rubric:
            try:
                rubric_def = RubricDefinition(**rubric)
                rubric_meta = {
                    "assignment_id": rubric_def.assignment_id,
                    "version": rubric_def.version,
                    "criteria_count": len(rubric_def.criteria),
                }
                total_weight = sum(c.weight for c in rubric_def.criteria) or 1.0
                for criterion in rubric_def.criteria:
                    if criterion.max_points > 0:
                        criterion_score = round(criterion.max_points * (result["score"] / 100.0), 2)
                    else:
                        criterion_score = round(result["score"] * (criterion.weight / total_weight), 2)
                    rubric_scores.append(
                        RubricScore(
                            criterion_id=criterion.id,
                            score=criterion_score,
                            feedback="Auto-scored using rubric weights.",
                        ).model_dump(mode="json")
                    )
            except Exception as exc:
                print(f"[Worker] Failed to parse rubric: {exc}")

        run_async(
            personalization.store.upsert_scorecard(
                    SubmissionScorecard(
                        submission_id=submission_id,
                        overall_score=result["score"],
                        confidence=0.45 if result["score"] < 60 else 0.7,
                        review_required=result["score"] < 60,
                        rubric_scores=rubric_scores,
                        rationale={
                            "grading_model": "semantic_similarity",
                            "details": result.get("details"),
                            "source_text_length": len(extracted_text or ""),
                            "handwriting_analysis": result.get("handwriting_analysis"),
                            "rubric": rubric_meta,
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


@celery_app.task(bind=True)
def task_process_unit_pdf(self, unit_id: str, job_id: str = None):
    from app.core.async_utils import run_async

    unit = run_async(unit_store.get_unit(unit_id))
    if not unit:
        return {"status": "error", "error": "Unit not found", "unit_id": unit_id}

    if job_id:
        run_async(
            unit_store.update_processing_job(
                job_id,
                {"status": "running", "attempts": 1, "started_at": datetime.utcnow().isoformat()},
            )
        )

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
        temp_path = temp_file.name

    try:
        storage_service.download_file(unit["source_file_url"], temp_path)
        parsed = unit_pdf_parser.parse(temp_path, unit.get("original_filename") or "unit.pdf")
        structure = run_async(unit_store.replace_unit_structure(unit_id, parsed))
        run_async(
            unit_store.update_unit(
                unit_id,
                {
                    "title": parsed.get("title") or unit.get("title"),
                    "status": "generating",
                    "parse_error": None,
                },
            )
        )

        if not structure.get("topics"):
            run_async(unit_store.finalize_unit_status(unit_id))

        for topic in structure.get("topics", []):
            topic_job = run_async(
                unit_store.create_processing_job(
                    unit_id=unit_id,
                    topic_id=topic["id"],
                    job_type="topic_enrichment",
                    status="queued",
                )
            )
            task_generate_unit_topic_assets.delay(unit_id, topic["id"], topic_job["id"] if topic_job else None)

        if job_id:
            run_async(
                unit_store.update_processing_job(
                    job_id,
                    {"status": "completed", "finished_at": datetime.utcnow().isoformat()},
                )
            )
        return {"status": "success", "unit_id": unit_id, "topic_count": len(structure.get("topics", []))}
    except Exception as exc:
        run_async(unit_store.update_unit(unit_id, {"status": "failed", "parse_error": str(exc)}))
        if job_id:
            run_async(
                unit_store.update_processing_job(
                    job_id,
                    {
                        "status": "failed",
                        "error_message": str(exc),
                        "finished_at": datetime.utcnow().isoformat(),
                    },
                )
            )
        return {"status": "error", "unit_id": unit_id, "error": str(exc)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@celery_app.task(bind=True)
def task_generate_unit_topic_assets(self, unit_id: str, topic_id: str, job_id: str = None):
    from app.core.async_utils import run_async

    topic = run_async(unit_store.get_topic(topic_id))
    if not topic:
        return {"status": "error", "error": "Topic not found", "topic_id": topic_id}

    run_async(unit_store.update_topic(topic_id, {"generation_status": "generating", "generation_error": None}))
    if job_id:
        run_async(
            unit_store.update_processing_job(
                job_id,
                {"status": "running", "attempts": 1, "started_at": datetime.utcnow().isoformat()},
            )
        )

    try:
        result = unit_enrichment_service.enrich_topic(unit_id, topic)
        run_async(
            unit_store.update_topic(
                topic_id,
                {
                    "summary_bullets": result["summary_bullets"],
                    "quiz_questions": result["quiz_questions"],
                    "detected_signals": result["detected_signals"],
                    "generation_status": "ready",
                    "generation_error": None,
                },
            )
        )
        run_async(unit_store.replace_generated_assets(unit_id, topic_id, result["assets"]))
        if job_id:
            run_async(
                unit_store.update_processing_job(
                    job_id,
                    {"status": "completed", "finished_at": datetime.utcnow().isoformat()},
                )
            )
    except Exception as exc:
        run_async(
            unit_store.update_topic(
                topic_id,
                {"generation_status": "failed", "generation_error": str(exc)},
            )
        )
        if job_id:
            run_async(
                unit_store.update_processing_job(
                    job_id,
                    {
                        "status": "failed",
                        "error_message": str(exc),
                        "finished_at": datetime.utcnow().isoformat(),
                    },
                )
            )
    finally:
        unit = run_async(unit_store.finalize_unit_status(unit_id))
        if unit and unit.get("status") == "ready" and not unit.get("ppt_file_url"):
            ppt_job = run_async(
                unit_store.create_processing_job(unit_id=unit_id, job_type="ppt_generation", status="queued")
            )
            task_generate_unit_presentation.delay(unit_id, ppt_job["id"] if ppt_job else None)

    refreshed = run_async(unit_store.get_topic(topic_id))
    return {"status": refreshed.get("generation_status") if refreshed else "unknown", "topic_id": topic_id}


@celery_app.task(bind=True)
def task_generate_unit_presentation(self, unit_id: str, job_id: str = None):
    from app.core.async_utils import run_async

    if job_id:
        run_async(
            unit_store.update_processing_job(
                job_id,
                {"status": "running", "attempts": 1, "started_at": datetime.utcnow().isoformat()},
            )
        )

    try:
        detail = run_async(unit_store.build_unit_detail(unit_id))
        if not detail:
            raise ValueError("Unit not found")
        ppt_file_url = unit_presentation_service.build_and_store_presentation(detail)
        run_async(unit_store.update_unit(unit_id, {"ppt_file_url": ppt_file_url}))
        if job_id:
            run_async(
                unit_store.update_processing_job(
                    job_id,
                    {"status": "completed", "finished_at": datetime.utcnow().isoformat()},
                )
            )
        return {"status": "success", "unit_id": unit_id, "ppt_file_url": ppt_file_url}
    except Exception as exc:
        if job_id:
            run_async(
                unit_store.update_processing_job(
                    job_id,
                    {
                        "status": "failed",
                        "error_message": str(exc),
                        "finished_at": datetime.utcnow().isoformat(),
                    },
                )
            )
        return {"status": "error", "unit_id": unit_id, "error": str(exc)}
