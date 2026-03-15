from datetime import datetime
from typing import List, Optional, Dict, Any
import uuid
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class AssignmentStore:
    """
    Supabase store for Assignment Metadata and Submissions.
    Operates on 'assignments' and 'submissions' tables.
    """

    def __init__(self):
        self.db = supabase_db

    async def create_assignment(
        self, title: str, course_id: str, description: str, due_date: str, created_by: str
    ) -> dict:
        assignment_data = {
            "title": title,
            "course_id": course_id,
            "description": description,
            "due_date": due_date,
            "creator_id": created_by,
            "assignment_type": "essay"  # Default for v2.0
        }
        try:
            result = await self.db.insert("assignments", assignment_data)
            if result:
                return result
            raise Exception("Failed to insert assignment")
        except Exception as e:
            log.error("create_assignment_failed", error=str(e), title=title)
            raise e

    async def get_assignment(self, assignment_id: str) -> Optional[dict]:
        return await self.db.fetch_one("assignments", {"id": assignment_id})

    async def list_assignments(self, course_id: Optional[str] = None) -> List[dict]:
        try:
            filters = {"course_id": course_id} if course_id else {}
            return await self.db.fetch_all("assignments", filters, limit=200)
        except Exception as e:
            log.error("list_assignments_failed", error=str(e), course_id=course_id)
            return []

    async def submit_assignment(self, assignment_id: str, student_id: str, file_path: str, content: str = "") -> dict:
        submission_data = {
            "assignment_id": assignment_id,
            "user_id": student_id,
            "file_url": file_path,
            "content": content or "Submitted via Lumina AI",
            "status": "submitted",
            "submitted_at": datetime.utcnow().isoformat()
        }
        try:
            # First find course_id if possible
            assignment = await self.get_assignment(assignment_id)
            if assignment:
                submission_data["course_id"] = assignment.get("course_id")

            result = await self.db.insert("submissions", submission_data)
            if result:
                return result
            raise Exception("Failed to submit assignment")
        except Exception as e:
            log.error("submit_assignment_failed", error=str(e), assignment_id=assignment_id)
            raise e

    async def update_submission_grade(
        self, submission_id: str, grade: float, feedback: str, extracted_text: Optional[str] = None
    ) -> bool:
        updates = {
            "score": grade,
            "feedback": feedback,
            "graded_at": datetime.utcnow().isoformat(),
            "status": "graded"
        }
        if extracted_text:
            updates["extracted_text"] = extracted_text

        try:
            client = self.db.get_client()
            response = client.table("submissions").update(updates).eq("id", submission_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_submission_grade_failed", error=str(e), submission_id=submission_id)
            return False

    async def get_submissions(self, assignment_id: str) -> List[dict]:
        try:
            return await self.db.fetch_all("submissions", {"assignment_id": assignment_id})
        except Exception as e:
            log.error("get_submissions_failed", error=str(e), assignment_id=assignment_id)
            return []

    async def get_student_submission(self, assignment_id: str, student_id: str) -> Optional[dict]:
        try:
            filters = {"assignment_id": assignment_id, "user_id": student_id}
            return await self.db.fetch_one("submissions", filters)
        except Exception as e:
            log.error("get_student_submission_failed", error=str(e))
            return None
