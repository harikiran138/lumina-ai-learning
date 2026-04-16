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

    async def create_override_request(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Creates a PENDING attendance override request."""
        try:
            res = await self.db.table("attendance_override_requests").insert(data).async_execute()
            if res.data:
                return res.data[0]
            return None
        except Exception as e:
            log.error("create_override_request_failed", error=str(e), data=data)
            return None

    async def list_pending_overrides(self, institution_id: str) -> List[Dict[str, Any]]:
        """Lists all PENDING override requests for an institution."""
        try:
            return await self.db.table("attendance_override_requests").select("*").eq("institution_id", institution_id).eq("status", "PENDING").async_execute().then(lambda r: r.data or [])
        except Exception as e:
            log.error("list_pending_overrides_failed", error=str(e), institution_id=institution_id)
            return []

    async def get_override_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        """Fetches a specific override request."""
        try:
            res = await self.db.table("attendance_override_requests").select("*").eq("id", request_id).single().async_execute()
            return res.data
        except Exception as e:
            log.error("get_override_request_failed", error=str(e), request_id=request_id)
            return None

    async def update_override_request(self, request_id: str, update_data: Dict[str, Any]) -> bool:
        """Updates the status of an override request."""
        try:
            update_data["updated_at"] = datetime.utcnow().isoformat()
            res = await self.db.table("attendance_override_requests").update(update_data).eq("id", request_id).async_execute()
            return len(res.data or []) > 0
        except Exception as e:
            log.error("update_override_request_failed", error=str(e), request_id=request_id)
            return False

    async def apply_attendance_override(self, student_id: str, new_status: str) -> bool:
        """
        Finalizes an approved override by updating the main attendance_records table.
        NOTE: This expects the attendance_records table to have a student_id and possibly a session_id.
        Since we might not know the session_id from the override request, we search for the latest record.
        """
        try:
            # Finding the latest record for this student
            res = await self.db.table("attendance_records").select("*").eq("student_id", student_id).order("created_at", desc=True).limit(1).async_execute()
            if res.data:
                record_id = res.data[0]["id"]
                # Assuming is_present is the boolean status
                is_present = new_status.upper() == "PRESENT"
                res_update = await self.db.table("attendance_records").update({"is_present": is_present}).eq("id", record_id).async_execute()
                return len(res_update.data or []) > 0
            return False
        except Exception as e:
            log.error("apply_attendance_override_failed", error=str(e), student_id=student_id)
            return False
