from datetime import datetime
from typing import List, Optional, Dict, Any
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger(__name__)

class AttendanceStore:
    """
    Supabase store for Attendance Sessions and Records.
    Operates on 'attendance_sessions' and 'attendance_records' tables.
    """

    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db

    async def upsert_session(self, session_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Creates or updates an attendance session.
        Expects keys: course_id, teacher_id, batch_id, section, class_date.
        """
        try:
            # Note: ScopedSupabase and ScopedQueryBuilder handle the scoping and upsert
            session_data["updated_at"] = datetime.utcnow().isoformat()
            res = await self.db.table("attendance_sessions").upsert(
                session_data, 
                on_conflict="course_id,batch_id,section,class_date"
            ).async_execute()
            
            if res.data:
                return res.data[0]
            return None
        except Exception as e:
            log.error("upsert_attendance_session_failed", error=str(e), data=session_data)
            raise e

    async def bulk_upsert_records(self, records: List[Dict[str, Any]]) -> bool:
        """
        Bulk updates student attendance records for a session.
        """
        if not records:
            return True
        try:
            res = await self.db.table("attendance_records").upsert(
                records,
                on_conflict="session_id,student_id"
            ).async_execute()
            return len(res.data or []) > 0
        except Exception as e:
            log.error("bulk_upsert_attendance_records_failed", error=str(e), record_count=len(records))
            raise e

    async def get_session_records(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all attendance records for a given session.
        """
        try:
            return await self.db.fetch_all("attendance_records", {"session_id": session_id})
        except Exception as e:
            log.error("get_attendance_session_records_failed", error=str(e), session_id=session_id)
            return []

    async def list_sessions(self, teacher_id: Optional[str] = None, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Lists attendance sessions with optional filters.
        """
        filters = {}
        if teacher_id:
            filters["teacher_id"] = teacher_id
        if course_id:
            filters["course_id"] = course_id
            
        try:
            return await self.db.fetch_all("attendance_sessions", filters)
        except Exception as e:
            log.error("list_attendance_sessions_failed", error=str(e), filters=filters)
            return []
