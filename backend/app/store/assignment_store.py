from datetime import datetime
from typing import List, Optional
import uuid
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class AssignmentStore:
    """
    Supabase store for Assignment Metadata.
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    @property
    def assignments_collection(self):
        return self.client.table("assignments")

    @property
    def submissions_collection(self):
        return self.client.table("submissions")

    async def create_assignment(
        self, title: str, course_id: str, description: str, due_date: str, created_by: str
    ) -> dict:
        assignment = {
            "id": str(uuid.uuid4()),
            "title": title,
            "course_id": course_id,
            "description": description,
            "due_date": due_date,  # ISO Format
            "created_by": created_by,
            "created_at": datetime.now().isoformat(),
        }
        try:
            response = self.assignments_collection.insert(assignment).execute()
            if response.data:
                return response.data[0]
            return assignment
        except Exception as e:
            log.error("create_assignment_failed", error=str(e))
            return assignment

    async def submit_assignment(self, assignment_id: str, student_id: str, file_path: str) -> dict:
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
        try:
            response = self.submissions_collection.insert(submission).execute()
            if response.data:
                return response.data[0]
            return submission
        except Exception as e:
            log.error("submit_assignment_failed", error=str(e))
            return submission

    async def update_submission_grade(
        self, submission_id: str, grade: float, feedback: str, ocr_text: Optional[str] = None
    ):
        update_data = {"grade": grade, "feedback": feedback, "status": "graded"}
        if ocr_text:
            update_data["ocr_text"] = ocr_text

        try:
            self.submissions_collection.update(update_data).eq("id", submission_id).execute()
        except Exception as e:
            log.error("update_submission_grade_failed", error=str(e))

    async def get_submissions(self, assignment_id: str) -> List[dict]:
        try:
            response = self.submissions_collection.select("*").eq("assignment_id", assignment_id).execute()
            return response.data
        except Exception as e:
            log.error("get_submissions_failed", error=str(e))
            return []

    async def get_student_submission(self, assignment_id: str, student_id: str) -> Optional[dict]:
        try:
            response = self.submissions_collection.select("*").eq("assignment_id", assignment_id).eq("student_id", student_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            log.error("get_student_submission_failed", error=str(e))
            return None

    async def list_assignments(self, course_id: Optional[str] = None) -> List[dict]:
        try:
            query = self.assignments_collection.select("*")
            if course_id:
                query = query.eq("course_id", course_id)
                
            response = query.execute()
            return response.data
        except Exception as e:
            log.error("list_assignments_failed", error=str(e))
            return []

    async def get_assignment(self, assignment_id: str) -> Optional[dict]:
        try:
            response = self.assignments_collection.select("*").eq("id", assignment_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            log.error("get_assignment_failed", error=str(e))
            return None
