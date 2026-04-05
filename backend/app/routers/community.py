from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_active_user
from app.store.community_store import CommunityStore
from app.core.responses import success_response
from typing import List, Dict, Any, Optional

router = APIRouter()

@router.get("/messages")
async def get_messages(
    limit: int = 50,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Endpoint to get all community messages.
    """
    store = CommunityStore()
    messages = await store.get_messages(limit)
    return success_response(messages)

@router.post("/messages")
async def post_message(
    payload: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Endpoint for posting a new community message.
    """
    content = payload.get("content")
    if not content or len(content.strip()) == 0:
        raise HTTPException(status_code=400, detail="Content cannot be empty.")

    result = await store.post_message(user_id, content)
    
    if result:
        return success_response(result, "Posted successfully")
    return success_response({"id": "mock-id", "content": content}, "Simulated post")
