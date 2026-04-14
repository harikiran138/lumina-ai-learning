from fastapi import APIRouter, HTTPException, Depends, Query
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
    current_user: dict = Depends(get_current_user)
):
    """Process a physical paper submission using OCR and AI grading."""
    content_store = get_content_store()
    assignment_store = get_assignment_store()
    db = get_scoped_db(current_user)
    submission = await content_store.get_physical_submission(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    await content_store.update_physical_submission(submission_id, {"assessment_status": "processing"})
    extracted_texts = []
    
    # We need a client to fetch images
    async with httpx.AsyncClient() as client:
        for img_url in submission.get("submission_images", []):
            try:
                # 1. Fetch Image
                resp = await client.get(img_url)
                resp.raise_for_status()
                image = Image.open(io.BytesIO(resp.content))
                
                # 2. Transcribe
                ocr_result = await ocr_service.extract_text(image)
                extracted_texts.append(ocr_result.text)
            except Exception as e:
                log.warn("ocr_failed", error=str(e), image_url=img_url)
                extracted_texts.append(f"[OCR Error: {str(e)}]")
    
    full_text = "\n\n".join(extracted_texts)
    grading_result = {"score": 0, "feedback": "Assignment context not found."}
    assignment = await assignment_store.get_assignment(submission.get("assignment_id"))
    
    if assignment:
        expected = assignment.get("description") or assignment.get("title")
        try:
            grading_result = grader_service.grade_submission(full_text, expected)
        except Exception as e:
            grading_result = {"score": 0, "feedback": f"Grading service unavailable: {str(e)}"}

    await content_store.update_physical_submission(submission_id, {
        "ocr_extracted_text": {"full_text": str(full_text), "pages": extracted_texts},
        "ai_assessment": grading_result,
        "total_ai_marks": grading_result.get("score"),
        "assessment_status": "graded"
    })
    return {"status": "graded", "score": grading_result.get("score")}

@router.post("/quiz-result")
async def save_quiz_result(
    request: QuizResultRequest,
    current_user: dict = Depends(get_current_student),
):
    """Save the result of a quiz attempt for the current student."""
    user_data_store = get_user_data_store()
    db = get_scoped_db(current_user)
    payload = request.model_dump()
    
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

    # Broadcast to student's adaptive channel via WebSocket manager
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
    import json as _json
    payload = _json.dumps({
        "student_id": req.student_id,
        "session_id": req.session_id,
        "question_text": req.question_text,
        "concept_id": req.concept_id,
        "question_type": req.question_type,
        "difficulty": req.difficulty,
        "overridden_by": str(current_user["id"]),
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
