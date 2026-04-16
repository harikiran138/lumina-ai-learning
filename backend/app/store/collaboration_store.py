from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()

class CollaborationStore:
    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db

    async def create_group(self, title: str, description: str, leader_id: str, subject_id: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "leader_id": leader_id,
            "subject_id": subject_id,
            "created_at": datetime.utcnow().isoformat()
        }
        res = await self.db.table("study_groups").insert(data).async_execute()
        if res.data:
            group = res.data[0]
            await self.add_member(group["id"], leader_id, role="leader")
            return group
        return {}

    async def add_member(self, group_id: str, user_id: str, role: str = "member") -> bool:
        data = {
            "group_id": group_id,
            "user_id": user_id,
            "role": role,
            "joined_at": datetime.utcnow().isoformat()
        }
        try:
            await self.db.table("study_group_members").insert(data).async_execute()
            return True
        except Exception as e:
            log.error("add_group_member_failed", error=str(e), group_id=group_id, user_id=user_id)
            return False

    async def get_group(self, group_id: str) -> Optional[Dict[str, Any]]:
        res = await self.db.table("study_groups").select("*").eq("id", group_id).async_execute()
        return res.data[0] if res.data else None

    async def list_groups(self, subject_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.table("study_groups").select("*")
        if subject_id:
            query = query.eq("subject_id", subject_id)
        res = await query.async_execute()
        return res.data or []

    async def get_members(self, group_id: str) -> List[Dict[str, Any]]:
        res = await self.db.table("study_group_members").select("*, user:users(id, name, avatar_url, role)").eq("group_id", group_id).async_execute()
        return res.data or []

    async def get_user_groups(self, user_id: str) -> List[Dict[str, Any]]:
        res = await self.db.table("study_group_members").select("study_groups(*)").eq("user_id", user_id).async_execute()
        return [r["study_groups"] for r in res.data if r.get("study_groups")]
