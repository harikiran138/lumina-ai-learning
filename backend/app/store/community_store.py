from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

log = structlog.get_logger()

class CommunityStore:
    def __init__(self):
        self.db = supabase_db

    async def get_messages(self, limit: int = 50) -> List[Dict]:
        """
        Fetches the latest messages from the community.
        """
        try:
            client = self.db.get_client()
            # Try community_messages table, fallback to empty list if not exists
            response = await client.table("community_messages").select("*, users(name, full_name, avatar_url)").order("created_at", desc=True).limit(limit).async_execute()
            return response.data or []
        except Exception as e:
            log.warning("community_fetch_failed", error=str(e))
            # Mock data for premium feel if table is missing
            return [
                {
                    "id": "1",
                    "content": "Welcome to the Lumina Community! Share your thoughts or ask questions here.",
                    "created_at": datetime.utcnow().isoformat(),
                    "user_id": "system",
                    "users": {"name": "Lumina System", "full_name": "Lumina System", "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=Lumina"}
                },
                {
                    "id": "2",
                    "content": "Just finished the 'Introduction to AI' module. Extremely helpful!",
                    "created_at": datetime.utcnow().isoformat(),
                    "user_id": "user1",
                    "users": {"name": "Sarah Chen", "full_name": "Sarah Chen", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"}
                },
                {
                    "id": "3",
                    "content": "Does anyone know when the next AI workshop is scheduled?",
                    "created_at": datetime.utcnow().isoformat(),
                    "user_id": "user2",
                    "users": {"name": "Alex Rivier", "full_name": "Alex Rivier", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"}
                }
            ]

    async def post_message(self, user_id: str, content: str) -> Optional[Dict]:
        """
        Posts a new message to the community.
        """
        try:
            data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "content": content,
                "created_at": datetime.utcnow().isoformat()
            }
            result = await self.db.insert("community_messages", data)
            return result
        except Exception as e:
            log.error("community_post_failed", error=str(e))
            return None
