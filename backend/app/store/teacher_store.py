from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()

class TeacherStore:
    """
    Supabase store for Teacher requests and class assignments.
    """

    def __init__(self):
        self.db = supabase_db

    async def request_course_access(self, teacher_id: str, course_id: str, class_id: str, message: Optional[str] = None) -> Optional[dict]:
        """Teacher requests access to a specific course and class/section."""
        data = {
            "teacher_id": teacher_id,
            "course_id": course_id,
            "class_id": class_id,
            "message": message,
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat()
        }
        return await self.db.insert("teacher_requests", data)

    async def get_pending_requests(self) -> List[dict]:
        """Fetch all pending teacher access requests for Admin approval."""
        return await self.db.fetch_all("teacher_requests", {"status": "PENDING"})

    async def approve_request(self, request_id: str) -> bool:
        """Approve a request and create a teacher assignment."""
        try:
            request = await self.db.fetch_one("teacher_requests", {"id": request_id})
            if not request:
                return False

            # 1. Update request status
            await self.db.update("teacher_requests", 
                {"status": "APPROVED", "updated_at": datetime.utcnow().isoformat()}, 
                {"id": request_id}
            )

            # 2. Create assignment
            assignment_data = {
                "teacher_id": request["teacher_id"],
                "course_id": request["course_id"],
                "class_id": request["class_id"],
                "is_primary": True,
                "created_at": datetime.utcnow().isoformat()
            }
            await self.db.upsert("teacher_assignments", assignment_data, on_conflict="teacher_id, course_id, class_id")
            
            log.info("teacher_request_approved", request_id=request_id, teacher_id=request["teacher_id"])
            return True
        except Exception as e:
            log.error("approve_request_failed", error=str(e), request_id=request_id)
            return False

    async def get_teacher_assignments(self, teacher_id: str) -> List[dict]:
        """Fetch all class/course assignments for a specific teacher."""
        return await self.db.fetch_all("teacher_assignments", {"teacher_id": teacher_id})

    async def get_class_teachers(self, class_id: str, course_id: str) -> List[dict]:
        """Fetch all teachers assigned to a specific class and course."""
        return await self.db.fetch_all("teacher_assignments", {
            "class_id": class_id,
            "course_id": course_id
        })
