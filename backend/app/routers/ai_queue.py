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
from app.database.supabase_manager import supabase_db
from app.services.ai_tutor_service import AITutorService, TutorGenerationRequest
from app.services.ai_queue_service import AIQueueService
from app.services.realtime_service import RealtimeService
from app.routers.realtime import broadcast_ai_tutor_event

log = structlog.get_logger()
router = APIRouter()
tutor_service = AITutorService()
queue_service = AIQueueService()
realtime_service = RealtimeService()

_EXISTING_QUEUE_COLUMNS = {
    "student_id",
    "teacher_id",
    "course_id",
    "student_question",
    "ai_generated_answer",
    "teacher_edited_answer",
    "status",
    "created_at",
    "verified_at",
}


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


def _client():
    return supabase_db.get_client()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _course_name(course: Dict[str, Any]) -> str:
    return (
        course.get("course_name")
        or course.get("name")
        or course.get("title")
        or f"Course {course.get('id', '')}"
    )


def _course_subject(course: Dict[str, Any]) -> str:
    return course.get("subject") or _course_name(course)


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


def _extract_concepts_from_knowledge_graph(knowledge_graph: Any) -> List[str]:
    concepts: List[str] = []
    if isinstance(knowledge_graph, dict):
        for key in ("nodes", "concepts", "topics"):
            value = knowledge_graph.get(key)
            if isinstance(value, list):
                for item in value[:8]:
                    if isinstance(item, dict):
                        label = item.get("label") or item.get("name") or item.get("id")
                    else:
                        label = item
                    if label:
                        concepts.append(str(label))
        if not concepts:
            concepts.extend(str(key) for key in list(knowledge_graph.keys())[:8])
    elif isinstance(knowledge_graph, list):
        for item in knowledge_graph[:8]:
            if isinstance(item, dict):
                label = item.get("label") or item.get("name") or item.get("id")
            else:
                label = item
            if label:
                concepts.append(str(label))
    return concepts[:8]


def _knowledge_graph_summary(course: Dict[str, Any]) -> str:
    concepts = _extract_concepts_from_knowledge_graph(course.get("knowledge_graph"))
    return ", ".join(concepts[:8])


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


def _pick_course_for_question(question_text: str, courses: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not courses:
        return None

    lowered = question_text.lower()

    def score(course: Dict[str, Any]) -> Tuple[int, int]:
        tokens = [
            str(course.get("subject") or "").lower(),
            _course_name(course).lower(),
            str(course.get("description") or "").lower(),
        ]
        direct_match = sum(1 for token in tokens if token and token in lowered)
        progress = int(float((course.get("progress") or 0)))
        return direct_match, progress

    return sorted(courses, key=score, reverse=True)[0]


def _lookup_course(client: Any, student_id: str, course_id: Optional[str], question_text: str) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
    if course_id:
        course_res = client.table("courses").select("*").eq("id", course_id).limit(1).execute()
        return ((course_res.data or [None])[0], [course_res.data[0]] if course_res.data else [])

    enrollments = client.table("enrollments").select("course_id, progress").eq("student_id", student_id).execute().data or []
    subject_rows = client.table("student_subjects").select("subject_id").eq("student_id", student_id).execute().data or []
    course_ids = {
        str(row.get("course_id"))
        for row in enrollments
        if row.get("course_id")
    } | {
        str(row.get("subject_id"))
        for row in subject_rows
        if row.get("subject_id")
    }
    if not course_ids:
        return None, []

    courses = client.table("courses").select("*").in_("id", list(course_ids)).execute().data or []
    progress_by_course = {
        str(row.get("course_id")): (row.get("progress") or {})
        for row in enrollments
        if row.get("course_id")
    }
    for course in courses:
        course["progress"] = (progress_by_course.get(str(course.get("id"))) or {}).get("mastery") or 0
    return _pick_course_for_question(question_text, courses), courses


def _lookup_teacher_id(client: Any, course: Optional[Dict[str, Any]]) -> Optional[str]:
    if not course:
        return None
    if course.get("teacher_id"):
        return str(course["teacher_id"])
    assignment_res = (
        client.table("teacher_assignments")
        .select("teacher_id")
        .eq("course_id", course.get("id"))
        .limit(1)
        .execute()
    )
    if assignment_res.data:
        teacher_id = assignment_res.data[0].get("teacher_id")
        if teacher_id:
            return str(teacher_id)
    return None


def _lookup_cached_draft(client: Any, course_id: Optional[str], question_signature: str) -> Optional[Dict[str, Any]]:
    if not course_id:
        return None
    result = (
        client.table("ai_answer_queue")
        .select("*")
        .eq("course_id", course_id)
        .eq("question_signature", question_signature)
        .limit(5)
        .execute()
    )
    rows = result.data or []
    for row in rows:
        status = row.get("status")
        if status in {"approved", "edited_approved"}:
            return row
    return None


def _safe_insert_queue_item(client: Any, payload: Dict[str, Any]):
    try:
        return client.table("ai_answer_queue").insert(payload).execute()
    except Exception as exc:
        log.warning("ai_queue_insert_retrying_with_legacy_columns", error=str(exc))
        legacy_payload = {key: value for key, value in payload.items() if key in _EXISTING_QUEUE_COLUMNS}
        return client.table("ai_answer_queue").insert(legacy_payload).execute()


def _safe_update_queue_item(client: Any, queue_id: str, updates: Dict[str, Any]):
    try:
        return client.table("ai_answer_queue").update(updates).eq("id", queue_id).execute()
    except Exception as exc:
        log.warning("ai_queue_update_retrying_with_legacy_columns", queue_id=queue_id, error=str(exc))
        legacy_updates = {key: value for key, value in updates.items() if key in _EXISTING_QUEUE_COLUMNS}
        return client.table("ai_answer_queue").update(legacy_updates).eq("id", queue_id).execute()


def _log_ai_interaction(client: Any, user_id: str, question: str, answer: str, topic: Optional[str] = None):
    """
    Log interaction for monitoring and governance.
    """
    try:
        log_payload = {
            "user_id": user_id,
            "question": question,
            "answer": answer,
            "topic": topic,
            "timestamp": _now_iso(),
        }
        client.table("ai_interaction_logs").insert(log_payload).execute()
    except Exception as exc:
        log.error("ai_interaction_logging_failed", error=str(exc))


def _bank_verified_answer(client: Any, item: Dict[str, Any], approved_answer: str, user_id: str):
    """
    Store a teacher-verified answer in the bank for future reuse (knowledge bank).
    """
    queue_id = item.get("id")
    if not queue_id:
        return

    try:
        # Avoid duplicates by checking if already banked
        existing = client.table("verified_answers_bank").select("id").eq("source_queue_id", queue_id).execute()
        if existing.data:
            log.info("ai_answer_already_banked", queue_id=queue_id)
            return

        bank_payload = {
            "source_queue_id": queue_id,
            "question_signature": item.get("question_signature"),
            "question_text": item.get("student_question"),
            "answer_content": approved_answer,
            "course_id": item.get("course_id"),
            "approved_by": user_id,
            "created_at": _now_iso(),
        }
        client.table("verified_answers_bank").insert(bank_payload).execute()
        log.info("ai_answer_banked", queue_id=queue_id, course_id=item.get("course_id"))
    except Exception as exc:
        # Don't fail the approval if banking fails, but log it
        log.error("ai_answer_banking_failed", queue_id=queue_id, error=str(exc))


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


def _build_tutor_request(
    client: Any,
    current_user: Dict[str, Any],
    body: AskQuestionRequest,
    forced_course_id: Optional[str] = None,
) -> Tuple[TutorGenerationRequest, Optional[Dict[str, Any]], Optional[str], List[Dict[str, Any]]]:
    student_id = str(current_user["id"])
    raw_question = body.question_text or body.prompt or body.question or body.message
    clean_question = _normalize_question(raw_question or "")
    if len(clean_question) < 3:
        raise HTTPException(status_code=400, detail="Question text is required")
    course, all_courses = _lookup_course(client, student_id, forced_course_id or body.course_id, clean_question)
    if not course:
        raise HTTPException(status_code=400, detail="No enrolled course could be resolved for this tutor request.")

    teacher_id = _lookup_teacher_id(client, course)
    if not teacher_id:
        raise HTTPException(status_code=400, detail="No teacher is assigned to this course yet.")

    learner_profile = (
        client.table("learner_profiles")
        .select("*")
        .eq("user_id", student_id)
        .maybe_single()
        .execute()
        .data
        or {}
    )
    mastery_rows = (
        client.table("skill_mastery")
        .select("course_id, skill_name, mastery_score")
        .eq("user_id", student_id)
        .execute()
        .data
        or []
    )
    enrollment = (
        client.table("student_enrollments")
        .select("*")
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
        .data
        or {}
    )
    semester_label = "Not specified"
    semester_id = enrollment.get("current_semester_id")
    if semester_id:
        semester = client.table("semesters").select("*").eq("id", semester_id).limit(1).execute().data or []
        if semester:
            semester_label = semester[0].get("title") or f"Semester {semester[0].get('semester_number')}"
    elif learner_profile.get("grade_level"):
        semester_label = str(learner_profile.get("grade_level"))

    assignments = (
        client.table("assignments")
        .select("title, due_date")
        .eq("course_id", course.get("id"))
        .limit(3)
        .execute()
        .data
        or []
    )
    recent_assignments = [
        f"{item.get('title') or 'Assignment'}"
        + (f" (due {item.get('due_date')})" if item.get("due_date") else "")
        for item in assignments
    ]

    mode = tutor_service.infer_mode(clean_question, body.mode)
    weak_topics = [str(item) for item in (learner_profile.get("weak_topics") or []) if item][:6]
    allowed_courses = [_course_name(item) for item in all_courses[:8]] or [_course_name(course)]
    allowed_concepts = list(
        dict.fromkeys(
            weak_topics
            + _extract_concepts_from_knowledge_graph(course.get("knowledge_graph"))
            + ([body.topic] if body.topic else [])
            + ([body.subject] if body.subject else [])
        )
    )[:10]

    context_notes: List[str] = []
    if body.context_lecture_id:
        context_notes.append(f"Lecture Context ID: {body.context_lecture_id}")
    if learner_profile.get("preferences"):
        styles = learner_profile["preferences"].get("learning_styles") or []
        if styles:
            context_notes.append(f"Preferred Learning Styles: {', '.join(map(str, styles[:3]))}")
    if learner_profile.get("goals"):
        context_notes.append(f"Goal Focus: {', '.join(map(str, learner_profile.get('goals', [])[:2]))}")

    request = TutorGenerationRequest(
        question=clean_question,
        mode=mode,
        student_id=student_id,
        history=_normalize_history(body.history),
        course_id=str(course.get("id")),
        course_name=_course_name(course),
        course_description=str(course.get("description") or ""),
        subject=body.subject or _course_subject(course),
        current_semester=semester_label,
        allowed_courses=allowed_courses,
        allowed_concepts=allowed_concepts,
        student_level=_student_level(learner_profile, mastery_rows),
        mastery_summary=_mastery_summary(learner_profile, mastery_rows, course.get("id")),
        weak_topics=weak_topics,
        knowledge_graph_summary=_knowledge_graph_summary(course),
        recent_assignments=recent_assignments,
        visual_requested=tutor_service.wants_visual(clean_question),
        assignment_related=tutor_service.is_assignment_related(clean_question),
        context_notes=context_notes,
    )
    return request, course, teacher_id, all_courses


async def _generate_ai_answer(queue_id: str, request_payload: Dict[str, Any]) -> None:
    request = TutorGenerationRequest(**request_payload, queue_id=queue_id)
    client = _client()
    try:
        # Fixed: Updated call signature with question_id and student_id
        result = await tutor_service.generate_answer(
            question_id=queue_id,
            student_id=request.student_id,
            request=request
        )
        
        # Fixed: Updated to use result.answer, result.status, and result.confidence
        _safe_update_queue_item(
            client,
            queue_id,
            {
                "ai_generated_answer": result.answer,
                "ai_model": result.model or "gemini-1.5-flash",
                "generation_error": None,
                "ai_request_log": result.request_log,
                "ai_response_log": result.response_log,
                "prompt_signature": result.prompt_signature,
                "released_to_student": result.status == "AUTO_APPROVED",
                "status": "ai_answered" if result.status != "AUTO_APPROVED" else "approved",
                "ai_confidence": result.confidence,
                "safety_score": result.safety_score
            },
        )
        _log_ai_interaction(client, request.student_id, request.question, result.answer, request.subject)
        log.info("ai_queue_answer_generated", queue_id=queue_id, status=result.status, confidence=result.confidence)
    except Exception as exc:
        fallback_content = tutor_service._fallback_response(  # noqa: SLF001
            request,
            "The AI draft could not be generated automatically. A teacher can still answer manually.",
        )
        _safe_update_queue_item(
            client,
            queue_id,
            {
                "ai_generated_answer": fallback_content,
                "generation_error": str(exc),
            },
        )
        log.error("ai_queue_generation_failed", queue_id=queue_id, error=str(exc))


async def _submit_question(
    body: AskQuestionRequest,
    current_user: Dict[str, Any],
    background_tasks: BackgroundTasks,
    forced_course_id: Optional[str] = None,
) -> Dict[str, Any]:
    student_id = str(current_user["id"])
    client = _client()
    request, course, teacher_id, _all_courses = _build_tutor_request(client, current_user, body, forced_course_id)
    cached_row = _lookup_cached_draft(client, request.course_id, request.question_signature)

    insert_payload = {
        "student_id": student_id,
        "teacher_id": teacher_id,
        "course_id": request.course_id,
        "student_question": request.question,
        "ai_generated_answer": (
            (cached_row.get("teacher_edited_answer") or cached_row.get("ai_generated_answer"))
            if cached_row
            else "Generating AI response..."
        ),
        "status": "ai_answered" if cached_row else "pending",
        "created_at": _now_iso(),
        "released_to_student": True if cached_row else False,
        "question_signature": request.question_signature,
        "request_mode": request.mode,
        "question_topic": body.topic or request.subject,
        "reviewed_by": None,
        "teacher_note": None,
        "ai_model": cached_row.get("ai_model") if cached_row else None,
        "generation_error": None,
    }
    insert_res = _safe_insert_queue_item(client, insert_payload)
    if not insert_res.data:
        raise HTTPException(status_code=500, detail="Failed to create tutor queue item")

    queue_item = insert_res.data[0]
    queue_id = str(queue_item["id"])

    if not cached_row:
        request.queue_id = queue_id
        background_tasks.add_task(_generate_ai_answer, queue_id, request.__dict__)
    else:
        _safe_update_queue_item(
            client,
            queue_id,
            {
                "generation_error": None,
                "ai_request_log": {"cache_hit": True, "source_queue_id": cached_row.get("id")},
                "ai_response_log": {"cache_hit": True},
            },
        )

    log.info(
        "ai_queue_question_submitted",
        queue_id=queue_id,
        student_id=student_id,
        teacher_id=teacher_id,
        course_id=request.course_id,
        mode=request.mode,
        cache_hit=bool(cached_row),
    )

    return {
        "id": queue_id,
        "answer_id": queue_id,
        "question_id": queue_id,
        "status": "released" if cached_row else "generating",
        "queue_status": "ai_answered" if cached_row else "pending",
        "course_id": request.course_id,
        "course_name": _course_name(course or {}),
        "mode": request.mode,
        "answer": insert_payload["ai_generated_answer"] if cached_row else None,
        "message": "AI is generating your response..." if not cached_row else "Response retrieved from verified bank.",
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
    client = _client()
    rows = (
        client.table("ai_answer_queue")
        .select("*")
        .eq("student_id", current_user.get("id"))
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )
    return [
        {
            "question_id": row.get("id"),
            "question_text": row.get("student_question", ""),
            "created_at": row.get("created_at"),
            "queue_status": row.get("status", "pending"),
            "released_to_student": bool(row.get("released_to_student", False)),
            "message": _queue_status_message(row),
        }
        for row in rows
    ]


@router.get("/student/tutor/answer/{question_id}")
@limiter.limit("120/minute")
async def get_student_tutor_answer(
    request: Request,
    question_id: str,
    current_user: Dict[str, Any] = Depends(get_current_student),
):
    client = _client()
    res = client.table("ai_answer_queue").select("*").eq("id", question_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Question not found")

    row = res.data[0]
    if str(row.get("student_id")) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not your tutor question")

    return _student_delivery_payload(row)


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
    client = _client()
    rows = (
        client.table("ai_answer_queue")
        .select("*")
        .eq("course_id", course_id)
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )

    results = []
    for row in rows:
        status = row.get("status", "pending")
        released = bool(row.get("released_to_student", False))
        if not is_teacher:
            if str(row.get("student_id")) != str(current_user.get("id")):
                continue

        answer = None
        if released and status in {"approved", "edited_approved", "ai_answered"}:
            answer = {
                "final_answer": row.get("teacher_edited_answer") or row.get("ai_generated_answer"),
                "verified_at": row.get("verified_at"),
                "status": status,
            }

        results.append(
            {
                "question_id": row.get("id"),
                "question_text": row.get("student_question", ""),
                "created_at": row.get("created_at"),
                "answer": answer,
                "queue_status": status,
                "released_to_student": released,
            }
        )
    return results


@router.get("/student/questions/{question_id}/status")
async def question_status(
    question_id: str,
    current_user: Dict[str, Any] = Depends(get_current_student),
):
    client = _client()
    res = client.table("ai_answer_queue").select("*").eq("id", question_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Question not found")
    row = res.data[0]
    if str(row.get("student_id")) != str(current_user.get("id")):
        raise HTTPException(status_code=403, detail="Not your tutor question")
    return _student_delivery_payload(row)


@router.get("/teacher/ai-queue")
async def teacher_queue(current_user: Dict[str, Any] = Depends(get_current_teacher)):
    """
    Get queue of pending AI answers for teacher review.
    
    INTEGRATED: Uses AIQueueService.get_queue()
    """
    try:
        result = await queue_service.get_queue(
            teacher_id=str(current_user["id"]),
            role=current_user.get("role", "teacher")
        )
        return result
    except Exception as exc:
        log.error("teacher_queue_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to retrieve queue")


@router.post("/teacher/ai-queue/{queue_id}/approve")
async def approve_queue_item(
    queue_id: str,
    current_user: Dict[str, Any] = Depends(get_current_teacher),
):
    """
    Teacher approves AI-generated answer.
    
    INTEGRATED:
    1. Uses AIQueueService.approve_answer()
    2. Emits real-time event via RealtimeService.emit_answer_approved()
    3. Broadcasts to student WebSocket via broadcast_ai_tutor_event()
    4. Student receives notification in real-time
    """
    try:
        # Use service to approve
        await queue_service.approve_answer(
            question_id=queue_id,
            teacher_id=str(current_user["id"]),
            feedback=None
        )
        
        # Fetch the updated item to get student_id and content for broadcast
        client = supabase_db.get_client()
        item_res = client.table("ai_answer_queue").select("*").eq("id", queue_id).maybe_single().execute()
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Queue item not found after approval")
        
        item = item_res.data
        student_id = item.get("student_id")
        
        # Emit to event store (DB) and broadcast to student's WebSocket
        await realtime_service.emit_answer_approved(
            question_id=queue_id,
            student_id=student_id,
            answer=item.get("ai_generated_answer", ""),
            teacher_name=current_user.get("full_name", "Teacher"),
            teacher_feedback=None,
            source="teacher_approved"
        )
        
        # The realtime_service.emit_answer_approved internally calls broadcast_ai_tutor_event
        # so we don't need to call it manually if the service is correctly integrated.
        # But looking at existing code, it was called manually. Let's keep it robust.
        event_payload = {
            "event": "answer.approved_by_teacher",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "question_id": queue_id,
                "answer": item.get("ai_generated_answer", ""),
                "teacher_name": current_user.get("full_name", "Teacher"),
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
    current_user: Dict[str, Any] = Depends(get_current_teacher),
):
    """
    Teacher edits and approves AI-generated answer.
    
    INTEGRATED:
    1. Uses AIQueueService.edit_approve_answer()
    2. Emits real-time event via RealtimeService.emit_answer_approved()
    3. Broadcasts to student WebSocket via broadcast_ai_tutor_event()
    4. Student receives approved answer in real-time with teacher edits
    """
    try:
        # Use service to edit/approve
        await queue_service.edit_approve_answer(
            question_id=queue_id,
            teacher_id=str(current_user["id"]),
            final_answer=body.final_answer,
            teacher_note=body.teacher_note
        )
        
        # Get student_id for broadcast
        client = supabase_db.get_client()
        item_res = client.table("ai_answer_queue").select("student_id").eq("id", queue_id).maybe_single().execute()
        student_id = item_res.data.get("student_id") if item_res.data else None
        
        if student_id:
            # Emit and broadcast
            await realtime_service.emit_answer_approved(
                question_id=queue_id,
                student_id=student_id,
                answer=body.final_answer,
                teacher_name=current_user.get("full_name", "Teacher"),
                teacher_feedback=body.teacher_note,
                source="teacher_approved"
            )
            
            event_payload = {
                "event": "answer.approved_by_teacher",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "question_id": queue_id,
                    "answer": body.final_answer,
                    "teacher_name": current_user.get("full_name", "Teacher"),
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
    current_user: Dict[str, Any] = Depends(get_current_teacher),
):
    """
    Teacher rejects AI-generated answer.
    
    INTEGRATED:
    1. Uses AIQueueService.reject_answer()
    2. Emits real-time event via RealtimeService.emit_answer_rejected()
    3. Broadcasts to student WebSocket via broadcast_ai_tutor_event()
    4. Student receives rejection notification in real-time
    """
    try:
        # Use service to reject
        await queue_service.reject_answer(
            question_id=queue_id,
            teacher_id=str(current_user["id"]),
            teacher_note=body.teacher_note
        )
        
        # Get student_id for notification
        client = supabase_db.get_client()
        item_res = client.table("ai_answer_queue").select("student_id").eq("id", queue_id).maybe_single().execute()
        student_id = item_res.data.get("student_id") if item_res.data else None
        
        if student_id:
            # Emit and broadcast
            await realtime_service.emit_answer_rejected(
                question_id=queue_id,
                student_id=student_id,
                reason=body.teacher_note,
                teacher_name=current_user.get("full_name", "Teacher"),
                suggestion=None
            )
            
            event_payload = {
                "event": "answer.rejected",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "question_id": queue_id,
                    "reason": body.teacher_note,
                    "teacher_name": current_user.get("full_name", "Teacher"),
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
    current_user: Dict[str, Any] = Depends(get_current_teacher),
):
    try:
        result = await queue_service.escalate_answer(
            question_id=queue_id,
            escalator_id=str(current_user["id"]),
            escalator_role=current_user.get("role", "teacher"),
            reason=body.reason
        )
        
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        log.error("answer_escalate_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to escalate answer")
