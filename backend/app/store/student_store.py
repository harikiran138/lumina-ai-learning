from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime
import re

log = structlog.get_logger()


class StudentStore:
    """
    Store for student-specific operations: Enrollment, Progress, Badges, Certificates.
    Operates on 'enrollments' and 'users' tables in Supabase.
    """

    def __init__(self):
        self.db = supabase_db

    def _parse_timestamp(self, value: str):
        if not value:
            return None
        normalized = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            # Handle potential fractional precision issues
            match = re.match(
                r"^(?P<head>.+?\.)?(?P<fraction>\d+)(?P<tz>[+-]\d{2}:\d{2})$",
                normalized,
            )
            if match:
                head = match.group("head") or ""
                fraction = match.group("fraction")
                tz = match.group("tz")
                padded = fraction[:6].ljust(6, "0")
                if not head.endswith("."):
                    head = f"{head}."
                return datetime.fromisoformat(f"{head}{padded}{tz}")
            return None

    async def enroll_in_course(self, student_id: str, course_id: str) -> bool:
        """
        Enrolls a student in a course. Creates an enrollment record.
        """
        enrollment_data = {
            "student_id": student_id,
            "course_id": course_id,
            "progress": {
                "percentage": 0,
                "mastery": 0,
                "streak": 0,
                "completedLessons": [],
                "hoursSpent": 0,
                "lastAccessed": datetime.utcnow().isoformat()
            },
            "status": "active"
        }

        try:
            # Check if already enrolled
            client = self.db.get_client()
            response = client.table("enrollments").select("*").eq("student_id", student_id).eq("course_id", course_id).execute()
            if response.data:
                return False

            # Create record
            await self.db.insert("enrollments", enrollment_data)
            return True
        except Exception as e:
            log.error("enroll_in_course_failed", student_id=student_id, course_id=course_id, error=str(e))
            return False

    async def get_enrollment(self, student_id: str, course_id: str) -> Optional[dict]:
        try:
            client = self.db.get_client()
            response = client.table("enrollments").select("*").eq("student_id", student_id).eq("course_id", course_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("get_enrollment_failed", student_id=student_id, course_id=course_id, error=str(e))
            return None

    async def complete_lesson(
        self, student_id: str, course_id: str, lesson_id: str
    ) -> Dict[str, Any]:
        """
        Marks a lesson as complete within the enrollment progress.
        """
        try:
            enrollment = await self.get_enrollment(student_id, course_id)
            if not enrollment:
                return {"success": False, "error": "Not enrolled"}

            progress = enrollment.get("progress") or {}
            completed_lessons = progress.get("completedLessons", [])
            if lesson_id not in completed_lessons:
                completed_lessons.append(lesson_id)
            
            # Fetch course to calculate progress percentage
            client = self.db.get_client()
            course_res = client.table("courses").select("modules").eq("id", course_id).execute()
            total_lessons = 0
            if course_res.data:
                modules = course_res.data[0].get("modules", [])
                for m in modules:
                    total_lessons += len(m.get("lessons", []))
            
            progress_pct = (len(completed_lessons) / total_lessons * 100) if total_lessons > 0 else 0
            
            progress.update({
                "completedLessons": completed_lessons,
                "percentage": int(round(progress_pct)),
                "lastAccessed": datetime.utcnow().isoformat()
            })
            
            await self.db.update("enrollments", {"progress": progress}, {"id": enrollment["id"]})

            return {"success": True, "lesson_id": lesson_id, "progress": progress_pct}
        except Exception as e:
            log.error("complete_lesson_failed", student_id=student_id, lesson_id=lesson_id, error=str(e))
            return {"success": False}

    async def get_certificates(self, student_id: str) -> List[Dict]:
        """
        Fetches certificates (stored in progress metadata or separate table).
        For now, returns empty or from a dedicated table if we decide to add it.
        """
        return []

    async def get_badges(self, student_id: str) -> List[Dict]:
        """
        Fetches badges from user profile metadata.
        """
        try:
            client = self.db.get_client()
            # Badges might be in learner_profiles
            response = client.table("learner_profiles").select("metadata").eq("user_id", student_id).execute()
            if response.data:
                return response.data[0].get("metadata", {}).get("badges", [])
        except Exception as e:
            log.error("get_badges_failed", student_id=student_id, error=str(e))
        return []

    async def log_activity(self, student_id: str, course_id: str, duration_minutes: int) -> bool:
        """
        Logs activity time and updates streak in enrollment progress.
        """
        try:
            enrollment = await self.get_enrollment(student_id, course_id)
            if not enrollment:
                return False

            progress = enrollment.get("progress") or {}
            current_hours = progress.get("hoursSpent", 0)
            current_streak = progress.get("streak", 0)
            last_accessed_str = progress.get("lastAccessed")
            
            now = datetime.utcnow()
            new_hours = current_hours + (duration_minutes / 60.0)
            new_streak = current_streak
            
            if last_accessed_str:
                last_accessed = self._parse_timestamp(last_accessed_str)
                if last_accessed:
                    delta = (now.date() - last_accessed.date()).days
                    if delta == 1:
                        new_streak += 1
                    elif delta > 1:
                        new_streak = 1
                    elif current_streak == 0:
                        new_streak = 1
                else:
                    new_streak = 1
            else:
                new_streak = 1

            progress.update({
                "hoursSpent": round(new_hours, 2),
                "streak": new_streak,
                "lastAccessed": now.isoformat()
            })

            await self.db.update("enrollments", {"progress": progress}, {"id": enrollment["id"]})
            return True
        except Exception as e:
            log.error("log_activity_failed", student_id=student_id, error=str(e))
            return False
