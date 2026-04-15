import asyncio
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from app.api.deps import get_current_active_user
from app.store.ai_tutor_store import AITutorStore
from app.core.limiter import limiter
from starlette.requests import Request
from typing import Dict, Any
from ai_engine.classifier import classify, RoutingTier, RESTRICTED_REDIRECT
from app.store.academic_store import AcademicStore
from app.core.logging import structlog
from app.database.scoped_db import ScopedSupabase, get_scoped_db
from app.services.ai_tutor_service import AITutorService, TutorGenerationRequest
from app.services.realtime_service import RealtimeService

router = APIRouter()
log = structlog.get_logger()

_MAX_PROMPT_LENGTH = 2000  # characters
_MAX_HISTORY_ITEMS = 10
WAITING_MESSAGE = "Teacher is reviewing your answer"


def _sanitize_prompt(prompt: str) -> str:
    """Strip excessive whitespace and enforce length limit."""
    cleaned = " ".join(prompt.split()).strip()
    if len(cleaned) > _MAX_PROMPT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Prompt too long. Maximum {_MAX_PROMPT_LENGTH} characters.",
        )
    return cleaned


def _normalize_history(history_raw: list) -> list:
    """
    Normalize frontend history (sender/text) into OpenAI format (role/content).
    Handles both legacy {sender, text} and already-normalized {role, content} shapes.
    """
    normalized = []
    for msg in (history_raw or []):
        if "role" in msg:
            role = "user" if msg["role"] == "user" else "assistant"
        elif "sender" in msg:
            role = "user" if msg["sender"] == "me" else "assistant"
        else:
            continue

        content = msg.get("content") or msg.get("text") or ""
        if not content:
            continue

        normalized.append({"role": role, "content": str(content)})
    return normalized[-_MAX_HISTORY_ITEMS:]


def _merge_context(payload: Dict[str, Any]) -> Dict[str, Any]:
    context: Dict[str, Any] = {}
    if payload.get("context") and isinstance(payload["context"], dict):
        context.update(payload["context"])
    if payload.get("context_filters") and isinstance(payload["context_filters"], dict):
        context.update(payload["context_filters"])

    if payload.get("topic"):
        context.setdefault("topic", payload["topic"])
    if payload.get("subject"):
        context.setdefault("subject", payload["subject"])
    return context


def _infer_mode(prompt: str, requested_mode: Any) -> str:
    if requested_mode in {"explain", "quiz", "code", "interactive"}:
        return str(requested_mode)

    lowered = prompt.lower()
    if any(token in lowered for token in ("quiz", "test me", "mcq", "multiple choice")):
        return "quiz"
    if any(
        token in lowered
        for token in ("code", "debug", "function", "script", "algorithm", "python", "javascript", "java", "sql")
    ):
        return "code"
    if any(token in lowered for token in ("hint", "guide me", "don't tell me", "dont tell me", "help me think")):
        return "interactive"
    return "explain"


def _ensure_serialized_response(response_text: Any, mode: str) -> str:
    if isinstance(response_text, (dict, list)):
        response_text = json.dumps(response_text)

    normalized = str(response_text or "").strip()
    if normalized:
        return normalized

    return AITutorStore._error_fallback(mode, "Empty LLM response")


def _extract_meta(response_str: str) -> Dict[str, Any]:
    try:
        parsed = json.loads(response_str)
        if isinstance(parsed, dict) and isinstance(parsed.get("meta"), dict):
            return parsed["meta"]
    except (json.JSONDecodeError, TypeError):
        pass
    return {}


def _restricted_content(mode: str) -> str:
    return json.dumps({
        "meta": {"topic": "off-topic"},
        "flow": [{"type": "text", "content": RESTRICTED_REDIRECT}],
    })


_MODE_TO_TYPE = {
    "quiz": "quiz",
    "code": "code",
    "interactive": "text",
    "explain": "text",
}


async def build_tutor_response_payload(
    payload: Dict[str, Any],
    current_user: Dict[str, Any],
    db: ScopedSupabase,
    academic_store: AcademicStore,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Main handler for AI tutor requests.
    
    Flow:
    1. Sanitize prompt
    2. Classify content (restricted check)
    3. Create tutor request
    4. Dispatch to service (which handles AI generation + decision)
    5. Return response
    6. Background: emit real-time event when ready
    """
    prompt_raw = payload.get("prompt") or payload.get("question") or payload.get("message") or ""
    if not prompt_raw:
        raise HTTPException(status_code=400, detail="Prompt is required")

    prompt = _sanitize_prompt(str(prompt_raw))
    context = _merge_context(payload)
    mode = _infer_mode(prompt, payload.get("mode"))
    history_raw: list = payload.get("history") or []
    formatted_history = _normalize_history(history_raw)

    tutor_store = AITutorStore(db=db)
    role = str(current_user.get("role") or "").lower()

    # Check for restricted content
    if role == "student":
        clf = classify(prompt, context)
        tier = clf["tier"]

        if tier == RoutingTier.RESTRICTED:
            redirect_str = _restricted_content(mode)
            log.warning("restricted_interaction", student_id=str(current_user.get("id")), prompt=prompt)
            return {
                "success": True,
                "queued": False,
                "tier": RoutingTier.RESTRICTED,
                "type": "text",
                "content": redirect_str,
                "role": "assistant",
                "mode": mode,
                "classification": {"mode": mode, **clf},
            }

    # Create tutor request object for service
    service_request = TutorGenerationRequest(
        question=prompt,
        mode=mode,
        student_id=str(current_user.get("id")),
        history=formatted_history,
        course_id=context.get("course_id") or "general",
        course_name=context.get("course_name") or "General",
        subject=context.get("subject") or "General",
        student_level="intermediate",  # Could fetch from profile
        weak_topics=[],  # Could fetch from profile
        allowed_concepts=[],
        visual_requested=False,
        assignment_related=False,
    )

    # For students: Create queue item and dispatch background task
    if role == "student":
        queue_result = await tutor_store.queue_student_request(
            prompt=prompt,
            history=formatted_history,
            context=context,
            student_id=str(current_user.get("id")),
            requested_mode=mode,
        )
        
        queue_id = queue_result.get("queue_id")
        
        # Dispatch background task to generate answer
        background_tasks.add_task(
            _generate_ai_answer_background,
            queue_id=queue_id,
            student_id=str(current_user.get("id")),
            service_request=service_request,
            db=db
        )
        
        topic_id = context.get("topic") or context.get("topic_id") or "general"
        await academic_store.update_mastery(str(current_user.get("id")), topic_id, 0.25)

        log.info(
            "ai_interaction_student_queued",
            student_id=str(current_user.get("id")),
            question=prompt,
            topic=topic_id,
            queue_id=queue_id,
        )
        
        return {
            "success": True,
            "queued": True,
            "type": _MODE_TO_TYPE.get(mode, "text"),
            "content": queue_result["response"],
            "meta": {
                **_extract_meta(queue_result["response"]),
                "queue_id": queue_id,
                "delivery_status": "pending",
            },
            "role": "assistant",
            "mode": mode,
        }

    # For non-students: Get immediate response from store
    response_text = await tutor_store.get_response(
        prompt=prompt,
        history=formatted_history,
        context=context,
        mode=mode,
        student_id=current_user.get("id"),
    )
    response_str = _ensure_serialized_response(response_text, mode)

    return {
        "success": True,
        "queued": False,
        "type": _MODE_TO_TYPE.get(mode, "text"),
        "content": response_str,
        "meta": _extract_meta(response_str),
        "role": "assistant",
        "mode": mode,
    }


async def _generate_ai_answer_background(
    queue_id: str,
    student_id: str,
    service_request: TutorGenerationRequest,
    db: ScopedSupabase
) -> None:
    """
    Background task: Generate AI answer and emit real-time event.
    
    Flow:
    1. Call AITutorService to generate answer
    2. Get decision (AUTO_APPROVED, PROVISIONAL, PENDING)
    3. Emit event via RealtimeService (handles DB storage + WebSocket broadcast)
    4. Event is stored in DB for polling fallback if WebSocket fails
    5. Teacher notified if PROVISIONAL/PENDING
    
    Failure handling:
    - AI generation error: Log and return early, queue marked failed
    - Event emission error: Already has DB fallback
    - WebSocket broadcast error: Retry 3x, then fallback to polling
    """
    service = AITutorService()
    realtime = RealtimeService()
    
    # STEP 1: Generate answer (can fail - AI timeout, rate limit, etc)
    try:
        result = await service.generate_answer(
            question_id=queue_id,
            student_id=student_id,
            request=service_request
        )
        
        log.info(
            "ai_answer_generation_success",
            queue_id=queue_id,
            student_id=student_id,
            status=result.status,
            confidence=result.confidence
        )
        
    except asyncio.TimeoutError:
        log.error(
            "ai_answer_generation_timeout",
            queue_id=queue_id,
            student_id=student_id,
            note="LLM request timed out"
        )
        # Mark as PENDING so teacher can review manually
        await db.client.from_("ai_answer_queue").update({
            "status": "PENDING",
            "failed_reason": "AI generation timeout",
            "error_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", queue_id).execute()
        return
    
    except ValueError as val_err:
        log.error(
            "ai_answer_generation_validation_error",
            queue_id=queue_id,
            student_id=student_id,
            error=str(val_err),
            note="Question or context validation failed"
        )
        await db.client.from_("ai_answer_queue").update({
            "status": "PENDING",
            "failed_reason": f"Validation error: {str(val_err)[:100]}",
            "error_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", queue_id).execute()
        return
    
    except Exception as ai_err:
        log.error(
            "ai_answer_generation_failed",
            queue_id=queue_id,
            student_id=student_id,
            error=str(ai_err),
            error_type=type(ai_err).__name__
        )
        # Mark as PENDING for manual review
        await db.client.from_("ai_answer_queue").update({
            "status": "PENDING",
            "failed_reason": f"AI error: {str(ai_err)[:100]}",
            "error_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", queue_id).execute()
        return
    
    # STEP 2: Emit event via RealtimeService (handles everything)
    try:
        emit_result = await realtime.emit_answer_ready(
            question_id=queue_id,
            student_id=student_id,
            answer=result.answer,
            status=result.status,
            confidence=result.confidence,
            safety_score=result.safety_score,
            source="ai_auto" if result.status == "AUTO_APPROVED" else "ai_provisional",
            rag_sources=result.rag_sources
        )
        
        broadcast_status = emit_result.get("broadcast_result", "unknown")
        
        if broadcast_status == "success":
            log.info(
                "ai_answer_broadcast_success",
                queue_id=queue_id,
                student_id=student_id,
                status=result.status
            )
        elif broadcast_status == "failed_fallback_available":
            log.warning(
                "ai_answer_broadcast_degraded",
                queue_id=queue_id,
                student_id=student_id,
                note="WebSocket broadcast failed, but event stored in DB. Student will receive on next poll."
            )
        else:
            log.warning(
                "ai_answer_broadcast_error",
                queue_id=queue_id,
                student_id=student_id,
                broadcast_error=broadcast_status
            )
    
    except Exception as emit_err:
        log.error(
            "ai_answer_event_emission_failed",
            queue_id=queue_id,
            student_id=student_id,
            error=str(emit_err),
            note="Event emission failed - should fallback to polling"
        )
        # Even if emission fails, the answer is generated, so store it manually
        try:
            await db.client.from_("ai_answer_queue").update({
                "ai_answer": result.answer,
                "status": result.status,
                "confidence_score": result.confidence,
                "safety_score": result.safety_score,
                "answered_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", queue_id).execute()
        except Exception as update_err:
            log.error(
                "ai_answer_update_failed",
                queue_id=queue_id,
                error=str(update_err)
            )


@router.post("/chat")
@limiter.limit("30/minute")
async def ai_tutor_chat(
    request: Request,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_active_user),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """
    AI Tutor chat endpoint.
    
    For students: Creates queue item, returns immediately, background task generates answer and emits event
    For others: Returns immediate response
    """
    academic_store_inj = AcademicStore(db=db)
    return await build_tutor_response_payload(payload, current_user, db, academic_store_inj, background_tasks)
