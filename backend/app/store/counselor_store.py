from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()

class CounselorStore:
    def __init__(self):
        self.db = supabase_db

    async def get_assigned_students(self, counselor_id: str) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            # Returns anonymised IDs through assignment table
            return client.table("counselor_assignments").select("student_id").eq("counselor_id", counselor_id).execute().data
        except Exception as e:
            log.error("get_assigned_students_failed", counselor_id=counselor_id, error=str(e))
            return []

    async def get_crisis_cases(self) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            return client.table("crisis_cases").select("*").eq("status", "active").execute().data
        except Exception as e:
            log.error("get_crisis_cases_failed", error=str(e))
            return []

    async def add_note(self, counselor_id: str, student_id: str, encrypted_content: str) -> Optional[Dict[str, Any]]:
        try:
            note_data = {
                "counselor_id": counselor_id,
                "student_id": student_id,
                "encrypted_content": encrypted_content
            }
            return await self.db.insert("counseling_notes", note_data)
        except Exception as e:
            log.error("add_counseling_note_failed", counselor_id=counselor_id, error=str(e))
            return None

    async def log_reveal(self, counselor_id: str, student_id: str, reason: str) -> bool:
        try:
            log_data = {
                "counselor_id": counselor_id,
                "student_id": student_id,
                "reason": reason,
                "action": "identity_reveal"
            }
            await self.db.insert("safeguarding_log", log_data)
            return True
        except Exception as e:
            log.error("log_reveal_failed", counselor_id=counselor_id, error=str(e))
            return False
