from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.store.community_store import CommunityStore
from .auth import get_current_user

router = APIRouter()


class MessageRequest(BaseModel):
    channel_id: str
    content: str


def get_community_store():
    return CommunityStore()


@router.get("/data")
async def get_community_data(
    channel_id: str = "general", store: CommunityStore = Depends(get_community_store)
):
    """
    Get all channels and messages for a specific channel.
    """
    channels = await store.get_channels()
    messages = await store.get_messages(channel_id)

    return {"channels": channels, "messages": messages}


@router.post("/send")
async def send_message(
    request: MessageRequest,
    current_user: dict = Depends(get_current_user),
    store: CommunityStore = Depends(get_community_store),
):
    """
    Send a message to a community channel.
    """
    result = await store.send_message(
        student_id=current_user["id"],
        student_name=current_user.get("full_name", "User"),
        channel_id=request.channel_id,
        content=request.content,
        avatar=current_user.get("avatar"),
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to send message")

    return result["message"]
