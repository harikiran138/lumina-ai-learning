from typing import List, Optional
from datetime import datetime
import uuid
from app.database.supabase_manager import supabase_db
from app.database.models import Course
from app.core.logging import structlog
from app.store.local_store import LocalJsonStore

log = structlog.get_logger()


class CourseStore:
    """
    Supabase (PostgreSQL) store for Courses.
    All methods are ASYNC.
    """

    def __init__(self):
        self.client = supabase_db.get_client()
        self.local = LocalJsonStore()

    def _normalize_course(self, course: Optional[dict]) -> Optional[dict]:
        if not course:
            return course

        normalized = course.copy()
        name = (
            normalized.get("name")
            or normalized.get("title")
            or normalized.get("course_name")
            or "Untitled Course"
        )
        code = normalized.get("code") or normalized.get("course_code")

        normalized["name"] = name
        normalized["title"] = normalized.get("title") or name
        normalized["course_name"] = normalized.get("course_name") or name

        if code:
            normalized["code"] = code
            normalized["course_code"] = normalized.get("course_code") or code

        if normalized.get("thumbnail") is None and normalized.get("thumbnail_url"):
            normalized["thumbnail"] = normalized["thumbnail_url"]

        normalized["image"] = (
            normalized.get("image")
            or normalized.get("thumbnail")
            or "https://placehold.co/1200x675/0a0a0a/FFF?text=Lumina+Course"
        )
        normalized["modules"] = normalized.get("modules") or []
        normalized["students"] = normalized.get("students") or normalized.get("student_count") or 0
        normalized["duration"] = normalized.get("duration") or "Self-paced"
        normalized["rating"] = normalized.get("rating") or 0
        normalized["level"] = normalized.get("level") or "General"
        normalized["lastUpdated"] = (
            normalized.get("lastUpdated")
            or normalized.get("updated_at")
            or normalized.get("updatedAt")
            or normalized.get("created_at")
            or normalized.get("createdAt")
            or ""
        )

        published = normalized.get("is_published")
        if published is None:
            published = normalized.get("published")
        status = normalized.get("status")
        if not status:
            status = "Published" if published else "Draft"

        normalized["status"] = status
        normalized["is_published"] = bool(published) if published is not None else status.lower() in {
            "published",
            "active",
            "live",
        }
        return normalized

    @property
    def courses_collection(self):
        """Supabase uses 'courses' table."""
        if self.client is None:
            return None
        return self.client.table("courses")

    async def create_course(self, name: str, code: str, description: str, teacher_id: str) -> dict:
        course_data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "title": name,
            "course_name": name,
            "code": code,
            "course_code": code,
            "description": description,
            "teacher_id": teacher_id,
            "modules": [],
            "created_at": datetime.utcnow().isoformat(),
        }

        if self.client is None:
            payload = self.local.read()
            payload["courses"].append(course_data)
            self.local.write(payload)
            return self._normalize_course(course_data)

        try:
            response = self.courses_collection.insert(course_data).execute()
            if response.data:
                return self._normalize_course(response.data[0])
            raise Exception("Failed to create course")
        except Exception as e:
            log.error("create_course_failed", error=str(e))
            raise e

    async def list_courses(self) -> List[dict]:
        if self.client is None:
            payload = self.local.read()
            return [self._normalize_course(course) for course in payload["courses"]]
        try:
            response = self.courses_collection.select("*").execute()
            return [self._normalize_course(course) for course in response.data]
        except Exception as e:
            log.error("list_courses_failed", error=str(e))
            return []

    async def get_course_by_code(self, code: str) -> Optional[dict]:
        if self.client is None:
            payload = self.local.read()
            for course in payload["courses"]:
                if course.get("course_code") == code or course.get("code") == code:
                    return self._normalize_course(course)
            return None
        try:
            response = self.courses_collection.select("*").eq("course_code", code).execute()
            if response.data:
                return self._normalize_course(response.data[0])
        except Exception as e:
            log.error("get_course_by_code_failed", error=str(e))
        return None

    async def get_course_by_id(self, course_id: str) -> Optional[dict]:
        if self.client is None:
            payload = self.local.read()
            for course in payload["courses"]:
                if course.get("id") == course_id:
                    return self._normalize_course(course)
            return None
        try:
            response = self.courses_collection.select("*").eq("id", course_id).execute()
            if response.data:
                return self._normalize_course(response.data[0])
        except Exception as e:
            log.error("get_course_by_id_failed", error=str(e))
        return None

    async def update_course(self, course_id: str, updates: dict) -> bool:
        if self.client is None:
            updates = updates.copy()
            updates.pop("id", None)
            if "name" in updates:
                updates["course_name"] = updates.pop("name")
            if "title" in updates and "course_name" not in updates:
                updates["course_name"] = updates.pop("title")
            else:
                updates.pop("title", None)
            if "code" in updates:
                updates["course_code"] = updates.pop("code")

            payload = self.local.read()
            updated = False
            for course in payload["courses"]:
                if course.get("id") == course_id:
                    course.update(updates)
                    if "course_name" in updates:
                        course["name"] = updates["course_name"]
                        course["title"] = updates["course_name"]
                    if "course_code" in updates:
                        course["code"] = updates["course_code"]
                    updated = True
                    break
            if updated:
                self.local.write(payload)
            return updated
        try:
            # PostgreSQL/Supabase doesn't like some fields in update
            updates.pop("id", None)
            if "name" in updates:
                updates["course_name"] = updates.pop("name")
            if "title" in updates and "course_name" not in updates:
                updates["course_name"] = updates.pop("title")
            else:
                updates.pop("title", None)
            if "code" in updates:
                updates["course_code"] = updates.pop("code")
            response = self.courses_collection.update(updates).eq("id", course_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_course_failed", error=str(e))
            return False

    async def delete_course(self, course_id: str) -> bool:
        if self.client is None:
            payload = self.local.read()
            original = len(payload["courses"])
            payload["courses"] = [course for course in payload["courses"] if course.get("id") != course_id]
            payload["progress"] = [
                item for item in payload["progress"] if item.get("courseId") != course_id
            ]
            payload["assignments"] = [
                item for item in payload["assignments"] if item.get("course_id") != course_id
            ]
            self.local.write(payload)
            return len(payload["courses"]) != original
        try:
            response = self.courses_collection.delete().eq("id", course_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("delete_course_failed", error=str(e))
            return False

    async def get_courses_by_teacher(self, teacher_id: str) -> List[dict]:
        if self.client is None:
            payload = self.local.read()
            return [
                self._normalize_course(course)
                for course in payload["courses"]
                if course.get("teacher_id") == teacher_id
            ]
        try:
            response = self.courses_collection.select("*").eq("teacher_id", teacher_id).execute()
            return [self._normalize_course(course) for course in response.data]
        except Exception as e:
            log.error("get_courses_by_teacher_failed", error=str(e))
            return []

    async def add_module(self, course_id: str, module: dict) -> bool:
        try:
            course = await self.get_course_by_id(course_id)
            if not course:
                return False
            modules = course.get("modules") or []
            modules.append(module)
            if self.client is None:
                return await self.update_modules(course_id, modules)
            response = self.courses_collection.update({"modules": modules}).eq("id", course_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("add_module_failed", error=str(e))
            return False

    async def update_modules(self, course_id: str, modules: list) -> bool:
        if self.client is None:
            payload = self.local.read()
            updated = False
            for course in payload["courses"]:
                if course.get("id") == course_id:
                    course["modules"] = modules
                    updated = True
                    break
            if updated:
                self.local.write(payload)
            return updated
        try:
            response = self.courses_collection.update({"modules": modules}).eq("id", course_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_modules_failed", error=str(e))
            return False
