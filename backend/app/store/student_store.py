from typing import List, Dict, Any
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()


class StudentStore:
    """
    Store for student-specific operations: Enrollment, Progress, Badges, Certificates.
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    @property
    def progress_collection(self):
        return self.client.table("progress")

    @property
    def users_collection(self):
        return self.client.table("users")

    @property
    def courses_collection(self):
        return self.client.table("courses")

    @property
    def certificates_collection(self):
        return self.client.table("certificates")

    async def enroll_in_course(self, student_id: str, course_id: str) -> bool:
        """
        Enrolls a student in a course. Creates a progress record.
        """
        try:
            # Check if already enrolled
            response = self.progress_collection.select("*").eq("userId", student_id).eq("courseId", course_id).execute()
            if response.data:
                return False

            # Create progress record
            progress_record = {
                "userId": student_id,
                "courseId": course_id,
                "progress": 0,
                "mastery": 0,
                "streak": 0,
                "completedLessons": [],
                "lastAccessed": datetime.utcnow().isoformat(),
                "enrolledAt": datetime.utcnow().isoformat(),
            }

            self.progress_collection.insert(progress_record).execute()

            # Increment course enrollment count
            # Note: Supabase doesn't have native '$inc', we might need to fetch and update or use an RPC
            # For now, let's just attempt a basic update if needed, but 'enrolledCount' might not be in the current schema
            return True
        except Exception as e:
            log.error(
                "enroll_in_course_failed", student_id=student_id, course_id=course_id, error=str(e)
            )
            return False

    async def complete_lesson(
        self, student_id: str, course_id: str, lesson_id: str
    ) -> Dict[str, Any]:
        """
        Marks a lesson as complete.
        """
        try:
            # Fetch current progress to append lesson_id
            response = self.progress_collection.select("completedLessons").eq("userId", student_id).eq("courseId", course_id).execute()
            if not response.data:
                return {"success": False}

            completed_lessons = response.data[0].get("completedLessons", [])
            if lesson_id not in completed_lessons:
                completed_lessons.append(lesson_id)
            
            self.progress_collection.update({
                "completedLessons": completed_lessons,
                "lastAccessed": datetime.utcnow().isoformat()
            }).eq("userId", student_id).eq("courseId", course_id).execute()

            return {"success": True, "lesson_id": lesson_id}
        except Exception as e:
            log.error(
                "complete_lesson_failed", student_id=student_id, lesson_id=lesson_id, error=str(e)
            )
            return {"success": False}

    async def get_certificates(self, student_id: str) -> List[Dict]:
        """
        Fetches all certificates for a student.
        """
        try:
            response = self.certificates_collection.select("*").eq("userId", student_id).order("issueDate", desc=True).execute()
            return response.data
        except Exception as e:
            log.error("get_certificates_failed", student_id=student_id, error=str(e))
            return []

    async def get_badges(self, student_id: str) -> List[Dict]:
        """
        Fetches all badges for a student from their user record.
        """
        try:
            response = self.users_collection.select("badges").eq("id", student_id).execute()
            if response.data and "badges" in response.data[0]:
                return response.data[0]["badges"]
        except Exception as e:
            log.error("get_badges_failed", student_id=student_id, error=str(e))
        return []
