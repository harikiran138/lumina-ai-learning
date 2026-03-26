from typing import List, Dict, Optional
from uuid import UUID
from app.store.curriculum_store import CurriculumStore
from app.core.logging import structlog

log = structlog.get_logger()

class CurriculumPolicyEngine:
    """
    Enforces the AI Tutoring scope based on the student's academic placement.
    Restricts AI assistance to the current and previous semesters' curriculum.
    """
    
    def __init__(self):
        self.curriculum_store = CurriculumStore()

    async def get_student_scope(self, student_id: UUID) -> Dict:
        """
        Calculates the boundary of knowledge for a student.
        Returns allowed course codes and semester info.
        """
        try:
            # Fetch student's current enrollment
            enrollment = await self.curriculum_store.get_student_enrollment(student_id)
            
            if not enrollment:
                return {
                    "is_enrolled": False,
                    "current_semester": None,
                    "program_name": None,
                    "allowed_semesters": [],
                    "message": "Student is not enrolled in any program."
                }

            current_sem_num = enrollment["semester_number"]
            program_name = enrollment["program_name"]

            allowed_courses = await self.curriculum_store.get_allowed_courses(student_id)
            allowed_codes = [c['code'] for c in allowed_courses]
            
            return {
                "is_enrolled": True,
                "current_semester": enrollment["semester_title"],
                "program_name": enrollment["program_name"],
                "allowed_course_codes": allowed_codes,
                "scope_rule": "AI assistance is strictly limited to courses within and before the current semester."
            }
        except Exception as e:
            log.error("get_student_scope_failed", error=str(e), student_id=str(student_id))
            return {"error": "Failed to determine AI scope"}

    def validate_topic_access(self, scope: Dict, topic_course_code: str) -> bool:
        """Checks if a specific topic/course is within the student's allowed scope."""
        if not scope.get("is_enrolled"):
            return True # Or False, depending on default policy. For "Strict", likely False.
            
        return topic_course_code in scope.get("allowed_course_codes", [])
