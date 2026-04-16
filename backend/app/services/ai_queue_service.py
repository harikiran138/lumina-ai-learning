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
from app.store.ai_queue_store import AIQueueStore
from app.utils.class_auth import verify_teacher_has_class_access
from app.schemas.ai_queue_schema import (
    AIQueueStudentView,
    AIQueueTeacherView,
    AIQueueAdminView,
)

log = structlog.get_logger()


class AIQueueService:
    """
    Manages the teacher review queue for AI-generated answers.
    Business logic only; persistence handled by AIQueueStore.
    """

    def __init__(self, db: Optional[Any] = None):
        self.store = AIQueueStore(db)

    @staticmethod
    def _now_iso() -> str:
        """Return current timestamp in ISO format."""
        return datetime.now(timezone.utc).isoformat()

    async def get_pending_for_student(self, student_id: str) -> List[AIQueueStudentView]:
        """
        Student polls their own pending/answered questions.
        """
        rows = await self.store.get_items_by_student(student_id)
        return [AIQueueStudentView.from_item(row) for row in rows]

    async def get_item_details(self, question_id: str) -> Optional[Dict[str, Any]]:
        return await self.store.get_item_by_id(question_id)

    async def create_queue_item(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.store.create_item(payload)

    async def update_queue_item_ai_result(self, queue_id: str, result: Any) -> bool:
        updates = {
            "ai_generated_answer": result.answer,
            "ai_model": result.model or "gemini-1.5-flash",
            "generation_error": None,
            "ai_request_log": result.request_log,
            "ai_response_log": result.response_log,
            "prompt_signature": result.prompt_signature,
            "released_to_student": result.status == "AUTO_APPROVED",
            "status": "ai_answered" if result.status != "AUTO_APPROVED" else "approved",
            "ai_confidence": result.confidence,
            "safety_score": result.safety_score
        }
        return await self.store.update_item(queue_id, updates)

    async def lookup_cached_answer(self, course_id: str, signature: str) -> Optional[Dict[str, Any]]:
        rows = await self.store.get_all_items(course_id=course_id)
        for row in rows:
            if row.get("question_signature") == signature and row.get("status") in {"approved", "edited_approved"}:
                return row
        return None

    async def get_all_for_admin(
        self, class_id: Optional[str] = None, course_id: Optional[str] = None
    ) -> List[AIQueueAdminView]:
        """
        Admin sees all queue items. Optionally scoped to a class or course.
        """
        rows = await self.store.get_all_items(course_id=course_id)
        # Service level filtering for class
        if class_id:
            rows = [r for r in rows if str(r.get("class_id")) == str(class_id)]
        return [AIQueueAdminView.from_item(row) for row in rows]

    async def get_pending_for_teacher(self, db: Any, teacher_id: str, class_id: str) -> List[AIQueueTeacherView]:
        """
        Canonical method for teacher to get items for a specific class with auth check.
        """
        if not await verify_teacher_has_class_access(db, teacher_id, class_id):
            log.warning("teacher_access_denied", teacher_id=teacher_id, class_id=class_id)
            return []

        rows = await self.store.get_pending_items_for_class(class_id)
        
        # Enrich with student names
        student_ids = list({row.get("student_id") for row in rows if row.get("student_id")})
        student_info = await self.store.get_student_info(student_ids)
        student_lookup = {str(s["id"]): s for s in student_info}

        results = []
        for row in rows:
            student = student_lookup.get(str(row.get("student_id")), {})
            item = AIQueueTeacherView.from_item(row)
            # DTO enrichment if needed (schema handles most)
            results.append(item)
        return results

    async def get_queue(
        self,
        teacher_id: str,
        course_id: Optional[str] = None,
        role: str = "teacher",
    ) -> Dict[str, Any]:
        """
        Retrieve pending/provisional questions for review. 
        Maintains legacy response shape for the dashboard.
        """
        rows = await self.store.get_all_items(course_id=course_id)

        # Filter by role
        if role == "teacher":
            rows = [
                row for row in rows
                if str(row.get("teacher_id")) == str(teacher_id)
                and not bool(row.get("released_to_student", False))
                and row.get("status") in {"pending", "ai_answered", "escalated_to_faculty"}
            ]
        elif role == "hod":
            rows = [row for row in rows if row.get("status") == "escalated_to_hod"]
        elif role in {"admin", "super_admin", "college_admin"}:
             rows = [row for row in rows if not bool(row.get("released_to_student", False))]
        else:
            return {"items": [], "total_pending": 0, "avg_wait_time_sec": 0}

        # Enrich with student info
        student_ids = list({row.get("student_id") for row in rows if row.get("student_id")})
        student_info = await self.store.get_student_info(student_ids)
        student_lookup = {str(item.get("id")): item for item in student_info}

        items: List[Dict[str, Any]] = []
        created_times = []

        for row in rows:
            student = student_lookup.get(str(row.get("student_id")), {})
            wait_sec = self._calc_pending_time(row.get("created_at"))
            items.append({
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
                "time_pending_sec": wait_sec,
                "released_to_student": bool(row.get("released_to_student", False)),
                "request_mode": row.get("request_mode"),
            })
            if row.get("created_at"):
                created_times.append(wait_sec)

        total_pending = len([i for i in items if i["status"] != "approved"])
        avg_wait = sum(created_times) / len(created_times) if created_times else 0

        return {
            "items": items,
            "total_pending": total_pending,
            "avg_wait_time_sec": int(avg_wait),
        }

    @staticmethod
    def _calc_pending_time(created_at: Optional[str]) -> int:
        if not created_at: return 0
        try:
            created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            return int((datetime.now(timezone.utc) - created).total_seconds())
        except Exception: return 0

    async def approve_answer(self, question_id: str, teacher_id: str, feedback: Optional[str] = None) -> Dict[str, Any]:
        item = await self.store.get_item_by_id(question_id)
        if not item: raise ValueError(f"Queue item {question_id} not found")

        approved_answer = item.get("ai_generated_answer") or item.get("teacher_edited_answer")
        if not approved_answer: raise ValueError("No AI draft available to approve")

        updates = {
            "status": "approved",
            "teacher_edited_answer": approved_answer,
            "verified_at": self._now_iso(),
            "released_to_student": True,
            "reviewed_by": teacher_id,
            "teacher_note": feedback,
        }

        await self.store.update_item(question_id, updates)
        await self._bank_verified_answer(item, approved_answer, teacher_id)
        
        log.info("ai_answer_approved", question_id=question_id, teacher_id=teacher_id)
        return {"success": True, "status": "approved"}

    async def reject_answer(self, question_id: str, teacher_id: str, teacher_note: str, suggestion: Optional[str] = None) -> Dict[str, Any]:
        item = await self.store.get_item_by_id(question_id)
        if not item: raise ValueError("Item not found")

        updates = {
            "status": "rejected",
            "verified_at": self._now_iso(),
            "released_to_student": False,
            "reviewed_by": teacher_id,
            "teacher_note": teacher_note,
            "teacher_suggestion": suggestion,
        }

        await self.store.update_item(question_id, updates)
        await self._update_model_confidence(item, feedback=False)
        return {"success": True, "status": "rejected"}

    async def edit_approve_answer(self, question_id: str, teacher_id: str, final_answer: str, teacher_note: Optional[str] = None) -> Dict[str, Any]:
        item = await self.store.get_item_by_id(question_id)
        if not item: raise ValueError("Item not found")

        updates = {
            "status": "edited_approved",
            "teacher_edited_answer": final_answer,
            "verified_at": self._now_iso(),
            "released_to_student": True,
            "reviewed_by": teacher_id,
            "teacher_note": teacher_note,
        }

        await self.store.update_item(question_id, updates)
        await self._bank_verified_answer(item, final_answer, teacher_id)
        return {"success": True, "status": "edited_approved"}

    async def escalate_answer(self, question_id: str, escalator_id: str, escalator_role: str, reason: Optional[str] = None) -> Dict[str, Any]:
        new_status = "escalated_to_faculty" if escalator_role == "teacher" else "escalated_to_hod"
        updates = {
            "status": new_status,
            "released_to_student": False,
            "reviewed_by": escalator_id,
            "faculty_note": reason,
        }
        await self.store.update_item(question_id, updates)
        return {"success": True, "status": new_status}

    async def _bank_verified_answer(self, queue_item: Dict[str, Any], approved_answer: str, teacher_id: str) -> None:
        queue_id = queue_item.get("id")
        if not queue_id: return
        bank_payload = {
            "source_queue_id": queue_id,
            "question_signature": queue_item.get("question_signature"),
            "question_text": queue_item.get("student_question"),
            "answer_content": approved_answer,
            "course_id": queue_item.get("course_id"),
            "approved_by": teacher_id,
            "created_at": self._now_iso(),
        }
        await self.store.bank_verified_answer(bank_payload)

    async def _update_model_confidence(self, queue_item: Dict[str, Any], feedback: bool) -> None:
        try:
            original_confidence = queue_item.get("ai_confidence", 0.5)
            new_confidence = min(original_confidence + 0.05, 1.0) if feedback else max(original_confidence - 0.1, 0.0)
            await self.store.insert_metrics("ai_model_metrics", {
                "model_id": queue_item.get("ai_model") or "unknown",
                "question_type": queue_item.get("question_type", "general"),
                "original_confidence": original_confidence,
                "adjusted_confidence": new_confidence,
                "teacher_feedback": "approved" if feedback else "rejected",
                "recorded_at": self._now_iso(),
            })
        except Exception: pass

    async def get_queue_metrics(self, teacher_id: str) -> Dict[str, Any]:
        rows = await self.store.get_teacher_items(teacher_id)
        if not rows: return {"pending_count": 0, "avg_response_time_sec": 0, "total_reviewed": 0}

        total = len(rows)
        pending = sum(1 for r in rows if r.get("status") in {"pending", "ai_answered"})
        approved = sum(1 for r in rows if r.get("status") in {"approved", "edited_approved"})
        rejected = sum(1 for r in rows if r.get("status") == "rejected")
        
        response_times = []
        for row in rows:
            if row.get("verified_at") and row.get("created_at"):
                try:
                    c = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
                    v = datetime.fromisoformat(row["verified_at"].replace("Z", "+00:00"))
                    response_times.append((v - c).total_seconds())
                except Exception: continue

        return {
            "pending_count": pending,
            "avg_response_time_sec": int(sum(response_times)/len(response_times)) if response_times else 0,
            "approval_rate": round(approved / total * 100, 2) if total > 0 else 0,
            "rejection_rate": round(rejected / total * 100, 2) if total > 0 else 0,
            "total_reviewed": approved + rejected,
        }
