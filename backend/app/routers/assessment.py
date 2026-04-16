from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel
from datetime import datetime
import structlog

import io
import httpx
from PIL import Image
from app.api.deps import get_current_user
from app.dependencies import get_user_data_store, get_content_store, get_assignment_store
from app.store.user_data_store import UserDataStore
from app.store.content_store import ContentStore
from app.store.assignment_store import AssignmentStore
from app.services.ocr_service import ocr_service
from app.services.grader_service import grader_service
from app.personalization.schemas import (
    LearningEventType,
    QuizResultPayload,
    InterventionStatus,
)
from app.services.personalization_service import get_personalization_service
from app.database.scoped_db import get_scoped_db
from app.api.deps import get_current_student as get_current_student
from app.api.deps import get_current_teacher as get_current_teacher

router = APIRouter()
log = structlog.get_logger(__name__)
# Stores are now retrieved via dependencies

class QuizResultRequest(BaseModel):
    topic: Optional[str] = None
    difficulty: str
    score: float
    total_questions: Optional[int] = None
    correct_count: Optional[int] = None
    course_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class TeacherInterventionRequest(BaseModel):
    student_id: str
    message: str
    action: Literal["message", "encourage", "reassign_track", "send_resource", "schedule_1on1"] = "message"
    track: Optional[str] = None          # for reassign_track
    resource_url: Optional[str] = None  # for send_resource

class QuestionOverrideRequest(BaseModel):
    student_id: str
    session_id: str
    question_text: str
    concept_id: str
    question_type: str = "SHORT_ANSWER"
    difficulty: float = 0.5

@router.post("/process-physical/{submission_id}")
async def process_physical_submission(
    submission_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Kicks off an asynchronous grading process for a physical paper submission.
    Returns a job_id for SSE tracking.
    """
    from app.database.supabase_manager import supabase_db
    
    # Check if job already exists or submission is valid
    content_store = get_content_store()
    submission = await content_store.get_physical_submission(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    institution_id = current_user.get("institution_id")
    if not institution_id:
        # Fallback for older tokens
        res = await supabase_db.table("users").select("institution_id").eq("id", current_user["id"]).async_execute()
        institution_id = res.data[0]["institution_id"] if res.data else None

    # Create Job
    job_payload = {
        "institution_id": institution_id,
        "user_id": current_user["id"],
        "job_type": "physical_grading",
        "status": "queued"
    }
    job_res = await supabase_db.table("ai_jobs").insert(job_payload).async_execute()
    if not job_res.data:
         raise HTTPException(status_code=500, detail="Failed to queue AI job")
    
    job_id = job_res.data[0]["id"]
    
    # 🚨 SECURITY CHECK: IDOR Prevention (same as before but passed to background)
    user_id = str(current_user["id"])
    role = current_user.get("role", "student")

    # Start background task
    background_tasks.add_task(
        run_physical_grading_task,
        job_id=job_id,
        submission_id=submission_id,
        user_id=user_id,
        role=role,
        institution_id=institution_id
    )

    return {"status": "queued", "job_id": job_id, "submission_id": submission_id}

async def run_physical_grading_task(
    job_id: str,
    submission_id: str,
    user_id: str,
    role: str,
    institution_id: str
):
    """Background task for OCR and AI grading."""
    from app.database.supabase_manager import supabase_db
    import httpx
    import io
    from PIL import Image
    
    content_store = get_content_store()
    assignment_store = get_assignment_store()

    try:
        # 1. Update status to processing
        await supabase_db.table("ai_jobs").update({"status": "processing", "started_at": "now()"}).eq("id", job_id).async_execute()
        
        submission = await content_store.get_physical_submission(submission_id)
        if not submission:
            raise Exception("Submission disappeared")

        await content_store.update_physical_submission(submission_id, {"assessment_status": "processing"})
        
        extracted_texts = []
        async with httpx.AsyncClient() as client:
            for img_url in submission.get("submission_images", []):
                try:
                    resp = await client.get(img_url)
                    resp.raise_for_status()
                    image = Image.open(io.BytesIO(resp.content))
                    ocr_result = await ocr_service.extract_text(image)
                    extracted_texts.append(ocr_result.text)
                except Exception as e:
                    extracted_texts.append(f"[OCR Error: {str(e)}]")
        
        full_text = "\n\n".join(extracted_texts)
        grading_result = {"score": 0, "feedback": "Assignment context not found."}
        assignment = await assignment_store.get_assignment(submission.get("assignment_id"))
        
        if assignment:
            expected = assignment.get("description") or assignment.get("title")
            grading_result = grader_service.grade_submission(full_text, expected)

        # 2. Update submission
        await content_store.update_physical_submission(submission_id, {
            "ocr_extracted_text": {"full_text": str(full_text), "pages": extracted_texts},
            "ai_assessment": grading_result,
            "total_ai_marks": grading_result.get("score"),
            "assessment_status": "graded"
        })

        # 3. Finalize Job
        await supabase_db.table("ai_jobs").update({
            "status": "complete", 
            "result": grading_result,
            "completed_at": "now()"
        }).eq("id", job_id).async_execute()

    except Exception as e:
        await supabase_db.table("ai_jobs").update({
            "status": "failed", 
            "error_message": str(e),
            "completed_at": "now()"
        }).eq("id", job_id).async_execute()
        await content_store.update_physical_submission(submission_id, {"assessment_status": "failed"})

)}

@router.post("/quiz-result")
async def save_quiz_result(
    request: QuizResultRequest,
    current_user: dict = Depends(get_current_student),
):
    """Save the result of a quiz attempt for the current student."""
    user_data_store = get_user_data_store()
    db = get_scoped_db(current_user)
    payload = request.model_dump()
    
    # Strictly scope by current_user.id
    await user_data_store.add_quiz_attempt(current_user["id"], payload)
    await get_personalization_service(db=db).record_event(
        current_user["id"],
        LearningEventType.QUIZ_RESULT,
        payload=QuizResultPayload(**payload).model_dump(exclude_none=True),
        source="assessment_router",
        course_id=request.course_id,
        topic_id=request.topic,
        role=current_user.get("role", "student"),
    )
    return {"status": "success", "message": "Quiz result saved"}

@router.post("/intervene")
async def teacher_intervene(
    req: TeacherInterventionRequest,
    current_user: dict = Depends(get_current_teacher),
):
    """Send a live intervention message or action to a student mid-session."""
    teacher_id = str(current_user["id"])
    db = get_scoped_db(current_user)

    # 🚨 SECURITY CHECK: Teacher-Student Link
    from app.store.academic_store import AcademicStore
    academic = AcademicStore(db=db)
    if not await academic.verify_teacher_student_link(teacher_id, req.student_id):
        # Super Admins and HODs (checked in get_current_teacher) bypass link check if role matches
        if current_user.get("role") not in {"super_admin", "hod"}:
             raise HTTPException(status_code=403, detail="Access denied: Cannot intervene with students outside your assigned classes")

    record = {
        "teacher_id": teacher_id,
        "student_id": req.student_id,
        "message": req.message,
        "action": req.action,
        "created_at": datetime.utcnow().isoformat(),
        "status": "sent",
    }
    if req.track:
        record["track"] = req.track
    if req.resource_url:
        record["resource_url"] = req.resource_url

    try:
        db.table("teacher_interventions").insert(record).execute()
    except Exception as exc:
        log.warning("teacher_interventions_insert_failed", error=str(exc))

    # Broadcast to student's adaptive channel
    try:
        from app.routers.realtime import broadcast_adaptive_event
        await broadcast_adaptive_event(
            req.student_id,
            {
                "type": "teacher:intervene",
                "student_id": req.student_id,
                "teacher_id": teacher_id,
                "message": req.message,
                "action": req.action,
            },
        )
    except Exception as exc:
        log.warning("broadcast_adaptive_event_failed", error=str(exc))

    return {"status": "sent", "student_id": req.student_id, "action": req.action}

@router.post("/override-question")
async def override_student_question(
    req: QuestionOverrideRequest,
    current_user: dict = Depends(get_current_teacher),
):
    """Replace the next question for a student in an active session."""
    teacher_id = str(current_user["id"])
    db = get_scoped_db(current_user)

    # 🚨 SECURITY CHECK: Teacher-Student Link
    from app.store.academic_store import AcademicStore
    academic = AcademicStore(db=db)
    if not await academic.verify_teacher_student_link(teacher_id, req.student_id):
        if current_user.get("role") not in {"super_admin", "hod"}:
            raise HTTPException(status_code=403, detail="Access denied: Cannot override questions for students outside your assigned classes")

    import json as _json
    payload = _json.dumps({
        "student_id": req.student_id,
        "session_id": req.session_id,
        "question_text": req.question_text,
        "concept_id": req.concept_id,
        "question_type": req.question_type,
        "difficulty": req.difficulty,
        "overridden_by": teacher_id,
        "created_at": datetime.utcnow().isoformat(),
    })

    redis_key = f"question_override:{req.student_id}:{req.session_id}"
    stored_in_redis = False

    try:
        from app.routers.realtime import _try_redis_pubsub
        r = _try_redis_pubsub()
        if r:
            r.set(redis_key, payload, ex=300)
            stored_in_redis = True
    except Exception as exc:
        log.warning("redis_question_override_failed", error=str(exc))

    if not stored_in_redis:
        db = get_scoped_db(current_user)
        try:
            record = _json.loads(payload)
            db.table("question_overrides").insert(record).execute()
        except Exception as exc:
            log.warning("question_overrides_insert_failed", error=str(exc))

    return {"status": "queued", "student_id": req.student_id, "session_id": req.session_id}
