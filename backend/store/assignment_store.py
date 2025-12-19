from datetime import datetime
from typing import List, Optional
import uuid
from .database import db

class AssignmentStore:
    """
    MongoDB store for Assignment Metadata.
    """
    def __init__(self):
        self._assignments_collection = None
        self._submissions_collection = None

    @property
    def assignments_collection(self):
        if self._assignments_collection is None:
             _db = db.get_db()
             if _db is not None:
                 self._assignments_collection = _db["assignments"]
        return self._assignments_collection

    @property
    def submissions_collection(self):
        if self._submissions_collection is None:
             _db = db.get_db()
             if _db is not None:
                 self._submissions_collection = _db["submissions"]
        return self._submissions_collection

    def create_assignment(self, title: str, course_id: str, description: str, due_date: str, created_by: str) -> dict:
        collection = self.assignments_collection
        if collection is None: raise Exception("Database not connected")
        assignment = {
            "id": str(uuid.uuid4()),
            "title": title,
            "course_id": course_id,
            "description": description,
            "due_date": due_date, # ISO Format
            "created_by": created_by,
            "created_at": datetime.now().isoformat()
        }
        collection.insert_one(assignment)
        # Remove internal _id for response
        assignment.pop("_id", None)
        return assignment

    def submit_assignment(self, assignment_id: str, student_id: str, file_path: str) -> dict:
        collection = self.submissions_collection
        if collection is None: raise Exception("Database not connected")
        submission = {
            "id": str(uuid.uuid4()),
            "assignment_id": assignment_id,
            "student_id": student_id,
            "file_path": file_path,
            "submitted_at": datetime.now().isoformat(),
            "status": "locked",
            "grade": None,
            "feedback": None
        }
        collection.insert_one(submission)
        submission.pop("_id", None)
        return submission

    def update_submission_grade(self, submission_id: str, grade: float, feedback: str, ocr_text: Optional[str] = None):
        collection = self.submissions_collection
        if collection is None: return
        update_data = {"grade": grade, "feedback": feedback, "status": "graded"}
        if ocr_text:
            update_data["ocr_text"] = ocr_text
            
        collection.update_one(
            {"id": submission_id},
            {"$set": update_data}
        )

    def get_submissions(self, assignment_id: str) -> List[dict]:
        collection = self.submissions_collection
        if collection is None: return []
        cursor = collection.find({"assignment_id": assignment_id})
        submissions = []
        for doc in cursor:
            doc.pop("_id", None)
            submissions.append(doc)
        return submissions

    def get_student_submission(self, assignment_id: str, student_id: str) -> Optional[dict]:
        collection = self.submissions_collection
        if collection is None: return None
        doc = collection.find_one({
            "assignment_id": assignment_id,
            "student_id": student_id
        })
        if doc:
            doc.pop("_id", None)
            return doc
        return None

    def list_assignments(self, course_id: Optional[str] = None) -> List[dict]:
        collection = self.assignments_collection
        if collection is None: return []
        query = {}
        if course_id:
            query["course_id"] = course_id
        
        cursor = collection.find(query)
        assignments = []
        for doc in cursor:
            doc.pop("_id", None)
            assignments.append(doc)
        return assignments

    def get_assignment(self, assignment_id: str) -> Optional[dict]:
        collection = self.assignments_collection
        if collection is None: return None
        doc = collection.find_one({"id": assignment_id})
        if doc:
            doc.pop("_id", None)
            return doc
        return None
