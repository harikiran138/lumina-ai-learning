from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime
import re

log = structlog.get_logger()


class StudentStore:
    """
    Store for student-specific operations: Enrollment, Progress, Badges, Certificates.
    Operates on 'student_progress' and 'users' tables in Supabase.
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
        Enrolls a student in a course. Creates a progress record.
        """
        existing = await self.get_enrollment(student_id, course_id)
        if existing:
            return True

        progress_data = {
            "student_id": student_id,
            "course_id": course_id,
            "concept_id": None,
            "completed_lessons": [],
            "mastery": 0.0,
            "hours_spent": 0.0,
            "streak": 0,
            "last_accessed": None,
        }

        try:
            result = await self.db.insert("student_progress", progress_data)
            return bool(result)
        except Exception as e:
            log.error("enroll_in_course_failed", student_id=student_id, course_id=course_id, error=str(e))
            return False

    async def get_enrollment(self, student_id: str, course_id: str) -> Optional[dict]:
        try:
            client = self.db.get_client()
            response = client.table("student_progress").select("*").eq("student_id", student_id).eq("course_id", course_id).execute()
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

            completed_lessons = enrollment.get("completed_lessons") or []
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
            
            updates = {
                "completed_lessons": completed_lessons,
                "last_accessed": datetime.utcnow().isoformat(),
            }
            
            await self.db.update("student_progress", updates, {"id": enrollment["id"]})

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
            response = client.table("learner_profiles").select("metadata").eq("student_id", student_id).execute()
            if response.data:
                return response.data[0].get("metadata", {}).get("badges", [])
        except Exception as e:
            log.error("get_badges_failed", student_id=student_id, error=str(e))
        return []

    async def update_mastery(self, student_id: str, course_id: str, mastery_score: float) -> bool:
        """
        Updates the mastery score in the enrollment progress.
        """
        try:
            enrollment = await self.get_enrollment(student_id, course_id)
            if not enrollment:
                return False

            updates = {
                "mastery": round(mastery_score, 2)
                # "last_accessed": datetime.utcnow().isoformat()
            }

            client = self.db.get_client()
            client.table("student_progress").update(updates).eq("id", enrollment["id"]).execute()
            return True
        except Exception as e:
            log.error("update_mastery_failed", student_id=student_id, course_id=course_id, error=str(e))
            return False

    async def log_activity(self, student_id: str, course_id: str, duration_minutes: int) -> bool:
        """
        Logs activity time and updates streak in enrollment progress.
        """
        try:
            enrollment = await self.get_enrollment(student_id, course_id)
            if not enrollment:
                return False

            now = datetime.utcnow()
            new_hours = (enrollment.get("hours_spent") or 0.0) + (duration_minutes / 60.0)
            new_streak = enrollment.get("streak") or 0
            last_accessed_str = enrollment.get("last_accessed")
            
            if last_accessed_str:
                last_accessed = self._parse_timestamp(last_accessed_str)
                if last_accessed:
                    delta = (now.date() - last_accessed.date()).days
                    if delta == 1:
                        new_streak += 1
                    elif delta > 1:
                        new_streak = 1
                    elif new_streak == 0:
                        new_streak = 1
                else:
                    new_streak = 1
            else:
                new_streak = 1

            updates = {
                "hours_spent": round(new_hours, 2),
                "streak": new_streak,
                "last_accessed": now.isoformat(),
            }

            await self.db.update("student_progress", updates, {"id": enrollment["id"]})
            return True
        except Exception as e:
            log.error("log_activity_failed", student_id=student_id, error=str(e))
            return False
