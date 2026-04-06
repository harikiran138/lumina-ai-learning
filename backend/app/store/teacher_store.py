from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()

class TeacherStore:
    """
    Supabase store for Teacher requests and class assignments.
    """

    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db

    async def create_request(self, teacher_id: str, course_id: str, class_id: str, message: Optional[str] = None) -> Optional[dict]:
        """Teacher requests access to a specific course and class/section."""
        teacher = await self.db.fetch_one("users", {"id": teacher_id})
        department_id = teacher.get("department_id") if teacher else None
        status = "PENDING_HOD" if department_id else "PENDING_ADMIN"

        data = {
            "teacher_id": teacher_id,
            "course_id": course_id,
            "class_id": class_id,
            "department_id": department_id,
            "message": message,
            "status": status,
            "hod_status": "PENDING",
            "admin_status": "PENDING",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        data = {k: v for k, v in data.items() if v is not None}
        result = await self.db.insert_safe("teacher_requests", data)
        return result.get("data") if result.get("success") else None

    async def request_course_access(self, teacher_id: str, course_id: str, class_id: str, message: Optional[str] = None) -> Optional[dict]:
        """Backward-compatible alias for create_request."""
        return await self.create_request(teacher_id, course_id, class_id, message)

    async def get_pending_requests(self, status: str = "PENDING_ADMIN") -> List[dict]:
        """Fetch pending teacher access requests for Admin approval."""
        return await self.db.fetch_all("teacher_requests", {"status": status})

    async def approve_request_by_admin(self, request_id: str) -> bool:
        """Admin approval: approve a request and create a teacher assignment."""
        try:
            request = await self.db.fetch_one("teacher_requests", {"id": request_id})
            if not request:
                return False

            # 1. Update request status
            await self.db.update("teacher_requests", 
                {
                    "status": "APPROVED",
                    "admin_status": "APPROVED",
                    "admin_reviewed_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                }, 
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
            
            log.info("teacher_request_approved_admin", request_id=request_id, teacher_id=request["teacher_id"])
            return True
        except Exception as e:
            log.error("approve_request_admin_failed", error=str(e), request_id=request_id)
            return False

    async def approve_request_by_hod(self, request_id: str) -> bool:
        """HOD approval: move request to Admin stage."""
        try:
            request = await self.db.fetch_one("teacher_requests", {"id": request_id})
            if not request:
                return False

            await self.db.update(
                "teacher_requests",
                {
                    "status": "PENDING_ADMIN",
                    "hod_status": "APPROVED",
                    "hod_reviewed_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                },
                {"id": request_id},
            )
            log.info("teacher_request_approved_hod", request_id=request_id, teacher_id=request["teacher_id"])
            return True
        except Exception as e:
            log.error("approve_request_hod_failed", error=str(e), request_id=request_id)
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

    async def get_pending_requests_by_department(self, department_id: str) -> List[dict]:
        """Fetch pending teacher requests for a specific department."""
        # Prefer direct department filter if available
        requests = await self.db.fetch_all("teacher_requests", {"department_id": department_id, "status": "PENDING_HOD"})
        if not requests:
            # Fallback: derive by teacher department
            teachers = await self.db.fetch_all("users", {"role": "teacher", "department_id": department_id})
            dept_teacher_ids = {t["id"] for t in teachers}
            if not dept_teacher_ids:
                return []
            all_pending = await self.db.fetch_all("teacher_requests", {"status": "PENDING_HOD"})
            requests = [r for r in all_pending if r["teacher_id"] in dept_teacher_ids]
        
        # Enrich results for HOD dashboard
        enriched = []
        for r in requests:
            teacher = await self.db.fetch_one("users", {"id": r["teacher_id"]})
            course = await self.db.fetch_one("courses", {"id": r.get("course_id")})
            
            program_name = "N/A"
            semester_number = 0
            
            if course:
                program = await self.db.fetch_one("programs", {"id": course.get("program_id")})
                if program:
                    program_name = program.get("program_name")
                
                semester = await self.db.fetch_one("semesters", {"id": course.get("semester_id")})
                if semester:
                    semester_number = semester.get("semester_number")

            enriched.append({
                **r,
                "teacher_name": teacher.get("name") if teacher else "Unknown",
                "course_name": course.get("course_name") if course else "Unknown",
                "program_name": program_name,
                "semester_number": semester_number
            })
        return enriched

    async def reject_request_by_admin(self, request_id: str) -> bool:
        """Admin rejection of a teacher access request."""
        try:
            await self.db.update(
                "teacher_requests",
                {
                    "status": "REJECTED",
                    "admin_status": "REJECTED",
                    "admin_reviewed_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                },
                {"id": request_id}
            )
            log.info("teacher_request_rejected_admin", request_id=request_id)
            return True
        except Exception as e:
            log.error("reject_request_admin_failed", error=str(e), request_id=request_id)
            return False

    async def reject_request_by_hod(self, request_id: str) -> bool:
        """HOD rejection of a teacher access request."""
        try:
            await self.db.update(
                "teacher_requests",
                {
                    "status": "REJECTED",
                    "hod_status": "REJECTED",
                    "hod_reviewed_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                },
                {"id": request_id},
            )
            log.info("teacher_request_rejected_hod", request_id=request_id)
            return True
        except Exception as e:
            log.error("reject_request_hod_failed", error=str(e), request_id=request_id)
            return False

    async def update_request_status(self, request_id: str, status: str) -> bool:
        """Admin update: approve or reject a request."""
        if status == "APPROVED":
            return await self.approve_request_by_admin(request_id)
        if status == "REJECTED":
            return await self.reject_request_by_admin(request_id)
        return False
