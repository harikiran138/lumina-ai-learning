from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_active_user
from app.store.ai_tutor_store import AITutorStore
from typing import List, Dict, Any, Optional

router = APIRouter()

@router.post("/chat")
async def ai_tutor_chat(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Endpoint for the AI Tutor chat.
    Expects:
    - prompt: str
    - history: List[Dict] (optional)
    - context: Dict (optional)
    """
    prompt = payload.get("prompt")
    history_raw = payload.get("history") or []
    context = payload.get("context") or {}

    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    tutor_store = AITutorStore()
    
    # Process history
    gemini_history = tutor_store.format_history_for_gemini(history_raw)
    
    # Get response
    response_text = await tutor_store.get_response(prompt, gemini_history, context)
    
    return {
        "success": True,
        "response": response_text,
        "role": "assistant"
    }
