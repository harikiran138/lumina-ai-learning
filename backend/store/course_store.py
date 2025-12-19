from typing import List, Optional
import uuid
from .database import db

class CourseStore:
    """
    MongoDB store for Courses.
    """
    def __init__(self):
        self._courses_collection = None

    @property
    def courses_collection(self):
        if self._courses_collection is None:
            _db = db.get_db()
            if _db is not None:
                self._courses_collection = _db["courses"]
        return self._courses_collection

    def create_course(self, name: str, code: str, description: str, teacher_id: str) -> dict:
        collection = self.courses_collection
        if collection is None: raise Exception("Database not connected")
        course = {
            "id": str(uuid.uuid4()),
            "name": name,
            "code": code,
            "description": description,
            "teacher_id": teacher_id,
        }
        collection.insert_one(course)
        course.pop("_id", None)
        return course

    def list_courses(self) -> List[dict]:
        collection = self.courses_collection
        if collection is None: return []
        cursor = collection.find({})
        courses = []
        for doc in cursor:
            doc.pop("_id", None)
            courses.append(doc)
        return courses

    def get_course_by_code(self, code: str) -> Optional[dict]:
        collection = self.courses_collection
        if collection is None: return None
        doc = collection.find_one({"code": code})
        if doc:
            doc.pop("_id", None)
            return doc
        return None
