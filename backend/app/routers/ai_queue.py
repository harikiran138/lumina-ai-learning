"""
Teacher-verified AI Tutor interaction.

Core rule:
Students submit questions, AI drafts answers, and faculty approve or edit
before any answer is released to the student.

INTEGRATION: This router is now clean - it delegates all business logic to services:
- AIQueueService: Teacher queue operations
- RealtimeService: Event broadcasting to students
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.api.deps import (
    get_current_active_user,
    get_current_student,
    get_current_teacher,
)
from app.core.limiter import limiter
from app.core.logging import structlog
from app.services.ai_tutor_service import AITutorService, TutorGenerationRequest
from app.services.ai_queue_service import AIQueueService
from app.services.academic_service import AcademicService
from app.services.realtime_service import RealtimeService
from app.routers.realtime import broadcast_ai_tutor_event
from app.services.ai_queue_analytics import AIQueueAnalytics
from app.api.deps import get_current_user
from app.dependencies import get_ai_queue_service
from app.database.scoped_db import get_scoped_db, ScopedSupabase

log = structlog.get_logger()
router = APIRouter()
tutor_service = AITutorService()
academic_service = AcademicService()
realtime_service = RealtimeService()

# Fallback for background tasks and legacy student routes
# In a full refactor, these would also use Depends()
_global_queue_service = AIQueueService()


class AskQuestionRequest(BaseModel):
    question_text: Optional[str] = Field(default=None, min_length=3, max_length=2000)
    prompt: Optional[str] = None
    question: Optional[str] = None
    message: Optional[str] = None
    course_id: Optional[str] = None
    mode: Optional[str] = None
    topic: Optional[str] = None
    subject: Optional[str] = None
    context_lecture_id: Optional[str] = None
    history: List[Dict[str, Any]] = Field(default_factory=list)


class EditApproveRequest(BaseModel):
    final_answer: str = Field(min_length=1)
    teacher_note: Optional[str] = None


class RejectRequest(BaseModel):
    teacher_note: str = Field(min_length=1)


class EscalateRequest(BaseModel):
    reason: Optional[str] = None


class DecisionRequest(BaseModel):
    decision: str = Field(description="Possible values: approve, reject, edit_approve, escalate")
    teacher_modification: Optional[str] = None
    teacher_feedback: Optional[str] = None
    suggestion: Optional[str] = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _course_name(course: Dict[str, Any]) -> str:
    return (
        course.get("course_name")
        or course.get("name")
        or course.get("title")
        or f"Course {course.get('id', '')}"
    )


def _normalize_question(question_text: str) -> str:
    return " ".join((question_text or "").split()).strip()


def _question_signature(question_text: str) -> str:
    normalized = _normalize_question(question_text).lower()
    return tutor_service._preview(normalized, limit=2000)  # noqa: SLF001


def _normalize_history(history_raw: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    normalized: List[Dict[str, str]] = []
    for item in history_raw[-8:]:
        role = str(item.get("role") or "").strip().lower()
        sender = str(item.get("sender") or "").strip().lower()
        if role not in {"user", "assistant"}:
            role = "assistant" if sender in {"ai", "assistant"} else "user"
        content = str(item.get("content") or item.get("text") or "").strip()
        if content:
            normalized.append({"role": role, "content": content[:1200]})
    return normalized


def _student_level(profile: Dict[str, Any], mastery_rows: List[Dict[str, Any]]) -> str:
    scores: List[float] = []
    for row in mastery_rows:
        try:
            scores.append(float(row.get("mastery_score") or 0))
        except (TypeError, ValueError):
            continue
    mastery_state = profile.get("mastery_state") or {}
    for item in mastery_state.values():
        if isinstance(item, dict):
            try:
                scores.append(float(item.get("score") or 0))
            except (TypeError, ValueError):
                continue
    if not scores:
        return "intermediate"
    average = sum(scores) / len(scores)
    if average < 0.4:
        return "beginner"
    if average < 0.75:
        return "intermediate"
    return "advanced"


def _mastery_summary(profile: Dict[str, Any], mastery_rows: List[Dict[str, Any]], course_id: Optional[str]) -> str:
    relevant = [row for row in mastery_rows if not course_id or str(row.get("course_id")) == str(course_id)]
    labels = []
    for row in relevant[:5]:
        labels.append(
            f"{row.get('skill_name') or 'skill'}={round(float(row.get('mastery_score') or 0) * 100)}%"
        )
    if labels:
        return "; ".join(labels)
    mastery_state = profile.get("mastery_state") or {}
    labels = []
    for key, item in list(mastery_state.items())[:5]:
        if not isinstance(item, dict):
            continue
        labels.append(f"{key}={round(float(item.get('score') or 0) * 100)}%")
    return "; ".join(labels)


def _extract_concepts_from_knowledge_graph(knowledge_graph: Any) -> List[str]:
    concepts: List[str] = []
    if isinstance(knowledge_graph, dict):
        for key in ("nodes", "concepts", "topics"):
            value = knowledge_graph.get(key)
            if isinstance(value, list):
                concepts.extend(str(i.get("label") or i.get("name") or i) for i in value[:8])
    return concepts[:8]


def _knowledge_graph_summary(course: Dict[str, Any]) -> str:
    concepts = _extract_concepts_from_knowledge_graph(course.get("knowledge_graph"))
    return ", ".join(concepts[:8])


def _queue_status_message(row: Dict[str, Any]) -> str:
    status = row.get("status", "pending")
    if status in {"approved", "edited_approved"} and row.get("released_to_student", True):
        return "Your teacher approved the answer."
    if status == "ai_answered" and row.get("released_to_student", False):
        return "A verified answer is ready."
    if status in {"pending", "ai_answered"}:
        return "Your answer is waiting for teacher review."
    if status == "escalated_to_hod":
        return "Your answer has been escalated for senior academic review."
    if status == "rejected":
        return "Your teacher rejected the draft answer."
    return "Your teacher is reviewing the answer."


def _student_delivery_payload(row: Dict[str, Any]) -> Dict[str, Any]:
    raw_status = str(row.get("status") or "pending")
    released = bool(row.get("released_to_student", False))
    answer_text = None

    if released and raw_status in {"approved", "edited_approved", "ai_answered"}:
        answer_text = row.get("teacher_edited_answer") or row.get("ai_generated_answer")

    if released and answer_text:
        status = "completed"
    elif raw_status == "rejected":
        status = "failed"
    elif raw_status == "pending":
        placeholder = row.get("ai_generated_answer")
        status = "generating" if not placeholder or placeholder == "Generating AI response..." else "pending"
    else:
        status = "pending"

    return {
        "question_id": row.get("id"),
        "id": row.get("id"),
        "answer_id": row.get("id"),
        "status": status,
        "queue_status": raw_status,
        "released_to_student": released,
        "final_answer": answer_text,
        "answer": {
            "content": answer_text,
            "type": row.get("request_mode") or "text",
        } if answer_text else None,
        "content": answer_text,
        "response": answer_text,
        "message": _queue_status_message(row),
        "answered_at": row.get("verified_at"),
        "course_id": row.get("course_id"),
    }


async def _generate_ai_answer(queue_id: str, request_payload: Dict[str, Any]) -> None:
    request = TutorGenerationRequest(**request_payload, queue_id=queue_id)
    try:
        result = await tutor_service.generate_answer(
            question_id=queue_id,
            student_id=request.student_id,
            request=request
        )
        await _global_queue_service.update_queue_item_ai_result(queue_id, result)
        log.info("ai_queue_answer_generated", queue_id=queue_id, status=result.status)
    except Exception as exc:
        fallback = tutor_service._fallback_response(request, "AI generation failed.")
        await _global_queue_service.store.update_item(queue_id, {"ai_generated_answer": fallback, "generation_error": str(exc)})
        log.error("ai_queue_generation_failed", queue_id=queue_id, error=str(exc))


async def _submit_question(
    body: AskQuestionRequest,
    current_user: Dict[str, Any],
    background_tasks: BackgroundTasks,
    forced_course_id: Optional[str] = None,
) -> Dict[str, Any]:
    student_id = str(current_user["id"])
    raw_question = body.question_text or body.prompt or body.question or body.message
    clean_question = _normalize_question(raw_question or "")
    
    # Use AcademicService
    ctx = await academic_service.get_student_context(student_id, forced_course_id or body.course_id, clean_question)
    course = ctx["course"]
    if not course:
        raise HTTPException(status_code=400, detail="Course not resolved")
    
    teacher_id = ctx["teacher_id"]
    if not teacher_id:
        raise HTTPException(status_code=400, detail="Teacher not assigned")

    # Use AIQueueService for cache
    signature = _question_signature(clean_question)
    cached_row = await _global_queue_service.lookup_cached_answer(str(course["id"]), signature)

    insert_payload = {
        "student_id": student_id,
        "teacher_id": teacher_id,
        "course_id": str(course["id"]),
        "student_question": clean_question,
        "ai_generated_answer": (
            (cached_row.get("teacher_edited_answer") or cached_row.get("ai_generated_answer"))
            if cached_row else "Generating AI response..."
        ),
        "status": "ai_answered" if cached_row else "pending",
        "created_at": _now_iso(),
        "released_to_student": bool(cached_row),
        "question_signature": signature,
        "request_mode": tutor_service.infer_mode(clean_question, body.mode),
        "question_topic": body.topic or ctx["course"].get("subject"),
    }

    queue_item = await _global_queue_service.create_queue_item(insert_payload)
    if not queue_item:
        raise HTTPException(status_code=500, detail="Failed to create queue item")

    queue_id = str(queue_item["id"])

    if not cached_row:
        # Build full tutor request for background worker
        tutor_req = TutorGenerationRequest(
            question=clean_question,
            mode=insert_payload["request_mode"],
            student_id=student_id,
            history=_normalize_history(body.history),
            course_id=str(course["id"]),
            course_name=_course_name(course),
            course_description=str(course.get("description") or ""),
            subject=insert_payload["question_topic"] or "General",
            current_semester=ctx["semester_label"],
            student_level=_student_level(ctx["profile"], ctx["mastery"]),
            mastery_summary=_mastery_summary(ctx["profile"], ctx["mastery"], str(course["id"])),
            weak_topics=[str(i) for i in (ctx["profile"].get("weak_topics") or [])][:6],
            knowledge_graph_summary=_knowledge_graph_summary(course),
            recent_assignments=ctx["recent_assignments"],
            visual_requested=tutor_service.wants_visual(clean_question),
            assignment_related=tutor_service.is_assignment_related(clean_question)
        )
        background_tasks.add_task(_generate_ai_answer, queue_id, tutor_req.__dict__)

    return {
        "id": queue_id,
        "status": "released" if cached_row else "generating",
        "message": "Response retrieved from verified bank." if cached_row else "AI is generating response...",
    }


@router.post("/student/tutor/ask")
@limiter.limit("12/minute")
async def student_tutor_ask(
    request: Request,
    body: AskQuestionRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_student),
):
    return await _submit_question(body, current_user, background_tasks)


@router.get("/student/tutor/questions")
async def list_student_tutor_questions(
    current_user: Dict[str, Any] = Depends(get_current_student),
):
    student_id = str(current_user["id"])
    views = await _global_queue_service.get_pending_for_student(student_id)
    return [
        {
            "question_id": v.question_id,
            "question_text": v.student_question,
            "created_at": v.created_at,
            "queue_status": v.status,
            "released_to_student": v.released_to_student,
            "message": v.message,
        }
        for v in views
    ]


@router.get("/student/tutor/answer/{question_id}")
@limiter.limit("120/minute")
async def get_student_tutor_answer(
    request: Request,
    question_id: str,
    current_user: Dict[str, Any] = Depends(get_current_student),
):
    item = await _global_queue_service.get_item_details(question_id)
    if not item:
        raise HTTPException(status_code=404, detail="Question not found")

    if str(item.get("student_id")) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not your tutor question")

    return _student_delivery_payload(item)


@router.post("/courses/{course_id}/questions")
async def ask_course_question(
    course_id: str,
    body: AskQuestionRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_student),
):
    return await _submit_question(body, current_user, background_tasks, forced_course_id=course_id)


@router.get("/courses/{course_id}/questions")
async def list_course_questions(
    course_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
):
    is_teacher = current_user.get("role") in {"teacher", "hod", "college_admin", "admin", "super_admin"}
    
    # Validation: if student, must be enrolled in class related to this course
    # For now, we trust the course_id but in a full refactor we'd verify enrollment.
    
    view_data = await _global_queue_service.get_all_for_admin(course_id=course_id)
    
    results = []
    for v in view_data:
        if not is_teacher:
            if str(v.student_id) != str(current_user.get("id")):
                continue

        answer = None
        if v.released_to_student and v.status in {"approved", "edited_approved", "ai_answered"}:
            answer = {
                "final_answer": v.ai_generated_answer, # Logic: it would have been approved/edited
                "verified_at": v.created_at, # Simplified
                "status": v.status,
            }

        results.append(
            {
                "question_id": v.id,
                "question_text": v.student_question,
                "created_at": v.created_at,
                "answer": answer,
                "queue_status": v.status,
                "released_to_student": v.released_to_student,
            }
        )
    return results


@router.get("/student/questions/{question_id}/status")
async def question_status(
    question_id: str,
    current_user: Dict[str, Any] = Depends(get_current_student),
):
    item = await _global_queue_service.get_item_details(question_id)
    if not item:
        raise HTTPException(status_code=404, detail="Question not found")
    if str(item.get("student_id")) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not your tutor question")
    return _student_delivery_payload(item)


@router.get("/teacher/class/{class_id}/ai-queue")
async def get_teacher_class_queue(
    class_id: str,
    db: ScopedSupabase = Depends(get_scoped_db),
    teacher: dict = Depends(get_current_teacher),
    service: AIQueueService = Depends(get_ai_queue_service)
):
    """
    Teacher queue for a specific class.
    STRICT Architecture: uses service.get_pending_for_teacher()
    """
    return await service.get_pending_for_teacher(db, str(teacher["id"]), class_id)


@router.get("/teacher/ai-queue")
async def get_teacher_ai_queue(
    db: ScopedSupabase = Depends(get_scoped_db),
    teacher: dict = Depends(get_current_teacher),
    service: AIQueueService = Depends(get_ai_queue_service)
):
    """
    Teacher queue across all classes (fallback for legacy frontend).
    """
    return await service.get_pending_for_teacher(db, str(teacher["id"]), None)


@router.get("/teacher/ai-queue/analytics/decisions")
async def get_decisions_distribution(
    teacher: dict = Depends(get_current_teacher),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    analytics = AIQueueAnalytics(db)
    return await analytics.get_decision_distribution()


@router.get("/teacher/ai-queue/analytics/confidence")
async def get_confidence_stats(
    bins: int = 10,
    teacher: dict = Depends(get_current_teacher),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    analytics = AIQueueAnalytics(db)
    return await analytics.get_confidence_distribution(bins=bins)


@router.get("/teacher/ai-queue/analytics/slas")
async def get_review_slas(
    teacher: dict = Depends(get_current_teacher),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    analytics = AIQueueAnalytics(db)
    return await analytics.get_teacher_review_slas()


@router.get("/teacher/ai-queue/analytics/throughput")
async def get_student_throughput(
    teacher: dict = Depends(get_current_teacher),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    analytics = AIQueueAnalytics(db)
    return await analytics.get_student_throughput()


@router.post("/teacher/ai-queue/{queue_id}/approve")
async def approve_queue_item(
    queue_id: str,
    teacher: dict = Depends(get_current_teacher),
    service: AIQueueService = Depends(get_ai_queue_service)
):
    """
    Teacher approves AI-generated answer.
    """
    try:
        await service.approve_answer(
            question_id=queue_id,
            teacher_id=str(teacher["id"]),
            feedback=None
        )
        
        item = await service.get_item_details(queue_id)
        if not item:
            raise HTTPException(status_code=404, detail="Queue item not found after approval")

        student_id = str(item.get("student_id"))
        
        event_payload = {
            "event": "answer.approved_by_teacher",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "question_id": queue_id,
                "answer": item.get("ai_generated_answer", ""),
                "teacher_name": teacher.get("full_name", "Teacher"),
                "teacher_feedback": None,
                "source": "teacher_approved"
            }
        }
        await broadcast_ai_tutor_event(student_id, event_payload)
        
        log.info("answer_approved_with_event", queue_id=queue_id, student_id=student_id)
        return {"success": True, "status": "approved"}
        
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        log.error("answer_approval_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to approve answer")


@router.post("/teacher/ai-queue/{queue_id}/edit-approve")
async def edit_approve_queue_item(
    queue_id: str,
    body: EditApproveRequest,
    teacher: dict = Depends(get_current_teacher),
    service: AIQueueService = Depends(get_ai_queue_service)
):
    """
    Teacher edits and approves AI-generated answer.
    """
    try:
        await service.edit_approve_answer(
            question_id=queue_id,
            teacher_id=str(teacher["id"]),
            final_answer=body.final_answer,
            teacher_note=body.teacher_note
        )
        
        item = await service.get_item_details(queue_id)
        student_id = str(item.get("student_id")) if item else None
        
        if student_id:
            event_payload = {
                "event": "answer.approved_by_teacher",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "question_id": queue_id,
                    "answer": body.final_answer,
                    "teacher_name": teacher.get("full_name", "Teacher"),
                    "teacher_feedback": body.teacher_note,
                    "source": "teacher_approved",
                    "edited": True
                }
            }
            await broadcast_ai_tutor_event(student_id, event_payload)
        
        log.info("answer_edited_approved_with_event", queue_id=queue_id, student_id=student_id)
        return {"success": True, "status": "edited_approved"}
        
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        log.error("answer_edit_approve_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to edit and approve answer")


@router.post("/teacher/ai-queue/{queue_id}/reject")
async def reject_queue_item(
    queue_id: str,
    body: RejectRequest,
    teacher: dict = Depends(get_current_teacher),
    service: AIQueueService = Depends(get_ai_queue_service)
):
    """
    Teacher rejects AI-generated answer.
    """
    try:
        await service.reject_answer(
            question_id=queue_id,
            teacher_id=str(teacher["id"]),
            teacher_note=body.teacher_note
        )
        
        item = await service.get_item_details(queue_id)
        student_id = str(item.get("student_id")) if item else None
        
        if student_id:
            event_payload = {
                "event": "answer.rejected",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "question_id": queue_id,
                    "reason": body.teacher_note,
                    "teacher_name": teacher.get("full_name", "Teacher"),
                    "suggestion": None
                }
            }
            await broadcast_ai_tutor_event(student_id, event_payload)
        
        log.info("answer_rejected_with_event", queue_id=queue_id, student_id=student_id)
        return {"success": True, "status": "rejected"}
        
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        log.error("answer_rejection_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to reject answer")


@router.post("/faculty/ai-queue/{queue_id}/escalate")
async def escalate_queue_item(
    queue_id: str,
    body: EscalateRequest,
    teacher: dict = Depends(get_current_teacher),
    service: AIQueueService = Depends(get_ai_queue_service)
):
    try:
        result = await service.escalate_answer(
            question_id=queue_id,
            escalator_id=str(teacher["id"]),
            escalator_role=teacher.get("role", "teacher"),
            reason=body.reason
        )
        
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        log.error("answer_escalate_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to escalate answer")


@router.patch("/teacher/ai-queue/{queue_id}/decision")
async def process_queue_decision(
    queue_id: str,
    body: DecisionRequest,
    teacher: dict = Depends(get_current_teacher),
    service: AIQueueService = Depends(get_ai_queue_service)
):
    """
    Consolidated endpoint for teacher decisions on AI answers.
    Supports approval, rejection, editing, and escalation.
    """
    try:
        result = await service.process_decision(
            question_id=queue_id,
            teacher_id=str(teacher["id"]),
            decision=body.decision,
            modification=body.teacher_modification,
            feedback=body.teacher_feedback,
            suggestion=body.suggestion
        )
        
        # Emit real-time event based on result
        item = await service.get_item_details(queue_id)
        if item:
            student_id = str(item.get("student_id"))
            event_map = {
                "approved": "answer.approved_by_teacher",
                "edited_approved": "answer.approved_by_teacher",
                "rejected": "answer.rejected",
                "escalated_to_faculty": "answer.escalated",
                "escalated_to_hod": "answer.escalated",
            }
            
            event_type = event_map.get(result.get("status"))
            if event_type:
                event_payload = {
                    "event": event_type,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "data": {
                        "question_id": queue_id,
                        "answer": item.get("teacher_edited_answer") or item.get("ai_generated_answer"),
                        "status": result.get("status"),
                        "teacher_name": teacher.get("full_name", "Teacher"),
                        "feedback": body.teacher_feedback,
                        "edited": result.get("status") == "edited_approved"
                    }
                }
                await broadcast_ai_tutor_event(student_id, event_payload)
        
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        log.error("decision_processing_failed", queue_id=queue_id, error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to process decision")
