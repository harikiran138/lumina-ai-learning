from typing import List, Optional
from datetime import datetime
import uuid
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class CourseStore:
    """
    Supabase (PostgreSQL) store for Courses.
    """

    def __init__(self):
        self.db = supabase_db

    def _normalize_course(self, course: Optional[dict]) -> Optional[dict]:
        if not course:
            return None

        normalized = course.copy()
        
        # v2.0 uses 'name' and 'code' directly
        title = normalized.get("name") or "Untitled Course"
        code = normalized.get("code")
        
        normalized["title"] = title  # For frontend compatibility
        normalized["name"] = title
        normalized["code"] = code

        # Thumbnail / Image normalization
        img = normalized.get("image_url") or normalized.get("thumbnail_url")
        if not img:
            img = "https://placehold.co/1200x675/0a0a0a/FFF?text=Lumina+Course"
        
        normalized["image"] = img
        normalized["thumbnail_url"] = img
        
        # Metadata / Stats
        normalized["modules"] = normalized.get("modules") or []
        
        # Status normalization
        published = normalized.get("is_published", False)
        normalized["status"] = "Published" if published else "Draft"
        
        return normalized

    async def create_course(self, name: str, code: str, description: str, teacher_id: str, subject: str = "general") -> dict:
        course_data = {
            "name": name,
            "code": code,
            "description": description,
            "teacher_id": teacher_id,
            "subject": subject,
            "modules": [],
            "is_published": False
        }

        try:
            result = await self.db.insert("courses", course_data)
            if result:
                return self._normalize_course(result)
            raise Exception("Failed to create course")
        except Exception as e:
            log.error("create_course_failed", error=str(e), code=code)
            raise e

    async def create_course_from_blueprint(self, blueprint: dict, teacher_id: str) -> dict:
        title = blueprint.get("title", "Untitled Course")
        code = blueprint.get("code") or f"c-{str(uuid.uuid4())[:8]}"
        
        course_data = {
            "title": title,
            "course_name": title,
            "code": code,
            "course_code": code,
            "description": blueprint.get("description", ""),
            "teacher_id": teacher_id,
            "modules": blueprint.get("modules", []),
            "estimated_duration": blueprint.get("estimated_duration", ""),
            "is_published": False,
            "metadata": blueprint.get("metadata", {})
        }

        try:
            result = await self.db.insert("courses", course_data)
            if result:
                return self._normalize_course(result)
            raise Exception("Failed to create course from blueprint")
        except Exception as e:
            log.error("create_course_from_blueprint_failed", error=str(e), code=code)
            raise e

    async def list_courses(self) -> List[dict]:
        try:
            courses = await self.db.fetch_all("courses")
            return [self._normalize_course(course) for course in courses]
        except Exception as e:
            log.error("list_courses_failed", error=str(e))
            return []

    async def get_course_by_code(self, code: str) -> Optional[dict]:
        try:
            client = self.db.get_client()
            response = client.table("courses").select("*").or_(f"code.eq.{code},course_code.eq.{code}").execute()
            if response.data:
                return self._normalize_course(response.data[0])
        except Exception as e:
            log.error("get_course_by_code_failed", error=str(e), code=code)
        return None

    async def get_course_by_id(self, course_id: str) -> Optional[dict]:
        return await self.db.fetch_one("courses", {"id": course_id})

    async def update_course(self, course_id: str, updates: dict) -> bool:
        # Cleanup updates for PostgreSQL
        clean_updates = updates.copy()
        clean_updates.pop("id", None)
        
        # Handle field mappings
        if "name" in clean_updates:
            clean_updates["title"] = clean_updates.pop("name")
        if "course_code" in clean_updates:
            clean_updates["code"] = clean_updates["course_code"]
            
        try:
            client = self.db.get_client()
            response = client.table("courses").update(clean_updates).eq("id", course_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_course_failed", error=str(e), course_id=course_id)
            return False

    async def delete_course(self, course_id: str) -> bool:
        return await self.db.delete("courses", {"id": course_id})

    async def get_courses_by_teacher(self, teacher_id: str) -> List[dict]:
        try:
            client = self.db.get_client()
            response = client.table("courses").select("*").eq("teacher_id", teacher_id).execute()
            return [self._normalize_course(course) for course in response.data]
        except Exception as e:
            log.error("get_courses_by_teacher_failed", error=str(e), teacher_id=teacher_id)
            return []

    async def add_module(self, course_id: str, module: dict) -> bool:
        try:
            course = await self.get_course_by_id(course_id)
            if not course:
                return False
            modules = course.get("modules") or []
            modules.append(module)
            return await self.update_modules(course_id, modules)
        except Exception as e:
            log.error("add_module_failed", error=str(e), course_id=course_id)
            return False

    async def update_modules(self, course_id: str, modules: list) -> bool:
        try:
            client = self.db.get_client()
            response = client.table("courses").update({"modules": modules}).eq("id", course_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_modules_failed", error=str(e), course_id=course_id)
            return False

