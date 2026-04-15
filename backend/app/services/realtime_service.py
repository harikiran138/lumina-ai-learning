"""
Real-time Event Service - Central event dispatcher for WebSocket broadcasts.

Responsibilities:
- Create and structure events
- Broadcast to WebSocket connections
- Store events in database (polling fallback)
- Manage event queuing/processing
"""

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Set

from app.core.logging import structlog
from app.database.supabase_manager import supabase_db

log = structlog.get_logger()


class RealtimeService:
    """
    Manages real-time events and broadcasts them to connected clients.
    
    Event types:
    - answer.auto_approved    → AI answer auto-approved (instant)
    - answer.provisional_ready → AI answer ready for review
    - answer.approved_by_teacher → Teacher approved the answer
    - answer.rejected          → Answer rejected by teacher
    - queue_position_updated   → Student's position in queue changed
    - answer.status_changed    → Generic status change event
    """

    def __init__(self):
        self.client = supabase_db.get_client()
        self.event_subscribers: Dict[str, Set[Any]] = {}  # In-memory for WebSocket manager

    @staticmethod
    def _now_iso() -> str:
        """Return current timestamp in ISO format."""
        return datetime.now(timezone.utc).isoformat()

    async def emit_answer_ready(
        self,
        question_id: str,
        student_id: str,
        answer: str,
        status: str,
        confidence: float,
        safety_score: Optional[float] = None,
        source: str = "ai_auto",
        rag_sources: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Emit event: AI answer is ready for student.
        
        Status values:
        - AUTO_APPROVED: Instant answer from AI (high confidence + safety)
        - PROVISIONAL: Answer ready but under teacher review
        - APPROVED: Teacher approved the answer
        
        Args:
            question_id: Question being answered
            student_id: Student recipient
            answer: The answer text
            status: AUTO_APPROVED | PROVISIONAL | APPROVED
            confidence: AI confidence score (0-1)
            safety_score: Safety validation score (0-1)
            source: Where answer came from (ai_auto | ai_provisional | teacher_approved)
            rag_sources: RAG retrieval sources
            
        Returns:
            {
                "event_id": str, 
                "status": "queued|stored",
                "broadcast_result": "success|failed_fallback_available|error"
            }
        """
        event_type = f"answer.{status.lower()}"

        event = {
            "event": event_type,
            "timestamp": self._now_iso(),
            "data": {
                "question_id": question_id,
                "student_id": student_id,
                "answer": answer,
                "confidence": confidence,
                "safety_score": safety_score,
                "source": source,
                "rag_sources": rag_sources or [],
                "status": status,
            },
            "metadata": {
                "server_time": self._now_iso(),
            },
        }

        # Store event for polling fallback FIRST (before broadcast attempt)
        event_id = await self._store_event(event, question_id, student_id)

        # Attempt real-time WebSocket broadcast
        broadcast_result = "success"
        try:
            broadcast_ok = await self._broadcast_to_student(student_id, event)
            if not broadcast_ok:
                broadcast_result = "failed_fallback_available"
        except Exception as exc:
            log.error(
                "broadcast_exception",
                question_id=question_id,
                error=str(exc)
            )
            broadcast_result = "error"

        log.info(
            "answer_ready_event_emitted",
            question_id=question_id,
            student_id=student_id,
            status=status,
            event_id=event_id,
            broadcast=broadcast_result
        )

        return {
            "event_id": event_id,
            "status": "queued",
            "broadcast_result": broadcast_result
        }

    async def emit_queue_update(
        self,
        question_id: str,
        student_id: str,
        position: int,
        queue_length: int,
        estimated_wait_sec: int,
    ) -> Dict[str, Any]:
        """
        Emit event: Student's queue position updated.
        
        Args:
            question_id: Question in queue
            student_id: Student recipient
            position: Current position (1-indexed)
            queue_length: Total questions in queue
            estimated_wait_sec: Estimated wait time
            
        Returns:
            {"event_id": str, "status": "queued"}
        """
        event = {
            "event": "queue_position_updated",
            "timestamp": self._now_iso(),
            "data": {
                "question_id": question_id,
                "position": position,
                "queue_length": queue_length,
                "estimated_wait_seconds": estimated_wait_sec,
                "avg_review_time_min": estimated_wait_sec / 60,
            },
            "metadata": {
                "server_time": self._now_iso(),
            },
        }

        event_id = await self._store_event(event, question_id, student_id)
        await self._broadcast_to_student(student_id, event)

        log.info(
            "queue_update_event_emitted",
            question_id=question_id,
            position=position,
            queue_length=queue_length,
        )

        return {"event_id": event_id, "status": "queued"}

    async def emit_answer_approved(
        self,
        question_id: str,
        student_id: str,
        answer: str,
        teacher_name: str,
        teacher_feedback: Optional[str] = None,
        source: str = "teacher_approved",
    ) -> Dict[str, Any]:
        """
        Emit event: Teacher approved the answer.
        
        Args:
            question_id: Question ID
            student_id: Student recipient
            answer: The approved answer
            teacher_name: Name of approving teacher
            teacher_feedback: Optional feedback from teacher
            source: Source (always "teacher_approved")
            
        Returns:
            {"event_id": str, "status": "queued"}
        """
        event = {
            "event": "answer.approved_by_teacher",
            "timestamp": self._now_iso(),
            "data": {
                "question_id": question_id,
                "answer": answer,
                "teacher_name": teacher_name,
                "teacher_feedback": teacher_feedback,
                "source": source,
                "status": "APPROVED",
            },
            "metadata": {
                "server_time": self._now_iso(),
                "priority": "high",
            },
        }

        event_id = await self._store_event(event, question_id, student_id)
        await self._broadcast_to_student(student_id, event)

        log.info(
            "answer_approved_event_emitted",
            question_id=question_id,
            teacher_name=teacher_name,
        )

        return {"event_id": event_id, "status": "queued"}

    async def emit_answer_rejected(
        self,
        question_id: str,
        student_id: str,
        reason: str,
        teacher_name: str,
        suggestion: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Emit event: Teacher rejected the answer.
        
        Args:
            question_id: Question ID
            student_id: Student recipient
            reason: Rejection reason
            teacher_name: Name of rejecting teacher
            suggestion: Optional suggestion for improvement
            
        Returns:
            {"event_id": str, "status": "queued"}
        """
        event = {
            "event": "answer.rejected",
            "timestamp": self._now_iso(),
            "data": {
                "question_id": question_id,
                "reason": reason,
                "teacher_name": teacher_name,
                "suggestion": suggestion,
                "status": "REJECTED",
            },
            "metadata": {
                "server_time": self._now_iso(),
                "priority": "high",
            },
        }

        event_id = await self._store_event(event, question_id, student_id)
        await self._broadcast_to_student(student_id, event)

        log.info(
            "answer_rejected_event_emitted",
            question_id=question_id,
            reason=reason,
        )

        return {"event_id": event_id, "status": "queued"}

    async def broadcast_to_student(
        self,
        student_id: str,
        event_type: str,
        payload: Dict[str, Any],
    ) -> None:
        """
        Generic broadcast to student WebSocket.
        
        Args:
            student_id: Recipient student ID
            event_type: Event type string
            payload: Event payload
        """
        event = {
            "event": event_type,
            "timestamp": self._now_iso(),
            "data": payload,
        }

        await self._broadcast_to_student(student_id, event)

    async def _broadcast_to_student(
        self,
        student_id: str,
        event: Dict[str, Any],
        max_retries: int = 3,
    ) -> bool:
        """
        Broadcast event to student's WebSocket connections with retry logic.
        
        This delegates to the router's ConnectionManager via broadcast_ai_tutor_event().
        If WebSocket fails, the event is already stored in database for polling fallback.
        
        Args:
            student_id: Target student ID
            event: Event payload with structure {"event": str, "timestamp": str, "data": {...}}
            max_retries: Number of retry attempts
            
        Returns:
            True if broadcast succeeded, False if all retries failed (but db fallback exists)
        """
        try:
            # Dynamic import to avoid circular dependency
            from app.routers.realtime import broadcast_ai_tutor_event
            
            for attempt in range(max_retries):
                try:
                    await broadcast_ai_tutor_event(student_id, event)
                    
                    log.info(
                        "event_broadcast_success",
                        student_id=student_id,
                        event_type=event.get("event"),
                        attempt=attempt + 1
                    )
                    return True
                    
                except Exception as ws_exc:
                    if attempt < max_retries - 1:
                        # Exponential backoff: 100ms, 200ms, 400ms
                        wait_time = 0.1 * (2 ** attempt)
                        log.warning(
                            "event_broadcast_retry",
                            student_id=student_id,
                            attempt=attempt + 1,
                            max_retries=max_retries,
                            wait_ms=int(wait_time * 1000),
                            error=str(ws_exc)
                        )
                        await asyncio.sleep(wait_time)
                    else:
                        # Final retry failed - but database fallback is already in place
                        log.warning(
                            "event_broadcast_failed_fallback_available",
                            student_id=student_id,
                            event_type=event.get("event"),
                            error=str(ws_exc),
                            note="Event stored in database for polling - student will receive on next poll"
                        )
                        return False
        
        except ImportError as imp_exc:
            log.error(
                "broadcast_import_failed",
                error=str(imp_exc),
                note="Cannot import broadcast function - WebSocket module may not be available"
            )
            return False
        except Exception as exc:
            log.error(
                "event_broadcast_error",
                student_id=student_id,
                error=str(exc)
            )
            return False

    async def _store_event(
        self,
        event: Dict[str, Any],
        question_id: str,
        student_id: str,
    ) -> str:
        """
        Store event in database for polling fallback.
        
        Used when WebSocket is unavailable or as redundancy.
        
        Args:
            event: Event dict
            question_id: Associated question ID
            student_id: Recipient student
            
        Returns:
            Event ID
        """
        try:
            payload = {
                "student_id": student_id,
                "question_id": question_id,
                "event_type": event.get("event"),
                "event_data": event,
                "created_at": self._now_iso(),
                "consumed": False,
            }

            result = self.client.table("realtime_events").insert(payload).execute()

            if result.data:
                return str(result.data[0].get("id", ""))

            return "stored"
        except Exception as exc:
            log.warning(
                "event_storage_failed",
                question_id=question_id,
                error=str(exc),
            )
            return "queued"

    async def get_pending_events(
        self,
        student_id: str,
        question_id: Optional[str] = None,
        limit: int = 50,
    ) -> list:
        """
        Get pending events for student (polling fallback).
        
        Args:
            student_id: Student ID
            question_id: Optional filter by question
            limit: Maximum events to return
            
        Returns:
            List of events
        """
        try:
            query = (
                self.client.table("realtime_events")
                .select("*")
                .eq("student_id", student_id)
                .eq("consumed", False)
                .order("created_at", desc=True)
                .limit(limit)
            )

            if question_id:
                query = query.eq("question_id", question_id)

            result = query.execute()
            return result.data or []
        except Exception as exc:
            log.error(
                "pending_events_fetch_failed",
                student_id=student_id,
                error=str(exc),
            )
            return []

    async def mark_event_consumed(
        self,
        event_id: str,
    ) -> None:
        """Mark event as consumed (read by client)."""
        try:
            self.client.table("realtime_events").update({"consumed": True}).eq("id", event_id).execute()
        except Exception as exc:
            log.warning("event_consumption_mark_failed", event_id=event_id, error=str(exc))

    async def cleanup_old_events(
        self,
        days_old: int = 7,
    ) -> int:
        """
        Clean up old events from database.
        
        Should be run periodically (e.g., daily).
        
        Args:
            days_old: Delete events older than this many days
            
        Returns:
            Number of events deleted
        """
        try:
            cutoff = datetime.now(timezone.utc)
            cutoff = cutoff.replace(
                day=cutoff.day - days_old if cutoff.day - days_old > 0 else 1
            )

            result = (
                self.client.table("realtime_events")
                .delete()
                .lt("created_at", cutoff.isoformat())
                .execute()
            )

            deleted = len(result.data or [])
            log.info("realtime_events_cleaned_up", deleted=deleted)
            return deleted
        except Exception as exc:
            log.error("event_cleanup_failed", error=str(exc))
            return 0
