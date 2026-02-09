from datetime import datetime
from typing import List, Optional
import uuid
from app.database.manager import db
from app.core.logging import structlog

log = structlog.get_logger()


class AssignmentStore:
    """
    MongoDB store for Assignment Metadata.
    All methods are ASYNC.
    """

    def __init__(self):
        pass

    @property
    def assignments_collection(self):
        return db.get_collection("assignments")

    @property
    def submissions_collection(self):
        return db.get_collection("submissions")

    async def create_assignment(
        self, title: str, course_id: str, description: str, due_date: str, created_by: str
    ) -> dict:
        collection = self.assignments_collection
        if collection is None:
            raise Exception("Database not connected")

        assignment = {
            "id": str(uuid.uuid4()),
            "title": title,
            "course_id": course_id,
            "description": description,
            "due_date": due_date,  # ISO Format
            "created_by": created_by,
            "created_at": datetime.now().isoformat(),
        }
        await collection.insert_one(assignment)
        if "_id" in assignment:
            assignment["id"] = str(assignment.pop("_id"))
        return assignment

    async def submit_assignment(self, assignment_id: str, student_id: str, file_path: str) -> dict:
        collection = self.submissions_collection
        if collection is None:
            raise Exception("Database not connected")
        submission = {
            "id": str(uuid.uuid4()),
            "assignment_id": assignment_id,
            "student_id": student_id,
            "file_path": file_path,
            "submitted_at": datetime.now().isoformat(),
            "status": "locked",
            "grade": None,
            "feedback": None,
        }
        await collection.insert_one(submission)
        if "_id" in submission:
            submission["id"] = str(submission.pop("_id"))
        return submission

    async def update_submission_grade(
        self, submission_id: str, grade: float, feedback: str, ocr_text: Optional[str] = None
    ):
        collection = self.submissions_collection
        if collection is None:
            return
        update_data = {"grade": grade, "feedback": feedback, "status": "graded"}
        if ocr_text:
            update_data["ocr_text"] = ocr_text

        await collection.update_one({"id": submission_id}, {"$set": update_data})

    async def get_submissions(self, assignment_id: str) -> List[dict]:
        collection = self.submissions_collection
        if collection is None:
            return []
        cursor = collection.find({"assignment_id": assignment_id})
        submissions = await cursor.to_list(length=100)
        for doc in submissions:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
        return submissions

    async def get_student_submission(self, assignment_id: str, student_id: str) -> Optional[dict]:
        collection = self.submissions_collection
        if collection is None:
            return None
        doc = await collection.find_one({"assignment_id": assignment_id, "student_id": student_id})
        if doc:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
            return doc
        return None

    async def list_assignments(self, course_id: Optional[str] = None) -> List[dict]:
        collection = self.assignments_collection
        if collection is None:
            return []
        query = {}
        if course_id:
            query["course_id"] = course_id

        cursor = collection.find(query)
        assignments = await cursor.to_list(length=100)
        for doc in assignments:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
        return assignments

    async def get_assignment(self, assignment_id: str) -> Optional[dict]:
        collection = self.assignments_collection
        if collection is None:
            return None
        doc = await collection.find_one({"id": assignment_id})
        if doc:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
            return doc
        return None
