from typing import List, Optional, Any, Dict, Set
from datetime import datetime
import uuid
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class CourseStore:
    """
    Supabase (PostgreSQL) store for Courses.
    """

    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db

    def _normalize_course(self, course: Optional[dict]) -> Optional[dict]:
        if not course:
            return None

        normalized = course.copy()
        
        # v2.0 uses 'name' and 'code' directly
        title = (
            normalized.get("name")
            or normalized.get("course_name")
            or normalized.get("title")
            or "Untitled Course"
        )
        code = normalized.get("code") or normalized.get("course_code")
        
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
        review_status = normalized.get("review_status", "draft")
        normalized["status"] = "Published" if published else "Draft"
        normalized["review_status"] = review_status
        normalized["designer_notes"] = normalized.get("designer_notes", "")
        
        return normalized

    async def create_course(
        self,
        name: str,
        code: str,
        description: str = "",
        teacher_id: Optional[str] = None,
        difficulty_level: Optional[str] = None,
        thumbnail_url: Optional[str] = None,
        program_id: Optional[str] = None,
        modules: Optional[List[Any]] = None,
        college_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Public create_course method that builds the course data object and persists it.
        """
        course_data = {
            "name": name,
            "title": name,        # many Lumina schemas use 'title' instead of 'name'
            "course_name": name,  # some use 'course_name'
            "code": code,
            "course_code": code,  # some use 'course_code'
            "description": description,
            "teacher_id": teacher_id,
            "difficulty_level": difficulty_level,
            "thumbnail_url": thumbnail_url,
            "image_url": thumbnail_url, # fallback
            "program_id": program_id,
            "modules": modules or [],
            "college_id": college_id,
            "is_published": False,
            "review_status": "draft"
        }

        # Filter out None values
        course_data = {k: v for k, v in course_data.items() if v is not None}

        log.debug("create_course_request", code=code)
        
        try:
            return await self.create_course_db(course_data)
        except Exception as e:
            log.error("create_course_failed", code=code, error=str(e))
            raise Exception(f"Insert failed: {str(e)}")

    async def create_course_db(self, course_data: dict) -> dict:
        log.debug("create_course_db_execute", table="courses")
        
        # Robust insert: Strip columns that don't exist in the remote schema
        try:
            client = self.db.get_client()
            sample_res = await client.table("courses").select("*").limit(1).async_execute()
            if sample_res.data:
                valid_cols = set(sample_res.data[0].keys())
                course_data = {k: v for k, v in course_data.items() if k in valid_cols}
        except Exception as discovery_error:
            log.warning("column_discovery_failed", error=str(discovery_error))
            pass

        # 1. Base Insert
        result = await self.db.insert("courses", course_data)
        
        if not result:
            log.warning("create_course_no_result_returned", code=course_data.get("code"))
            # Fallback: check if it was actually created
            result = await self.get_course_by_code(course_data.get("code"))
            if not result:
                raise Exception("Insert failed: no data returned")

        return self._normalize_course(result)

    async def create_course_from_blueprint(self, blueprint: dict, teacher_id: str) -> dict:
        title = blueprint.get("title", "Untitled Course")
        code = blueprint.get("code") or f"c-{str(uuid.uuid4())[:8]}"
        
        # Collision detection with auto-resolution
        if await self.get_course_by_code(code):
            import re
            slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
            code = f"{slug}-{str(uuid.uuid4())[:12]}"
            log.info("blueprint_collision_resolved", old_code=blueprint.get("code"), new_code=code)

        course_data = {
            "name": title,
            "title": title,
            "course_name": title,
            "code": code,
            "course_code": code,
            "description": blueprint.get("description", ""),
            "teacher_id": teacher_id,
            "subject": blueprint.get("subject", "general"),
            "difficulty_level": blueprint.get("difficulty_level", "beginner"),
            "grade_level": blueprint.get("difficulty_level", "beginner"),
            "modules": blueprint.get("modules", []),
            "thumbnail_url": blueprint.get("thumbnail_url") or blueprint.get("image_url"),
            "is_published": False,
            "review_status": "draft",
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
            # Try matching both legacy and new column names
            response = await client.table("courses").select("*").or_(f"code.eq.{code},course_code.eq.{code}").async_execute()
            if response.data:
                return self._normalize_course(response.data[0])
        except Exception as e:
            log.error("get_course_by_code_failed", error=str(e), code=code)
        return None

    async def get_course_by_id(self, course_id: str) -> Optional[dict]:
        course = await self.db.fetch_one("courses", {"id": course_id})
        return self._normalize_course(course)

    async def update_course(self, course_id: str, updates: dict) -> bool:
        # Cleanup updates for PostgreSQL
        clean_updates = updates.copy()
        clean_updates.pop("id", None)
        
        # Handle field mappings
        if "name" in clean_updates:
            clean_updates["course_name"] = clean_updates["name"]
            clean_updates["title"] = clean_updates["name"]
        
        if "title" in clean_updates and "name" not in clean_updates:
            clean_updates["course_name"] = clean_updates["title"]
            clean_updates["name"] = clean_updates["title"]

        if "difficulty_level" in clean_updates:
            clean_updates["grade_level"] = clean_updates["difficulty_level"]
        elif "grade_level" in clean_updates:
            clean_updates["difficulty_level"] = clean_updates["grade_level"]

        if "thumbnail_url" in clean_updates:
            clean_updates["image_url"] = clean_updates["thumbnail_url"]
        elif "image_url" in clean_updates:
            clean_updates["thumbnail_url"] = clean_updates["image_url"]
        
        # Don't pop - we now use these as primary columns
        if "code" in clean_updates:
            clean_updates["course_code"] = clean_updates["code"]
        
        if "thumbnail" in clean_updates and "thumbnail_url" not in clean_updates:
            clean_updates["thumbnail_url"] = clean_updates["thumbnail"]

        # Remove unsupported legacy keys if present
        clean_updates.pop("code", None)
        clean_updates.pop("title", None)
            
        try:
            client = self.db.get_client()
            response = await client.table("courses").update(clean_updates).eq("id", course_id).async_execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_course_failed", error=str(e), course_id=course_id)
            return False

    async def delete_course(self, course_id: str) -> bool:
        return await self.db.delete("courses", {"id": course_id})

    async def get_courses_by_teacher(self, teacher_id: str) -> List[dict]:
        try:
            client = self.db.get_client()
            response = await client.table("courses").select("*").eq("teacher_id", teacher_id).async_execute()
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
            response = await client.table("courses").update({"modules": modules}).eq("id", course_id).async_execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_modules_failed", error=str(e), course_id=course_id)
            return False

    async def submit_for_review(self, course_id: str) -> bool:
        client = self.db.get_client()
        try:
            response = await client.table("courses").update({
                "review_status": "in_review",
            }).eq("id", course_id).async_execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("submit_for_review_failed", error=str(e), course_id=course_id)
            return False

    async def reject_course(self, course_id: str, feedback: str) -> bool:
        client = self.db.get_client()
        try:
            response = await client.table("courses").update({
                "review_status": "rejected",
                "designer_notes": feedback,
                "is_published": False
            }).eq("id", course_id).async_execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("reject_course_failed", error=str(e), course_id=course_id)
            return False

    async def approve_and_publish(self, course_id: str, admin_id: str) -> bool:
        course = await self.get_course_by_id(course_id)
        if not course:
            return False

        client = self.db.get_client()
        try:
            # 1. Update the course table
            response = await client.table("courses").update({
                "review_status": "published",
                "is_published": True,
                "designer_notes": ""
            }).eq("id", course_id).async_execute()
            
            if not getattr(response, 'data', None):
                return False

            # 2. Add version snapshot
            # Count existing versions to determine new version_number
            versions_resp = await client.table("course_versions").select("version_number").eq("course_id", course_id).order("version_number", desc=True).limit(1).async_execute()
            latest_version = 0
            if getattr(versions_resp, 'data', None):
                latest_version = versions_resp.data[0]["version_number"]
            
            new_version = latest_version + 1
            
            # Remove mutable or huge UI-only fields from snapshot if needed, or just insert as-is.
            snapshot_data = course
            
            await client.table("course_versions").insert({
                "course_id": course_id,
                "version_number": new_version,
                "snapshot_data": snapshot_data,
                "published_by": admin_id
            }).async_execute()

            return True
        except Exception as e:
            log.error("approve_and_publish_failed", error=str(e), course_id=course_id)
            return False

    async def get_course_versions(self, course_id: str) -> List[dict]:
        client = self.db.get_client()
        try:
            response = await client.table("course_versions").select("*").eq("course_id", course_id).order("version_number", desc=True).async_execute()
            return getattr(response, 'data', [])
        except Exception as e:
            log.error("get_course_versions_failed", error=str(e), course_id=course_id)
            return []
