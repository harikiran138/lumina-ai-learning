from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

log = structlog.get_logger()

class CommunityStore:
    def __init__(self):
        self.db = supabase_db

    async def get_communities(self) -> List[Dict]:
        """Fetch all available topic-based communities."""
        try:
            client = self.db.get_client()
            response = await client.table("communities").select("*").async_execute()
            return response.data or []
        except Exception as e:
            log.error("get_communities_failed", error=str(e))
            return []

    async def get_posts(
        self, 
        community_id: Optional[str] = None, 
        subject_tag: Optional[str] = None,
        sort_by: str = "latest",
        limit: int = 50
    ) -> List[Dict]:
        """Fetch community posts with optional filters and sorting."""
        try:
            client = self.db.get_client()
            query = client.table("community_posts").select("*, users(id, full_name, role, profile_image)")

            if community_id:
                query = query.eq("community_id", community_id)
            if subject_tag:
                query = query.eq("subject_tag", subject_tag)

            if sort_by == "latest":
                query = query.order("created_at", desc=True)

            response = await query.limit(limit).async_execute()
            return response.data or []
        except Exception as e:
            log.error("get_posts_failed", error=str(e))
            return []

    async def create_post(self, community_id: str, user_id: str, data: Dict[str, Any]) -> Optional[Dict]:
        """Create a new post in a community."""
        try:
            post_data = {
                "id": str(uuid.uuid4()),
                "community_id": community_id,
                "user_id": user_id,
                "title": data["title"],
                "content": data["content"],
                "subject_tag": data["subject_tag"],
                "image_url": data.get("image_url"),
                "created_at": datetime.utcnow().isoformat()
            }
            result = await self.db.insert("community_posts", post_data)
            return result
        except Exception as e:
            log.error("create_post_failed", error=str(e))
            return None

    async def get_comments(self, post_id: str) -> List[Dict]:
        """Fetch nested comments for a post."""
        try:
            client = self.db.get_client()
            response = await client.table("community_comments").select("*, users(id, full_name, profile_image)").eq("post_id", post_id).order("created_at", desc=True).async_execute()
            return response.data or []
        except Exception as e:
            log.error("get_comments_failed", error=str(e))
            return []

    async def create_comment(self, post_id: str, user_id: str, content: str, parent_id: Optional[str] = None) -> Optional[Dict]:
        """Create a comment or reply."""
        try:
            comment_data = {
                "id": str(uuid.uuid4()),
                "post_id": post_id,
                "user_id": user_id,
                "content": content,
                "parent_comment_id": parent_id,
                "created_at": datetime.utcnow().isoformat()
            }
            result = await self.db.insert("community_comments", comment_data)
            return result
        except Exception as e:
            log.error("create_comment_failed", error=str(e))
            return None

    async def toggle_like(self, post_id: str, user_id: str) -> bool:
        """Add or remove a like from a post."""
        try:
            client = self.db.get_client()
            # Check if like exists
            existing = await client.table("community_likes").select("id").eq("post_id", post_id).eq("user_id", user_id).async_execute()
            
            if existing.data:
                await client.table("community_likes").delete().eq("id", existing.data[0]["id"]).async_execute()
                return False # Unliked
            else:
                await client.table("community_likes").insert({"post_id": post_id, "user_id": user_id}).async_execute()
                return True # Liked
        except Exception as e:
            log.error("toggle_like_failed", error=str(e))
            return False

    async def join_community(self, community_id: str, user_id: str) -> bool:
        """Handle student joining a community."""
        try:
            await self.db.insert("community_members", {"community_id": community_id, "user_id": user_id})
            return True
        except Exception as e:
            log.error("join_community_failed", error=str(e))
            return False
