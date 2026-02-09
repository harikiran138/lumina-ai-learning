from typing import List, Dict, Any
from app.database.manager import db
from app.core.logging import structlog
from datetime import datetime
from bson import ObjectId

log = structlog.get_logger()


class StudentStore:
    """
    Store for student-specific operations: Enrollment, Progress, Badges, Certificates.
    """

    def __init__(self):
        pass

    @property
    def progress_collection(self):
        return db.get_collection("progress")

    @property
    def users_collection(self):
        return db.get_collection("users")

    @property
    def courses_collection(self):
        return db.get_collection("courses")

    @property
    def certificates_collection(self):
        return db.get_collection("certificates")

    async def enroll_in_course(self, student_id: str, course_id: str) -> bool:
        """
        Enrolls a student in a course. Creates a progress record.
        """
        collection = self.progress_collection
        if collection is None:
            return False

        # Check if already enrolled
        existing = await collection.find_one({"userId": student_id, "courseId": course_id})
        if existing:
            return False

        # Create progress record
        progress_record = {
            "userId": student_id,
            "courseId": course_id,
            "progress": 0,
            "mastery": 0,
            "streak": 0,
            "completedLessons": [],
            "lastAccessed": datetime.utcnow(),
            "enrolledAt": datetime.utcnow(),
        }

        try:
            await collection.insert_one(progress_record)

            # Increment course enrollment count
            await self.courses_collection.update_one(
                {"_id": ObjectId(course_id)}, {"$inc": {"enrolledCount": 1}}
            )
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
        Marks a lesson as complete and potentially awards badges.
        """
        collection = self.progress_collection
        if collection is None:
            return {"success": False}

        try:
            # 1. Update progress record
            await collection.update_one(
                {"userId": student_id, "courseId": course_id},
                {
                    "$addToSet": {"completedLessons": lesson_id},
                    "$set": {"lastAccessed": datetime.utcnow()},
                },
            )

            # 2. Potential Badge logic (Simplistic for now)
            # In a more complex system, we'd check module completion.

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
        collection = self.certificates_collection
        if collection is None:
            return []

        cursor = collection.find({"userId": student_id}).sort("issueDate", -1)
        results = await cursor.to_list(length=50)
        for r in results:
            r["id"] = str(r.pop("_id"))
        return results

    async def get_badges(self, student_id: str) -> List[Dict]:
        """
        Fetches all badges for a student from their user record.
        """
        collection = self.users_collection
        if collection is None:
            return []

        user = await collection.find_one({"_id": student_id}, {"badges": 1})
        if user and "badges" in user:
            return user["badges"]
        return []
