from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()

class DiscussionStore:
    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db

    async def create_thread(self, title: str, content: str, author_id: str, subject_id: Optional[str] = None, tags: List[str] = None) -> Dict[str, Any]:
        data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "content": content,
            "author_id": author_id,
            "subject_id": subject_id,
            "tags": tags or [],
            "created_at": datetime.utcnow().isoformat()
        }
        res = await self.db.table("discussion_threads").insert(data).async_execute()
        return res.data[0] if res.data else {}

    async def get_thread(self, thread_id: str) -> Optional[Dict[str, Any]]:
        res = await self.db.table("discussion_threads").select("*").eq("id", thread_id).async_execute()
        return res.data[0] if res.data else None

    async def list_threads(self, subject_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        query = self.db.table("discussion_threads").select("*, author:users(name, role)").order("created_at", desc=True).limit(limit)
        if subject_id:
            query = query.eq("subject_id", subject_id)
        res = await query.async_execute()
        return res.data or []

    async def add_comment(self, thread_id: str, author_id: str, content: str, is_ai: bool = False) -> Dict[str, Any]:
        data = {
            "id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "author_id": author_id,
            "content": content,
            "is_ai_generated": is_ai,
            "created_at": datetime.utcnow().isoformat()
        }
        res = await self.db.table("discussion_comments").insert(data).async_execute()
        return res.data[0] if res.data else {}

    async def get_comments(self, thread_id: str) -> List[Dict[str, Any]]:
        res = await self.db.table("discussion_comments").select("*, author:users(name, role)").eq("thread_id", thread_id).order("created_at", desc=False).async_execute()
        return res.data or []

    async def upvote_thread(self, thread_id: str) -> bool:
        thread = await self.get_thread(thread_id)
        if not thread: return False
        votes = thread.get("upvotes", 0) + 1
        await self.db.table("discussion_threads").update({"upvotes": votes}).eq("id", thread_id).async_execute()
        return True
