from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from app.store.base_store import BaseStoreMixin
from datetime import datetime
import re

log = structlog.get_logger()


class StudentStore(BaseStoreMixin):
    """
    Store for student-specific operations: Enrollment, Progress, Badges, Certificates.
    Operates on 'enrollments' and 'users' tables in Supabase.
    """

    def __init__(self, db: Optional[Any] = None):
        # Allow injecting a scoped database, otherwise fall back to global supabase_db
        self.db = db or supabase_db

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
        Uses safe insert with schema discovery.
        """
        existing = await self.get_enrollment(student_id, course_id)
        if existing:
            log.debug("already_enrolled", student_id=student_id, course_id=course_id)
            return True

        # Ensure progress object is fully initialized with defaults
        enrollment_data = {
            "student_id": student_id,
            "course_id": course_id,
            "status": "active",
            "progress": {
                "completed_lessons": [],
                "mastery": 0.0,
                "hours_spent": 0.0,
                "streak": 0,
                "last_accessed": datetime.utcnow().isoformat(),
            }
        }

        success, result, error = await self.insert_safely(
            "enrollments",
            enrollment_data,
            student_id=student_id,
            course_id=course_id
        )
        return success

    async def get_enrollment(self, student_id: str, course_id: str) -> Optional[dict]:
        """Fetch course-level enrollment record (course progress tracking)."""
        try:
            response = await self.db.table("student_enrollments").select("*").eq("student_id", student_id).eq("course_id", course_id).async_execute()
            if response.data:
                return response.data[0]
            # Fallback to legacy table if student_enrollments has no course_id column yet
            response = await self.db.table("enrollments").select("*").eq("student_id", student_id).eq("course_id", course_id).async_execute()
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
            completed_lessons = progress.get("completed_lessons") or []
            if lesson_id not in completed_lessons:
                completed_lessons.append(lesson_id)
            
            # Fetch course to calculate progress percentage
            course_res = await self.db.table("courses").select("modules").eq("id", course_id).async_execute()
            total_lessons = 0
            if course_res.data:
                modules = course_res.data[0].get("modules", [])
                for m in modules:
                    total_lessons += len(m.get("lessons", []))
            
            progress_pct = (len(completed_lessons) / total_lessons * 100) if total_lessons > 0 else 0
            
            progress["completed_lessons"] = completed_lessons
            progress["last_accessed"] = datetime.utcnow().isoformat()
            
            updates = {
                "progress": progress
            }
            
            await self.db.update("enrollments", updates, {"id": enrollment["id"]})

            return {"success": True, "lesson_id": lesson_id, "progress": progress_pct}
        except Exception as e:
            log.error("complete_lesson_failed", student_id=student_id, lesson_id=lesson_id, error=str(e))
            return {"success": False}

    async def get_enrollments_by_class(self, class_id: str) -> List[dict]:
        """Fetch all student enrollments for a specific class/section."""
        try:
            # Table is 'student_enrollments' in some schemas, 'enrollments' in others.
            # BaseStoreMixin typically handles mapping, but we'll try 'student_enrollments' first as it's the specific join table for classes.
            response = await self.db.table("student_enrollments").select("*").eq("class_id", class_id).async_execute()
            return response.data or []
        except Exception as e:
            log.error("get_enrollments_by_class_failed", class_id=class_id, error=str(e))
            return []

    async def get_enrollments_by_batch_and_section(self, batch_id: str, section: Optional[str] = None) -> List[dict]:
        """Fetch student enrollments for a batch, optionally filtered by section."""
        try:
            query = self.db.table("student_enrollments").select("*").eq("batch_id", batch_id)
            if section:
                query = query.eq("section", section)
            res = await query.async_execute()
            return res.data or []
        except Exception as e:
            log.error("get_enrollments_by_batch_and_section_failed", batch_id=batch_id, section=section, error=str(e))
            return []

    async def get_enrollments_by_student_ids(self, student_ids: List[str]) -> List[dict]:
        """Fetch all enrollments for a list of student IDs."""
        if not student_ids: return []
        try:
            res = await self.db.table("student_enrollments").select("*").in_("student_id", student_ids).async_execute()
            return res.data or []
        except Exception as e:
            log.error("get_enrollments_by_student_ids_failed", error=str(e))
            return []

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
            # Badges might be in learner_profiles
            response = await self.db.table("learner_profiles").select("metadata").eq("student_id", student_id).async_execute()
            if response.data:
                return response.data[0].get("metadata", {}).get("badges", [])
        except Exception as e:
            log.error("get_badges_failed", student_id=student_id, error=str(e))
        return []

    async def update_mastery(self, student_id: str, course_id: str, mastery: float) -> bool:
        """Update student mastery level with a floor of 0.0."""
        success, enrollment, error = await self.fetch_one_safely(
            "enrollments",
            {"student_id": student_id, "course_id": course_id},
            student_id=student_id,
            course_id=course_id
        )
        if not success or not enrollment:
            log.warning("update_mastery_not_enrolled", student_id=student_id, course_id=course_id)
            return False
        
        progress = enrollment.get("progress") or {}
        # Enforce non-negative mastery
        progress["mastery"] = max(0.0, float(mastery))
        
        success, _, _ = await self.update_safely(
            "enrollments",
            {"progress": progress},
            {"student_id": student_id, "course_id": course_id},
            student_id=student_id,
            mastery=mastery
        )
        return success

    async def log_activity(self, student_id: str, course_id: str, duration_minutes: int) -> bool:
        """
        Logs activity time and updates streak in enrollment progress.
        Uses safe update with schema discovery.
        """
        success, enrollment, error = await self.fetch_one_safely(
            "enrollments",
            {"student_id": student_id, "course_id": course_id},
            student_id=student_id,
            course_id=course_id
        )
        if not success or not enrollment:
            log.warning("log_activity_not_enrolled", student_id=student_id, course_id=course_id)
            return False

        progress = enrollment.get("progress") or {}
        now = datetime.utcnow()
        new_hours = (progress.get("hours_spent") or 0.0) + (duration_minutes / 60.0)
        new_streak = progress.get("streak") or 0
        last_accessed_str = progress.get("last_accessed")
        
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

        progress["hours_spent"] = round(new_hours, 2)
        progress["streak"] = new_streak
        progress["last_accessed"] = now.isoformat()

        updates = {"progress": progress}

        success, _, _ = await self.update_safely(
            "enrollments",
            updates,
            {"id": enrollment["id"]},
            student_id=student_id,
            duration_minutes=duration_minutes
        )
        return success

    async def generate_parent_link_code(self, student_id: str) -> str:
        """
        Generates a new 8-character connection code for a student.
        Format: LUM-XXXXXX
        Includes a retry loop to ensure uniqueness.
        """
        import secrets
        import string
        from datetime import datetime, timedelta
        
        client = self.db.get_client()
        
        # 1. Expire all previous pending codes for this student
        try:
            await client.table("parent_student_links").update({
                "status": "expired"
            }).eq("student_id", student_id).eq("status", "pending").async_execute()
        except Exception as e:
            log.warning("expire_previous_codes_failed", student_id=student_id, error=str(e))

        # 2. Generate unique code with retry logic
        link_code = None
        for attempt in range(5):
            random_part = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            candidate_code = f"LUM-{random_part}"
            
            # Check for collision
            existing = await client.table("parent_student_links").select("id").eq("link_code", candidate_code).async_execute()
            if not existing.data:
                link_code = candidate_code
                break
        
        if not link_code:
            log.error("code_generation_collision_limit", student_id=student_id)
            raise Exception("Failed to generate a unique connection code after multiple attempts.")

        # 3. Create the new link record
        expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        
        link_data = {
            "student_id": student_id,
            "link_code": link_code,
            "status": "pending",
            "expires_at": expires_at,
            "created_at": datetime.utcnow().isoformat()
        }
        
        try:
            await client.table("parent_student_links").insert(link_data).async_execute()
            
            # Sync to users table for convenience (legacy fields)
            try:
                await client.table("users").update({"parent_link_code": link_code}).eq("id", student_id).async_execute()
            except Exception as ue:
                log.warning("sync_link_code_to_users_failed_non_fatal", error=str(ue))

            log.info("generate_parent_link_code_success", student_id=student_id, code=link_code)
            return link_code
        except Exception as e:
            log.error("save_parent_link_code_failed", student_id=student_id, error=str(e))
            raise e

    async def get_current_parent_link_code(self, student_id: str) -> Optional[dict]:
        """
        Retrieves the current active (pending) link code for a student if it's not expired.
        """
        from datetime import datetime
        try:
            client = self.db.get_client()
            response = await client.table("parent_student_links").select("*").eq("student_id", student_id).eq("status", "pending").order("created_at", desc=True).limit(1).async_execute()
            
            if response.data:
                link = response.data[0]
                expires_at = link.get("expires_at")
                if expires_at:
                    expiry_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00")).replace(tzinfo=None)
                    if expiry_dt > datetime.utcnow():
                        return link
                    else:
                        # Auto-expire if found expired
                        await client.table("parent_student_links").update({"status": "expired"}).eq("id", link["id"]).async_execute()
            return None
        except Exception as e:
            log.error("get_current_parent_link_code_failed", student_id=student_id, error=str(e))
            return None

    async def get_parent_link_status(self, student_id: str) -> Dict[str, Any]:
        """
        Retrieves the status of the parent-student link.
        Returns: {
            "status": "linked" | "pending" | "none", 
            "parent_name": str | None,
            "linked_at": iso_ts | None,
            "code": str | None,
            "expires_at": iso_ts | None
        }
        """
        try:
            client = self.db.get_client()
            
            # 1. Check for active link
            response = await client.table("parent_student_links").select(
                "status, linked_at, parent_id, users!parent_id(name)"
            ).eq("student_id", student_id).eq("status", "linked").order("linked_at", desc=True).limit(1).async_execute()
            
            if response.data:
                link = response.data[0]
                # Safely extract parent name from the joined users table
                # The join alias 'users!parent_id' maps to the parent's user record
                parent_info = link.get("users", {})
                parent_name = parent_info.get("name") if isinstance(parent_info, dict) else "Parent"
                
                return {
                    "status": "linked",
                    "parent_name": parent_name or "Parent",
                    "linked_at": link.get("linked_at")
                }
            
            # 2. Check for pending code
            pending = await self.get_current_parent_link_code(student_id)
            if pending:
                return {
                    "status": "pending",
                    "code": pending.get("link_code"),
                    "expires_at": pending.get("expires_at"),
                    "created_at": pending.get("created_at")
                }
            
            return {"status": "none"}
        except Exception as e:
            log.error("get_parent_link_status_failed", student_id=student_id, error=str(e))
            return {"status": "error", "message": str(e)}
