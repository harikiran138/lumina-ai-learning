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
            response = self.messages_collection.select("*").eq("channel_id", channel_id).order("timestamp", desc=False).limit(limit).execute()
            messages = response.data
            
            # Map database fields to frontend fields
            mapped_messages = []
            for msg in messages:
                mapped_messages.append({
                    "id": msg.get("id"),
                    "channelId": msg.get("channel_id"),
                    "userId": msg.get("student_id"),
                    "user": msg.get("student_name"),
                    "avatar": msg.get("avatar"),
                    "content": msg.get("content"),
                    "createdAt": msg.get("timestamp"),
                    "likes": 0,  # Placeholder
                    "replies": 0 # Placeholder
                })
            return mapped_messages
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
            "channel_id": channel_id,
            "student_id": student_id,
            "student_name": student_name,
            "avatar": avatar
            or f"https://ui-avatars.com/api/?name={student_name}&background=random",
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }

        try:
            result = self.messages_collection.insert(new_message).execute()
            if result.data:
                msg = result.data[0]
                mapped_msg = {
                    "id": msg.get("id"),
                    "channelId": msg.get("channel_id"),
                    "userId": msg.get("student_id"),
                    "user": msg.get("student_name"),
                    "avatar": msg.get("avatar"),
                    "content": msg.get("content"),
                    "createdAt": msg.get("timestamp"),
                    "likes": 0,
                    "replies": 0
                }
                return {"success": True, "message": mapped_msg}
            return {"success": False}
        except Exception as e:
            log.error("send_community_message_failed", error=str(e))
            return {"success": False}
