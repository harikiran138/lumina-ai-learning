from typing import List, Optional
import uuid
from app.database.manager import db
from app.database.models import Course
from app.core.logging import structlog

log = structlog.get_logger()


class CourseStore:
    """
    MongoDB store for Courses.
    All methods are ASYNC.
    """

    def __init__(self):
        pass

    @property
    def courses_collection(self):
        return db.get_collection("courses")

    async def create_course(self, name: str, code: str, description: str, teacher_id: str) -> dict:
        collection = self.courses_collection
        if collection is None:
            raise Exception("Database not connected")

        course = Course(name=name, code=code, description=description, teacher_id=teacher_id)

        course_dict = course.model_dump(by_alias=True)
        # Handle uuid mapping if needed or just use str
        if "id" not in course_dict and "_id" not in course_dict:
            course_dict["id"] = str(uuid.uuid4())

        await collection.insert_one(course_dict)

        # Return dict without _id
        if "_id" in course_dict:
            course_dict["id"] = str(course_dict.pop("_id"))
        return course_dict

    async def list_courses(self) -> List[dict]:
        collection = self.courses_collection
        if collection is None:
            return []

        cursor = collection.find({})
        courses = await cursor.to_list(length=100)
        for doc in courses:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
        return courses

    async def get_course_by_code(self, code: str) -> Optional[dict]:
        collection = self.courses_collection
        if collection is None:
            return None

        doc = await collection.find_one({"code": code})
        if doc:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
            return doc
        return None

    async def get_course_by_id(self, course_id: str) -> Optional[dict]:
        collection = self.courses_collection
        if collection is None:
            return None
        doc = await collection.find_one({"$or": [{"_id": course_id}, {"id": course_id}]})
        if doc:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
            return doc
        return None

    async def update_course(self, course_id: str, updates: dict) -> bool:
        collection = self.courses_collection
        if collection is None:
            return False
        updates.pop("_id", None)
        updates.pop("id", None)
        result = await collection.update_one(
            {"$or": [{"_id": course_id}, {"id": course_id}]},
            {"$set": updates}
        )
        return result.modified_count > 0

    async def delete_course(self, course_id: str) -> bool:
        collection = self.courses_collection
        if collection is None:
            return False
        result = await collection.delete_one({"$or": [{"_id": course_id}, {"id": course_id}]})
        return result.deleted_count > 0

    async def get_courses_by_teacher(self, teacher_id: str) -> List[dict]:
        collection = self.courses_collection
        if collection is None:
            return []
        cursor = collection.find({"teacher_id": teacher_id})
        courses = await cursor.to_list(length=100)
        for doc in courses:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
        return courses

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
