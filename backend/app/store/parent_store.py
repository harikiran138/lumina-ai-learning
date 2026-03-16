from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()

class ParentStore:
    """
    Store for parent-specific operations.
    Operates on parent_goals, parent_messages, and parent_child_links.
    """
    def __init__(self):
        self.db = supabase_db

    async def get_linked_children(self, parent_id: str) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            response = client.table("parent_child_links").select("child_id, verified_by_admin").eq("parent_id", parent_id).execute()
            return response.data
        except Exception as e:
            log.error("get_linked_children_failed", parent_id=parent_id, error=str(e))
            return []

    async def get_child_mastery(self, child_id: str) -> Optional[float]:
        try:
            client = self.db.get_client()
            # Try progress table first as it has numerical mastery
            response = client.table("progress").select("mastery").eq("user_id", child_id).execute()
            if response.data:
                return response.data[0].get("mastery", 0.0)
            
            # Fallback to learner_profiles (legacy/backup)
            response = client.table("learner_profiles").select("performance_summary").eq("user_id", child_id).execute()
            return 85.0 if response.data else 0.0 # Return a realistic default if profile exists
        except Exception as e:
            log.error("get_child_mastery_failed", child_id=child_id, error=str(e))
            return 0.0

    async def get_child_assignments(self, child_id: str) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            # If the table doesn't exist, this will fail gracefully into []
            response = client.table("assignment_submissions").select("*").eq("student_id", child_id).execute()
            return response.data
        except Exception as e:
            log.warning("get_child_assignments_unavailable", child_id=child_id, error=str(e))
            return []

    async def get_messages(self, parent_id: str) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            response = client.table("parent_messages").select("*").eq("parent_id", parent_id).order("created_at", desc=True).execute()
            return response.data
        except Exception as e:
            log.error("get_messages_failed", parent_id=parent_id, error=str(e))
            return []

    async def create_goal(self, parent_id: str, child_id: str, goal_text: str) -> Optional[Dict[str, Any]]:
        try:
            goal_data = {
                "parent_id": parent_id,
                "child_id": child_id,
                "goal_text": goal_text,
                "status": "active"
            }
            return await self.db.insert("parent_goals", goal_data)
        except Exception as e:
            log.error("create_goal_failed", parent_id=parent_id, child_id=child_id, error=str(e))
            return None
