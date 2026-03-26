from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()

class AcademicStore:
    """
    Supabase store for Academic hierarchy, Credits, and Promotions.
    """

    def __init__(self):
        self.db = supabase_db

    async def get_student_enrollment(self, student_id: str) -> Optional[dict]:
        return await self.db.fetch_one("student_enrollments", {"student_id": student_id})

    async def get_student_credits(self, student_id: str) -> List[dict]:
        return await self.db.fetch_all("student_credits", {"student_id": student_id})

    async def get_classes(self, program_id: str, semester_id: str) -> List[dict]:
        """Fetch all classes/sections for a specific program and semester."""
        return await self.db.fetch_all("classes", {
            "program_id": program_id, 
            "semester_id": semester_id
        })

    async def get_class_by_id(self, class_id: str) -> Optional[dict]:
        return await self.db.fetch_one("classes", {"id": class_id})

    async def create_class(self, data: Dict[str, Any]) -> Optional[dict]:
        return await self.db.insert("classes", data)

    async def get_student_class_enrollment(self, student_id: str) -> Optional[dict]:
        """Fetch the student's enrollment including their class_id."""
        return await self.db.fetch_one("student_enrollments", {"student_id": student_id})

    async def update_credits(self, student_id: str, semester_id: str, earned: int, total: int):
        data = {
            "student_id": student_id,
            "semester_id": semester_id,
            "earned_credits": earned,
            "total_credits": total,
            "updated_at": datetime.utcnow().isoformat()
        }
        return await self.db.upsert("student_credits", data, on_conflict="student_id, semester_id")

    async def promote_student(self, student_id: str) -> Optional[dict]:
        """Promote student to the next semester in their program."""
        try:
            enrollment = await self.get_student_enrollment(student_id)
            if not enrollment:
                log.warning("promotion_failed_no_enrollment", student_id=student_id)
                return None

            program_id = enrollment["program_id"]
            current_sem_id = enrollment["current_semester_id"]

            # Fetch current semester number
            current_sem = await self.db.fetch_one("semesters", {"id": current_sem_id})
            if not current_sem:
                return None

            next_sem_num = current_sem["semester_number"] + 1
            
            # Find next semester
            next_sem = await self.db.fetch_one("semesters", {
                "program_id": program_id,
                "semester_number": next_sem_num
            })

            if not next_sem:
                log.info("promotion_limit_reached", student_id=student_id, program_id=program_id)
                return None

            # Update enrollment
            updated = await self.db.update("student_enrollments", 
                {"current_semester_id": next_sem["id"]}, 
                {"student_id": student_id}
            )
            
            log.info("student_promoted", student_id=student_id, to_semester=next_sem_num)
            return updated
        except Exception as e:
            log.error("promote_student_failed", error=str(e), student_id=student_id)
            return None

    # --- Department Methods ---

    async def get_departments(self, institution_id: str) -> List[dict]:
        """Fetch all departments for an institution."""
        return await self.db.fetch_all("departments", {"institution_id": institution_id})

    async def get_department_by_id(self, dept_id: str) -> Optional[dict]:
        return await self.db.fetch_one("departments", {"id": dept_id})

    async def get_department_by_hod(self, hod_id: str) -> Optional[dict]:
        return await self.db.fetch_one("departments", {"hod_id": hod_id})

    async def get_department_teachers(self, dept_id: str) -> List[dict]:
        """Fetch all teachers belonging to a specific department."""
        return await self.db.fetch_all("users", {"department_id": dept_id, "role": "teacher"})

    async def get_department_programs(self, dept_id: str) -> List[dict]:
        """Fetch all programs under a specific department."""
        return await self.db.fetch_all("programs", {"department_id": dept_id})

    async def get_department_students(self, dept_id: str) -> List[dict]:
        """Fetch all students belonging to a specific department."""
        return await self.db.fetch_all("users", {"department_id": dept_id, "role": "student"})
