from typing import List, Optional, Dict
from app.database.manager import db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()


class CommunityStore:
    """
    Store for Community features: Channels and Messages.
    """

    def __init__(self):
        pass

    @property
    def channels_collection(self):
        return db.get_collection("community_channels")

    @property
    def messages_collection(self):
        return db.get_collection("community_messages")

    async def get_channels(self) -> List[Dict]:
        """Fetches all community channels."""
        col = self.channels_collection
        if col is None:
            return []
        cursor = col.find()
        channels = await cursor.to_list(length=100)
        for c in channels:
            c["id"] = str(c.pop("_id"))
        return channels

    async def get_messages(self, channel_id: str, limit: int = 50) -> List[Dict]:
        """Fetches messages for a specific channel."""
        col = self.messages_collection
        if col is None:
            return []
        cursor = col.find({"channelId": channel_id}).sort("createdAt", 1).limit(limit)
        messages = await cursor.to_list(length=limit)
        for m in messages:
            m["id"] = str(m.pop("_id"))
        return messages

    async def send_message(
        self,
        student_id: str,
        student_name: str,
        channel_id: str,
        content: str,
        avatar: Optional[str] = None,
    ) -> Dict:
        """Sends a message to a channel."""
        col = self.messages_collection
        if col is None:
            return {"success": False}

        new_message = {
            "channelId": channel_id,
            "userId": student_id,
            "user": student_name,
            "avatar": avatar
            or f"https://ui-avatars.com/api/?name={student_name}&background=random",
            "content": content,
            "likes": 0,
            "replies": 0,
            "createdAt": datetime.utcnow(),
        }

        try:
            result = await col.insert_one(new_message)
            new_message["id"] = str(result.inserted_id)
            return {"success": True, "message": new_message}
        except Exception as e:
            log.error("send_community_message_failed", error=str(e))
            return {"success": False}
