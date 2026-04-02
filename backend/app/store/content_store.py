from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from app.core.logging import structlog
from app.database.supabase_manager import supabase_db

log = structlog.get_logger()


class ContentStore:
    """
    Persistence for V2.0 Content Pipeline, AI Answer Verification, and Physical Submissions.
    """

    def __init__(self):
        self.db = supabase_db

    async def create_content_upload(self, teacher_id: str, original_filename: str, storage_url: str, file_type: str, file_size_bytes: int) -> Optional[dict]:
        data = {
            "teacher_id": teacher_id,
            "original_filename": original_filename,
            "storage_url": storage_url,
            "file_type": file_type,
            "file_size_bytes": file_size_bytes,
            "processing_status": "queued",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        return await self.db.insert("content_uploads", data)

    async def get_content_upload(self, upload_id: str) -> Optional[dict]:
        return await self.db.fetch_one("content_uploads", {"id": upload_id})

    async def update_content_upload(self, upload_id: str, updates: dict) -> Optional[dict]:
        updates["updated_at"] = datetime.utcnow().isoformat()
        return await self.db.update("content_uploads", updates, {"id": upload_id})

    async def list_content_uploads(self, teacher_id: str) -> List[dict]:
        return await self.db.fetch_all("content_uploads", {"teacher_id": teacher_id})

    async def create_verification_item(self, student_id: str, teacher_id: str, student_question: str, ai_generated_answer: str, course_id: Optional[str] = None) -> Optional[dict]:
        data = {
            "student_id": student_id,
            "teacher_id": teacher_id,
            "course_id": course_id,
            "student_question": student_question,
            "ai_generated_answer": ai_generated_answer,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        return await self.db.insert("ai_answer_queue", data)

    async def get_verification_queue(self, teacher_id: str) -> List[dict]:
        return await self.db.fetch_all("ai_answer_queue", {"teacher_id": teacher_id, "status": "pending"})

    async def update_verification_status(self, item_id: str, status: str, teacher_edited_answer: Optional[str] = None) -> Optional[dict]:
        updates = {
            "status": status,
            "teacher_edited_answer": teacher_edited_answer,
            "verified_at": datetime.utcnow().isoformat()
        }
        return await self.db.update("ai_answer_queue", updates, {"id": item_id})

    async def create_physical_submission(self, assignment_id: str, student_id: str, teacher_id: str, submission_images: List[str]) -> Optional[dict]:
        data = {
            "assignment_id": assignment_id,
            "student_id": student_id,
            "submission_type": "physical",
            "metadata": {"images": submission_images, "teacher_id": teacher_id},
            "status": "uploaded",
            "submitted_at": datetime.utcnow().isoformat(),
        }
        return await self.db.insert("assignment_submissions", data)

    async def get_physical_submission(self, submission_id: str) -> Optional[dict]:
        return await self.db.fetch_one("assignment_submissions", {"id": submission_id})

    async def update_physical_submission(self, submission_id: str, updates: dict) -> Optional[dict]:
        # Map physical-specific keys to unified schema if they crop up
        mapped_updates = dict(updates)
        if "assessment_status" in mapped_updates:
            mapped_updates["status"] = mapped_updates.pop("assessment_status")
        if "total_ai_marks" in mapped_updates:
            mapped_updates["marks"] = mapped_updates.pop("total_ai_marks")
        if "updated_at" in mapped_updates:
            mapped_updates.pop("updated_at") # Use graded_at or just remove if unsupported initially

        return await self.db.update("assignment_submissions", mapped_updates, {"id": submission_id})
