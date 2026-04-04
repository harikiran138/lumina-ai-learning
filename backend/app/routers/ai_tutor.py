from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_active_user
from app.store.ai_tutor_store import AITutorStore
from app.core.limiter import limiter
from starlette.requests import Request
from typing import List, Dict, Any, Optional

router = APIRouter()

_MAX_PROMPT_LENGTH = 2000  # characters
_MAX_HISTORY_ITEMS = 10


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
    prompt_raw = payload.get("prompt") or payload.get("question") or ""
    if not prompt_raw:
        raise HTTPException(status_code=400, detail="Prompt is required")

    prompt = _sanitize_prompt(str(prompt_raw))

    # Merge legacy `context` and new `context_filters` into one dict
    context: Dict[str, Any] = {}
    if payload.get("context") and isinstance(payload["context"], dict):
        context.update(payload["context"])
    if payload.get("context_filters") and isinstance(payload["context_filters"], dict):
        context.update(payload["context_filters"])

    # Allow top-level topic/subject as shorthand context
    if payload.get("topic"):
        context.setdefault("topic", payload["topic"])
    if payload.get("subject"):
        context.setdefault("subject", payload["subject"])

    mode: str = payload.get("mode", "explain")
    history_raw: list = payload.get("history") or []

    # Normalize history to OpenAI format once — no double-processing
    formatted_history = _normalize_history(history_raw)

    tutor_store = AITutorStore()
    response_text = await tutor_store.get_response(
        prompt=prompt,
        history=formatted_history,
        context=context,
        mode=mode,
        student_id=current_user.get("id"),
    )

    return {
        "success": True,
        "response": response_text,
        "role": "assistant",
        "mode": mode,
    }
