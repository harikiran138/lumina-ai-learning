from datetime import datetime
from typing import List, Optional, Dict, Any
import uuid
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class AssignmentStore:
    """
    Supabase store for Assignment Metadata and Submissions.
    Operates on 'assignments' and 'assignment_submissions' tables.
    """

    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db

    async def create_assignment(
        self,
        title: str,
        course_id: str,
        description: str,
        due_date: str,
        created_by: str,
        batch_id: Optional[str] = None,
        section: Optional[str] = None,
        max_marks: Optional[int] = None,
    ) -> dict:
        assignment_data = {
            "title": title,
            "course_id": course_id,
            "description": description,
            "due_date": due_date,
            "teacher_id": created_by,
            "created_by": created_by,
            "batch_id": batch_id,
            "section": section,
            "max_marks": max_marks,
        }
        # Remove None values
        assignment_data = {k: v for k, v in assignment_data.items() if v is not None}

        try:
            result = await self.db.insert_safe("assignments", assignment_data)
            if result["success"] and result["data"]:
                return result["data"]
            raise Exception(result.get("error") or "Failed to insert assignment")
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

    async def submit_assignment(self, assignment_id: str, student_id: str, file_path: str, content: str = "", submission_type: str = "online") -> dict:
        assignment = await self.get_assignment(assignment_id)
        if not assignment:
            raise ValueError("Assignment not found")

        existing_submission = await self.get_student_submission(assignment_id, student_id)
        if existing_submission:
            raise ValueError("Submission already exists")

        submission_data = {
            "assignment_id": str(assignment_id),
            "student_id": str(student_id),
            "course_id": assignment.get("course_id"),
            "content_url": file_path,
            "text_content": content or "Submitted via Lumina AI",
            "submission_type": submission_type,
            "status": "submitted",
            "submitted_at": datetime.utcnow().isoformat()
        }
        try:
            result = await self.db.insert("assignment_submissions", submission_data)
            if result:
                return result
            # Fallback for older schema if migration hasn't run but we want to fail gracefully
            raise Exception("Failed to insert submission into assignment_submissions")
        except Exception as e:
            log.error("submit_assignment_failed", error=str(e), assignment_id=assignment_id)
            raise e

    async def update_submission_grade(
        self, submission_id: str, grade: float, feedback: str, extracted_text: Optional[str] = None
    ) -> bool:
        try:
            numeric_grade = int(round(float(grade)))
        except (TypeError, ValueError):
            log.error("update_submission_grade_invalid_input", submission_id=submission_id, grade=grade)
            return False

        updates = {
            "marks": numeric_grade,
            "feedback": feedback,
            "status": "graded",
            "graded_at": datetime.utcnow().isoformat(),
        }
        if extracted_text:
            updates["text_content"] = extracted_text

        try:
            # Always use scoped_db if possible, but here we might have global db
            # Let's use the db interface consistent with ScopedQueryBuilder
            res = await self.db.update("assignment_submissions", updates, {"id": submission_id})
            return res is not None
        except Exception as e:
            log.error("update_submission_grade_failed", error=str(e), submission_id=submission_id)
            return False

    async def get_submissions(self, assignment_id: str) -> List[dict]:
        try:
            return await self.db.fetch_all("assignment_submissions", {"assignment_id": assignment_id})
        except Exception as e:
            log.error("get_submissions_failed", error=str(e), assignment_id=assignment_id)
            return []

    async def get_student_submission(self, assignment_id: str, student_id: str) -> Optional[dict]:
        try:
            filters = {"assignment_id": str(assignment_id), "student_id": str(student_id)}
            return await self.db.fetch_one("assignment_submissions", filters)
        except Exception as e:
            log.error("get_student_submission_failed", error=str(e))
            return None

    async def get_pending_submissions(self, class_ids: Optional[List[str]] = None) -> List[dict]:
        """Fetch pending submissions, optionally filtered by classes."""
        try:
            filters = {"status": "submitted"}
            submissions = await self.db.fetch_all("assignment_submissions", filters)
            
            if class_ids is not None:
                # If class_ids is empty, return empty list (teacher has no classes)
                if not class_ids:
                    return []
                # Supabasemanager might not support 'in' directly in fetch_all dict
                # So we filter manually or check if fetch_all supports complex filters
                # Let's assume we filter manually for safety, or check assignments join
                results = []
                for s in submissions:
                    # We need to check if the submission's assignment belongs to one of these classes
                    # assignment_submissions usually has course_id, but let's check assignment
                    assignment = await self.get_assignment(s.get("assignment_id"))
                    if assignment and str(assignment.get("class_id")) in [str(cid) for cid in class_ids]:
                        results.append(s)
                return results
            
            return submissions
        except Exception as e:
            log.error("get_pending_submissions_failed", error=str(e))
            return []
