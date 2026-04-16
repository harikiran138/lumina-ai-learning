from typing import Any, Dict, List, Optional
from app.database.supabase_manager import supabase_db
from app.store.base_store import BaseStoreMixin
from app.core.logging import structlog

log = structlog.get_logger()

class AIQueueStore(BaseStoreMixin):
    """
    Persistence layer for the AI answer queue.
    """
    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db

    async def create_item(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a queue item."""
        try:
            response = await self.db.table("ai_answer_queue").insert(payload).async_execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("store_create_item_failed", error=str(e))
            return None

    async def get_items_by_student(self, student_id: str) -> List[Dict[str, Any]]:
        """Fetch queue items for a specific student."""
        try:
            response = await self.db.table("ai_answer_queue").select(
                "id, student_question, status, created_at, teacher_edited_answer, ai_generated_answer"
            ).eq("student_id", student_id).order("created_at", desc=False).async_execute()
            return response.data or []
        except Exception as e:
            log.error("store_get_items_by_student_failed", student_id=student_id, error=str(e))
            return []

    async def get_pending_items_for_class(self, class_id: str) -> List[Dict[str, Any]]:
        """Fetch pending queue items for a specific class."""
        try:
            response = await self.db.table("ai_answer_queue").select("*").eq("class_id", class_id).eq("status", "pending").async_execute()
            return response.data or []
        except Exception as e:
            log.error("store_get_pending_items_for_class_failed", class_id=class_id, error=str(e))
            return []

    async def get_all_items(self, course_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch all queue items, optionally filtered by course."""
        try:
            query = self.db.table("ai_answer_queue").select("*").order("created_at", desc=True)
            if course_id:
                query = query.eq("course_id", course_id)
            response = await query.async_execute()
            return response.data or []
        except Exception as e:
            log.error("store_get_all_items_failed", error=str(e))
            return []

    async def get_item_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single queue item by ID."""
        try:
            response = await self.db.table("ai_answer_queue").select("*").eq("id", item_id).async_execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("store_get_item_failed", item_id=item_id, error=str(e))
            return None

    async def update_item(self, item_id: str, updates: Dict[str, Any]) -> bool:
        """Update a queue item. Includes fallback for legacy columns."""
        EXISTING_QUEUE_COLUMNS = {
            "id", "student_id", "teacher_id", "course_id", "student_question",
            "ai_generated_answer", "teacher_edited_answer", "status",
            "created_at", "verified_at", "priority_score", "question_id",
            "ai_model", "ai_confidence", "ai_sources", "final_answer",
            "faculty_note", "college_id", "reviewed_by", "reviewed_at",
            "ai_draft", "is_deleted", "deleted_at", "released_to_student",
            "released_at", "added_to_bank", "added_to_bank_at",
            "teacher_custom_answer", "priority_factors", "rejection_reason",
            "student_acknowledged", "student_acked_at", "teacher_note", "teacher_suggestion"
        }
        try:
            await self.db.table("ai_answer_queue").update(updates).eq("id", item_id).async_execute()
            return True
        except Exception as e:
            log.warning("store_update_item_retrying_legacy", item_id=item_id, error=str(e))
            legacy_updates = {k: v for k, v in updates.items() if k in EXISTING_QUEUE_COLUMNS}
            try:
                await self.db.table("ai_answer_queue").update(legacy_updates).eq("id", item_id).async_execute()
                return True
            except Exception as e2:
                log.error("store_update_item_failed", item_id=item_id, error=str(e2))
                return False

    async def update_item_status(self, item_id: str, status: str, reviewer_id: str) -> bool:
        """Update queue status with reviewer identity."""
        updates = {
            "status": status,
            "reviewed_by": reviewer_id,
            "reviewed_at": "now()",
        }
        return await self.update_item(item_id, updates)

    async def bank_verified_answer(self, bank_payload: Dict[str, Any]) -> bool:
        """Store a verified answer in the knowledge bank."""
        try:
            # Check for existing
            queue_id = bank_payload.get("source_queue_id")
            existing = await self.db.table("verified_answers_bank").select("id").eq("source_queue_id", queue_id).async_execute()
            if existing.data:
                return True
            
            await self.db.table("verified_answers_bank").insert(bank_payload).async_execute()
            return True
        except Exception as e:
            log.error("store_bank_answer_failed", error=str(e))
            return False

    async def insert_metrics(self, table: str, metrics: Dict[str, Any]) -> bool:
        """Insert metrics data into specified table."""
        try:
            await self.db.table(table).insert(metrics).async_execute()
            return True
        except Exception as e:
            log.warning("store_insert_metrics_failed", table=table, error=str(e))
            return False

    async def get_teacher_items(self, teacher_id: str) -> List[Dict[str, Any]]:
        """Fetch all queue items for a specific teacher."""
        try:
            response = await self.db.table("ai_answer_queue").select("*").eq("teacher_id", teacher_id).async_execute()
            return response.data or []
        except Exception as e:
            log.error("store_get_teacher_items_failed", teacher_id=teacher_id, error=str(e))
            return []

    async def get_student_info(self, student_ids: List[str]) -> List[Dict[str, Any]]:
        """Enrich queue items with student details."""
        if not student_ids:
            return []
        try:
            response = await self.db.table("users").select("id, full_name, email").in_("id", student_ids).async_execute()
            return response.data or []
        except Exception as e:
            log.error("store_get_student_info_failed", error=str(e))
            return []


async def get_items_by_student(db, student_id: str) -> List[Dict[str, Any]]:
    return await AIQueueStore(db).get_items_by_student(student_id)


async def get_pending_items_for_class(db, class_id: str) -> List[Dict[str, Any]]:
    return await AIQueueStore(db).get_pending_items_for_class(class_id)


async def get_item_by_id(db, item_id: str) -> Optional[Dict[str, Any]]:
    return await AIQueueStore(db).get_item_by_id(item_id)


async def update_item_status(db, item_id: str, status: str, reviewer_id: str) -> bool:
    return await AIQueueStore(db).update_item_status(item_id, status, reviewer_id)


async def get_all_items(db) -> List[Dict[str, Any]]:
    return await AIQueueStore(db).get_all_items()
