from typing import List, Optional, Dict
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()


class CommunityStore:
    """
    Store for Community features: Channels and Messages via Supabase.
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    @property
    def channels_collection(self):
        return self.client.table("community_channels")

    @property
    def messages_collection(self):
        return self.client.table("community_messages")

    async def get_channels(self) -> List[Dict]:
        """Fetches all community channels."""
        try:
            response = self.channels_collection.select("*").execute()
            return response.data
        except Exception as e:
            log.error("get_channels_failed", error=str(e))
            return []

    async def get_messages(self, channel_id: str, limit: int = 50) -> List[Dict]:
        """Fetches messages for a specific channel."""
        try:
            response = self.messages_collection.select("*").eq("channelId", channel_id).order("createdAt", desc=False).limit(limit).execute()
            return response.data
        except Exception as e:
            log.error("get_messages_failed", error=str(e))
            return []

    async def send_message(
        self,
        student_id: str,
        student_name: str,
        channel_id: str,
        content: str,
        avatar: Optional[str] = None,
    ) -> Dict:
        """Sends a message to a channel."""
        new_message = {
            "channelId": channel_id,
            "userId": student_id,
            "user": student_name,
            "avatar": avatar
            or f"https://ui-avatars.com/api/?name={student_name}&background=random",
            "content": content,
            "likes": 0,
            "replies": 0,
            "createdAt": datetime.utcnow().isoformat(),
        }

        try:
            result = self.messages_collection.insert(new_message).execute()
            if result.data:
                return {"success": True, "message": result.data[0]}
            return {"success": False}
        except Exception as e:
            log.error("send_community_message_failed", error=str(e))
            return {"success": False}
