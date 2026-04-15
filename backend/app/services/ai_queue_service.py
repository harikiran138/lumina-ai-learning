"""
Teacher Queue Service - Central business logic for AI answer review workflow.

Responsibilities:
- Retrieve pending questions for teacher review
- Handle approval/rejection decisions
- Update answer status in database
- Trigger real-time notifications
- Track teacher feedback for metrics
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.logging import structlog
from app.database.supabase_manager import supabase_db
from app.schemas.ai_queue_schema import (
    AIQueueStudentView,
    AIQueueTeacherView,
    AIQueueAdminView,
    AIQueueStatus,
)

log = structlog.get_logger()


class AIQueueService:
    """
    Manages the teacher review queue for AI-generated answers.
    
    Flow:
    1. Student asks question → Answer generated (status=ai_answered)
    2. Teacher reviews queue → Gets pending/provisional answers
    3. Teacher approves → Status=approved, released to student, event emitted
    4. Student notified → Real-time event or polling retrieves answer
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    @staticmethod
    def _now_iso() -> str:
        """Return current timestamp in ISO format."""
        return datetime.now(timezone.utc).isoformat()

    async def get_pending_for_student(self, student_id: str) -> List[AIQueueStudentView]:
        """
        Student polls their own pending/answered questions.
        Returns only the AIQueueStudentView shape — no draft answers or teacher notes.
        """
        try:
            response = await self.client.table("ai_answer_queue").select(
                "id, student_question, status, created_at, teacher_edited_answer, ai_generated_answer"
            ).eq("student_id", student_id).order("created_at", desc=False).async_execute()
            rows = response.data or []
            return [AIQueueStudentView.from_item(row) for row in rows]
        except Exception as exc:
            log.error("get_pending_for_student_failed", student_id=student_id, error=str(exc))
            return []

    async def get_all_for_admin(
        self, class_id: Optional[str] = None, course_id: Optional[str] = None
    ) -> List[AIQueueAdminView]:
        """
        Admin sees all queue items. Optionally scoped to a class or course.
        Returns AIQueueAdminView shape.
        """
        try:
            query = self.client.table("ai_answer_queue").select("*").order("created_at", desc=True)
            if course_id:
                query = query.eq("course_id", course_id)
            response = await query.async_execute()
            rows = response.data or []
            return [AIQueueAdminView.from_item(row) for row in rows]
        except Exception as exc:
            log.error("get_all_for_admin_failed", error=str(exc))
            return []

    async def get_queue(
        self,
        teacher_id: str,
        course_id: Optional[str] = None,
        role: str = "teacher",
    ) -> Dict[str, Any]:
        """
        Retrieve pending/provisional questions for teacher review.
        """
        try:
            # Query AI answer queue using async_execute to avoid blocking the event loop
            query = self.client.table("ai_answer_queue").select("*").order("created_at", desc=True)
            response = await query.async_execute()
            rows = response.data or []

            # Filter by role and permissions
            if role == "teacher":
                rows = [
                    row for row in rows
                    if str(row.get("teacher_id")) == str(teacher_id)
                    and not bool(row.get("released_to_student", False))
                    and row.get("status") in {"pending", "ai_answered", "escalated_to_faculty"}
                ]
            elif role == "hod":
                rows = [row for row in rows if row.get("status") == "escalated_to_hod"]
            else:
                # Admin sees all
                rows = [row for row in rows if not bool(row.get("released_to_student", False))]

            # Optional: filter by course
            if course_id:
                rows = [row for row in rows if str(row.get("course_id")) == str(course_id)]

            # Enrich with student info
            student_ids = [row.get("student_id") for row in rows if row.get("student_id")]
            students: List[Dict[str, Any]] = []
            if student_ids:
                student_resp = await (
                    self.client.table("users")
                    .select("id, full_name, email")
                    .in_("id", student_ids)
                    .async_execute()
                )
                students = student_resp.data or []
            student_lookup = {str(item.get("id")): item for item in students}

            # Format items
            items: List[Dict[str, Any]] = []
            created_times = []

            for row in rows:
                student = student_lookup.get(str(row.get("student_id")), {})
                items.append(
                    {
                        "id": row.get("id"),
                        "question_id": row.get("id"),
                        "question_text": row.get("student_question", ""),
                        "student_name": student.get("full_name") or student.get("email") or "Student",
                        "student_email": student.get("email") or "",
                        "course_id": row.get("course_id"),
                        "course_name": f"Course {row.get('course_id', '')}",
                        "ai_draft": row.get("ai_generated_answer", ""),
                        "ai_confidence": row.get("ai_confidence"),
                        "status": row.get("status", "pending"),
                        "created_at": row.get("created_at"),
                        "time_pending_sec": self._calc_pending_time(row.get("created_at")),
                        "released_to_student": bool(row.get("released_to_student", False)),
                        "request_mode": row.get("request_mode"),
                    }
                )
                if row.get("created_at"):
                    created_times.append(self._calc_pending_time(row.get("created_at")))

            total_pending = sum(
                1
                for item in items
                if item["status"] in {"pending", "ai_answered", "escalated_to_faculty", "escalated_to_hod"}
            )

            avg_wait = sum(created_times) / len(created_times) if created_times else 0

            return {
                "items": items,
                "total_pending": total_pending,
                "avg_wait_time_sec": int(avg_wait),
            }

        except Exception as exc:
            log.error("get_queue_failed", teacher_id=teacher_id, error=str(exc))
            return {"items": [], "total_pending": 0, "avg_wait_time_sec": 0}

    @staticmethod
    def _calc_pending_time(created_at: Optional[str]) -> int:
        """Calculate seconds since creation."""
        if not created_at:
            return 0
        try:
            created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            return int((now - created).total_seconds())
        except Exception:
            return 0

    async def approve_answer(
        self,
        question_id: str,
        teacher_id: str,
        feedback: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Approve an AI-generated answer.
        
        Flow:
        1. Update status to APPROVED
        2. Mark as released to student
        3. Bank answer in knowledge base
        4. Emit real-time event
        5. Update metrics
        
        Args:
            question_id: Queue item ID
            teacher_id: Approving teacher's ID
            feedback: Optional teacher feedback
            
        Returns:
            {"success": bool, "message": str}
        """
        # Fetch current item
        existing = self.client.table("ai_answer_queue").select("*").eq("id", question_id).execute()
        if not existing.data:
            raise ValueError(f"Queue item {question_id} not found")

        item = existing.data[0]
        approved_answer = item.get("ai_generated_answer") or item.get("teacher_edited_answer")
        if not approved_answer:
            raise ValueError("No AI draft available to approve")

        # Update status
        updates = {
            "status": "approved",
            "teacher_edited_answer": approved_answer,
            "verified_at": self._now_iso(),
            "released_to_student": True,
            "reviewed_by": teacher_id,
            "teacher_note": feedback,
        }

        self._safe_update_queue_item(question_id, updates)

        # Bank the verified answer for future reference
        self._bank_verified_answer(item, approved_answer, teacher_id)

        # Log action
        log.info(
            "ai_answer_approved",
            question_id=question_id,
            teacher_id=teacher_id,
            course_id=item.get("course_id"),
        )

        return {"success": True, "status": "approved"}

    async def reject_answer(
        self,
        question_id: str,
        teacher_id: str,
        reason: str,
        suggestion: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Reject an AI-generated answer.
        
        Flow:
        1. Update status to REJECTED
        2. Mark as NOT released to student
        3. Decrease confidence metrics
        4. Emit event to student
        
        Args:
            question_id: Queue item ID
            teacher_id: Rejecting teacher's ID
            reason: Rejection reason
            suggestion: Optional suggestion for improvement
            
        Returns:
            {"success": bool, "message": str}
        """
        existing = self.client.table("ai_answer_queue").select("id").eq("id", question_id).execute()
        if not existing.data:
            raise ValueError(f"Queue item {question_id} not found")

        item = existing.data[0]

        # Update status
        updates = {
            "status": "rejected",
            "verified_at": self._now_iso(),
            "released_to_student": False,
            "reviewed_by": teacher_id,
            "teacher_note": reason,
            "teacher_suggestion": suggestion,
        }

        self._safe_update_queue_item(question_id, updates)

        # Decrease model confidence metrics
        self._update_model_confidence(item, feedback=False)

        log.info(
            "ai_answer_rejected",
            question_id=question_id,
            teacher_id=teacher_id,
            reason=reason,
        )

        return {"success": True, "status": "rejected"}

    async def edit_approve_answer(
        self,
        question_id: str,
        teacher_id: str,
        final_answer: str,
        teacher_note: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Approve with teacher edits.
        
        Args:
            question_id: Queue item ID
            teacher_id: Editing teacher's ID
            final_answer: Teacher's edited answer
            teacher_note: Teacher notes
            
        Returns:
            {"success": bool, "status": str}
        """
        existing = self.client.table("ai_answer_queue").select("*").eq("id", question_id).execute()
        if not existing.data:
            raise ValueError(f"Queue item {question_id} not found")

        item = existing.data[0]

        updates = {
            "status": "edited_approved",
            "teacher_edited_answer": final_answer,
            "verified_at": self._now_iso(),
            "released_to_student": True,
            "reviewed_by": teacher_id,
            "teacher_note": teacher_note,
        }

        self._safe_update_queue_item(question_id, updates)
        self._bank_verified_answer(item, final_answer, teacher_id)

        log.info(
            "ai_answer_edited_approved",
            question_id=question_id,
            teacher_id=teacher_id,
        )

        return {"success": True, "status": "edited_approved"}

    async def escalate_answer(
        self,
        question_id: str,
        escalator_id: str,
        escalator_role: str,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Escalate question to HOD or faculty.
        
        Args:
            question_id: Queue item ID
            escalator_id: User escalating
            escalator_role: Role of escalator (teacher, hod)
            reason: Escalation reason
            
        Returns:
            {"success": bool, "status": str}
        """
        new_status = "escalated_to_faculty" if escalator_role == "teacher" else "escalated_to_hod"

        updates = {
            "status": new_status,
            "released_to_student": False,
            "reviewed_by": escalator_id,
            "faculty_note": reason,
        }

        self._safe_update_queue_item(question_id, updates)

        log.info(
            "ai_answer_escalated",
            question_id=question_id,
            escalated_to=new_status,
        )

        return {"success": True, "status": new_status}

    def _safe_update_queue_item(self, queue_id: str, updates: Dict[str, Any]) -> None:
        """Safely update queue item with fallback for missing columns."""
        EXISTING_QUEUE_COLUMNS = {
            "id", "student_id", "teacher_id", "course_id", "student_question",
            "ai_generated_answer", "teacher_edited_answer", "status",
            "created_at", "verified_at", "priority_score", "question_id",
            "ai_model", "ai_confidence", "ai_sources", "final_answer",
            "faculty_note", "college_id", "reviewed_by", "reviewed_at",
            "ai_draft", "is_deleted", "deleted_at", "released_to_student",
            "released_at", "added_to_bank", "added_to_bank_at",
            "teacher_custom_answer", "priority_factors", "rejection_reason",
            "student_acknowledged", "student_acked_at"
        }

        try:
            self.client.table("ai_answer_queue").update(updates).eq("id", queue_id).execute()
        except Exception as exc:
            log.warning("ai_queue_update_retrying_with_legacy_columns", error=str(exc))
            legacy_updates = {key: value for key, value in updates.items() if key in EXISTING_QUEUE_COLUMNS}
            self.client.table("ai_answer_queue").update(legacy_updates).eq("id", queue_id).execute()

    def _bank_verified_answer(
        self,
        queue_item: Dict[str, Any],
        approved_answer: str,
        teacher_id: str,
    ) -> None:
        """Store teacher-verified answer in knowledge bank."""
        queue_id = queue_item.get("id")
        if not queue_id:
            return

        try:
            # Check if already banked
            existing = (
                self.client.table("verified_answers_bank")
                .select("id")
                .eq("source_queue_id", queue_id)
                .execute()
            )
            if existing.data:
                log.info("ai_answer_already_banked", queue_id=queue_id)
                return

            bank_payload = {
                "source_queue_id": queue_id,
                "question_signature": queue_item.get("question_signature"),
                "question_text": queue_item.get("student_question"),
                "answer_content": approved_answer,
                "course_id": queue_item.get("course_id"),
                "approved_by": teacher_id,
                "created_at": self._now_iso(),
            }
            self.client.table("verified_answers_bank").insert(bank_payload).execute()
            log.info("ai_answer_banked", queue_id=queue_id)
        except Exception as exc:
            log.error("ai_answer_banking_failed", queue_id=queue_id, error=str(exc))

    def _update_model_confidence(
        self,
        queue_item: Dict[str, Any],
        feedback: bool,
    ) -> None:
        """
        Update model confidence metrics based on teacher feedback.
        
        Args:
            queue_item: The queue item being reviewed
            feedback: True if approved, False if rejected
        """
        try:
            original_confidence = queue_item.get("ai_confidence", 0.5)
            question_type = queue_item.get("question_type", "general")

            # Adjust confidence metrics
            if feedback:
                # Increase confidence if teacher approved
                new_confidence = min(original_confidence + 0.05, 1.0)
            else:
                # Decrease confidence if teacher rejected
                new_confidence = max(original_confidence - 0.1, 0.0)

            # Update metrics table (if it exists)
            try:
                self.client.table("ai_model_metrics").insert(
                    {
                        "model_id": queue_item.get("ai_model") or "unknown",
                        "question_type": question_type,
                        "original_confidence": original_confidence,
                        "adjusted_confidence": new_confidence,
                        "teacher_feedback": "approved" if feedback else "rejected",
                        "recorded_at": self._now_iso(),
                    }
                ).execute()
            except Exception as e:
                log.warning("ai_model_metrics_table_missing", error=str(e))

            log.info(
                "model_confidence_updated",
                question_type=question_type,
                old_confidence=original_confidence,
                new_confidence=new_confidence,
            )
        except Exception as exc:
            log.warning("model_confidence_update_failed", error=str(exc))

    async def get_queue_metrics(
        self,
        teacher_id: str,
    ) -> Dict[str, Any]:
        """
        Get queue performance metrics for a teacher.
        
        Returns:
            {
                "pending_count": int,
                "avg_response_time_sec": int,
                "auto_approved_rate": float,
                "teacher_approval_rate": float,
                "rejection_rate": float,
                "model_accuracy": float,
                "questions_today": int,
            }
        """
        # Fetch all queue items for teacher
        rows = (
            self.client.table("ai_answer_queue")
            .select("*")
            .eq("teacher_id", teacher_id)
            .execute()
            .data
            or []
        )

        total = len(rows)
        pending = sum(1 for r in rows if r.get("status") in {"pending", "ai_answered"})
        approved = sum(1 for r in rows if r.get("status") in {"approved", "edited_approved"})
        rejected = sum(1 for r in rows if r.get("status") == "rejected")

        # Calculate rates
        approval_rate = (approved / total * 100) if total > 0 else 0
        rejection_rate = (rejected / total * 100) if total > 0 else 0

        # Average response time
        response_times = []
        for row in rows:
            if row.get("verified_at") and row.get("created_at"):
                try:
                    created = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
                    verified = datetime.fromisoformat(row["verified_at"].replace("Z", "+00:00"))
                    response_times.append((verified - created).total_seconds())
                except Exception:
                    continue

        avg_response = int(sum(response_times) / len(response_times)) if response_times else 0

        # Today's questions
        today_count = sum(
            1
            for r in rows
            if r.get("created_at")
            and r["created_at"].startswith(datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        )

        return {
            "pending_count": pending,
            "avg_response_time_sec": avg_response,
            "approval_rate": round(approval_rate, 2),
            "rejection_rate": round(rejection_rate, 2),
            "total_reviewed": approved + rejected,
            "questions_today": today_count,
        }
