import json
from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_active_user
from app.store.ai_tutor_store import AITutorStore
from app.core.limiter import limiter
from starlette.requests import Request
from typing import List, Dict, Any, Optional
from ai_engine.classifier import classify, RoutingTier, RESTRICTED_REDIRECT
from app.store.academic_store import AcademicStore
from app.core.logging import structlog
from datetime import datetime

router = APIRouter()
academic_store = AcademicStore()
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
        # Determine role
        if "role" in msg:
            role = "user" if msg["role"] == "user" else "assistant"
        elif "sender" in msg:
            role = "user" if msg["sender"] == "me" else "assistant"
        else:
            continue  # skip malformed entries

        # Determine content
        content = msg.get("content") or msg.get("text") or ""
        if not content:
            continue

        normalized.append({"role": role, "content": str(content)})

    return normalized[-_MAX_HISTORY_ITEMS:]  # cap history size


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
    """Extract meta block from A2UI JSON for top-level response envelope."""
    try:
        parsed = json.loads(response_str)
        if isinstance(parsed, dict) and isinstance(parsed.get("meta"), dict):
            return parsed["meta"]
    except (json.JSONDecodeError, TypeError):
        pass
    return {}


def _restricted_content(mode: str) -> str:
    """Return an A2UI-serialized redirect message for RESTRICTED questions."""
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
) -> Dict[str, Any]:
    prompt_raw = payload.get("prompt") or payload.get("question") or payload.get("message") or ""
    if not prompt_raw:
        raise HTTPException(status_code=400, detail="Prompt is required")

    prompt = _sanitize_prompt(str(prompt_raw))
    context = _merge_context(payload)
    mode = _infer_mode(prompt, payload.get("mode"))
    history_raw: list = payload.get("history") or []
    formatted_history = _normalize_history(history_raw)

    tutor_store = AITutorStore()
    role = str(current_user.get("role") or "").lower()

    if role == "student":
        clf = classify(prompt, context)
        tier = clf["tier"]

        # ── RESTRICTED: instant redirect, no LLM, no queue ───────────────────
        if tier == RoutingTier.RESTRICTED:
            redirect_str = _restricted_content(mode)
            # Log restricted interaction
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

        # ── INSTANT LEARNING (Turn-key AI-first Model): Direct LLM ───────────
        # This bypasses the old ACADEMIC_VERIFIED queue to ensure < 1.5s response.
        response_text = await tutor_store.get_response(
            prompt=prompt,
            history=formatted_history,
            context=context,
            mode=mode,
            student_id=str(current_user.get("id")),
        )
        response_str = _ensure_serialized_response(response_text, mode)
        
        # Calculate Mastery Gain (Simulated heuristic for demo)
        mastery_gain = 2.5
        topic_id = context.get("topic") or context.get("topic_id") or "general"
        
        # Persist Mastery Tracking
        await academic_store.update_mastery(str(current_user.get("id")), topic_id, mastery_gain)

        # Log for Governance Monitoring (Retrospective Teacher Oversight)
        try:
            client = academic_store.db.get_client()
            client.table("ai_answer_queue").insert({
                "student_id": str(current_user.get("id")),
                "student_question": prompt,
                "ai_generated_answer": response_str,
                "question_topic": topic_id,
                "status": "INSTANT_VOICE",  # Special status for AI-first model
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            log.warning("governance_log_failed", error=str(e))

        log.info("ai_interaction_student",
                 student_id=str(current_user.get("id")),
                 student_name=current_user.get("name"),
                 question=prompt,
                 answer=response_str,
                 flags=["Confused"] if clf["confidence"] < 0.8 else [],
                 topic=topic_id,
                 tier=tier)

        return {
            "success": True,
            "queued": False,
            "tier": RoutingTier.SAFE_INSTANT,
            "type": _MODE_TO_TYPE.get(mode, "text"),
            "content": response_str,
            "meta": {**_extract_meta(response_str), "mastery_gain": mastery_gain},
            "role": "assistant",
            "mode": mode,
            "classification": {"mode": mode, **clf},
        }

    # Non-student (teacher, admin): direct LLM response
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


@router.post("/chat")
@limiter.limit("30/minute")
async def ai_tutor_chat(
    request: Request,
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_active_user),
):
    """
    AI Tutor chat endpoint.

    Accepted payload keys:
    - prompt: str (required)
    - history: List[{sender, text}] | List[{role, content}]  (optional)
    - context_filters: dict  — student/course context from frontend router
    - context: dict          — legacy flat context object
    - mode: str              — "explain" | "quiz" | "code" | "interactive"
    - topic: str             — current topic hint
    """
    return await build_tutor_response_payload(payload, current_user)
