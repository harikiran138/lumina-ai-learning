from typing import List, Optional
import uuid
from app.database.supabase_manager import supabase_db
from app.database.models import Course
from app.core.logging import structlog

log = structlog.get_logger()


class CourseStore:
    """
    MongoDB store for Courses.
    All methods are ASYNC.
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    @property
    def courses_collection(self):
        """Supabase uses 'courses' table."""
        return self.client.table("courses")

    async def create_course(self, name: str, code: str, description: str, teacher_id: str) -> dict:
        course_data = {
            "name": name,
            "code": code,
            "description": description,
            "teacher_id": teacher_id
        }

        try:
            response = self.courses_collection.insert(course_data).execute()
            if response.data:
                return response.data[0]
            raise Exception("Failed to create course")
        except Exception as e:
            log.error("create_course_failed", error=str(e))
            raise e

    async def list_courses(self) -> List[dict]:
        try:
            response = self.courses_collection.select("*").execute()
            return response.data
        except Exception as e:
            log.error("list_courses_failed", error=str(e))
            return []

    async def get_course_by_code(self, code: str) -> Optional[dict]:
        try:
            response = self.courses_collection.select("*").eq("code", code).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            log.error("get_course_by_code_failed", error=str(e))
        return None

    async def get_course_by_id(self, course_id: str) -> Optional[dict]:
        try:
            response = self.courses_collection.select("*").eq("id", course_id).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            log.error("get_course_by_id_failed", error=str(e))
        return None

    async def update_course(self, course_id: str, updates: dict) -> bool:
        try:
            # PostgreSQL/Supabase doesn't like some fields in update
            updates.pop("id", None)
            response = self.courses_collection.update(updates).eq("id", course_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_course_failed", error=str(e))
            return False

    async def delete_course(self, course_id: str) -> bool:
        try:
            response = self.courses_collection.delete().eq("id", course_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("delete_course_failed", error=str(e))
            return False

    async def get_courses_by_teacher(self, teacher_id: str) -> List[dict]:
        try:
            response = self.courses_collection.select("*").eq("teacher_id", teacher_id).execute()
            return response.data
        except Exception as e:
            log.error("get_courses_by_teacher_failed", error=str(e))
            return []

    async def add_module(self, course_id: str, module: dict) -> bool:
        collection = self.courses_collection
        if collection is None:
            return False
        result = await collection.update_one(
            {"$or": [{"_id": course_id}, {"id": course_id}]},
            {"$push": {"modules": module}}
        )
        return result.modified_count > 0

    async def update_modules(self, course_id: str, modules: list) -> bool:
        collection = self.courses_collection
        if collection is None:
            return False
        result = await collection.update_one(
            {"$or": [{"_id": course_id}, {"id": course_id}]},
            {"$set": {"modules": modules}}
        )
        return result.modified_count > 0
