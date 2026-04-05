import json
from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_active_user
from app.store.ai_tutor_store import AITutorStore
from app.core.limiter import limiter
from starlette.requests import Request
from typing import List, Dict, Any, Optional
from ai_engine.classifier import classify, RoutingTier, RESTRICTED_REDIRECT

router = APIRouter()

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

    return AITutorStore._error_fallback(mode)


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
        # Use pre-computed tier from ask endpoint if available (avoids double classify)
        pre_tier = payload.get("_routing_tier")
        if pre_tier in (RoutingTier.SAFE_INSTANT, RoutingTier.ACADEMIC_VERIFIED, RoutingTier.RESTRICTED):
            clf = {"tier": pre_tier, "confidence": 1.0, "reason": "pre-classified by ask endpoint"}
        else:
            clf = classify(prompt, context)

        tier = clf["tier"]

        # ── RESTRICTED: instant redirect, no LLM, no queue ───────────────────
        if tier == RoutingTier.RESTRICTED:
            redirect_str = _restricted_content(mode)
            return {
                "success": True,
                "queued": False,
                "tier": RoutingTier.RESTRICTED,
                "type": "text",
                "content": redirect_str,
                "meta": {"topic": "off-topic"},
                "role": "assistant",
                "mode": mode,
                "classification": {"mode": mode, **clf},
            }

        # ── SAFE_INSTANT: direct LLM, no teacher queue ────────────────────────
        if tier == RoutingTier.SAFE_INSTANT:
            response_text = await tutor_store.get_response(
                prompt=prompt,
                history=formatted_history,
                context=context,
                mode=mode,
                student_id=str(current_user.get("id")),
            )
            response_str = _ensure_serialized_response(response_text, mode)
            return {
                "success": True,
                "queued": False,
                "tier": RoutingTier.SAFE_INSTANT,
                "type": _MODE_TO_TYPE.get(mode, "text"),
                "content": response_str,
                "meta": _extract_meta(response_str),
                "role": "assistant",
                "mode": mode,
                "classification": {"mode": mode, **clf},
            }

        # ── ACADEMIC_VERIFIED: teacher verification queue ─────────────────────
        queued = await tutor_store.queue_student_request(
            prompt=prompt,
            history=formatted_history,
            context=context,
            student_id=str(current_user.get("id")),
            requested_mode=mode,
        )
        resolved_mode = queued.get("classification", {}).get("mode", mode)
        response_str = _ensure_serialized_response(queued.get("response"), resolved_mode)
        return {
            "success": True,
            "queued": True,
            "tier": RoutingTier.ACADEMIC_VERIFIED,
            "queue_id": queued.get("queue_id"),
            "delivery_status": queued.get("delivery_status"),
            "type": _MODE_TO_TYPE.get(resolved_mode, "text"),
            "content": response_str,
            "meta": _extract_meta(response_str),
            "role": "assistant",
            "mode": resolved_mode,
            "classification": queued.get("classification"),
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
