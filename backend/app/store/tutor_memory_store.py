from datetime import datetime
from typing import Any, Dict, List, Optional
from app.core.logging import structlog
from app.database.supabase_manager import supabase_db
from app.store.agent_store import AgentStore

log = structlog.get_logger()


class TutorMemoryStore:
    """
    Persistent memory layer for the tutor agent.
    Exclusively uses Supabase via AgentStore/Conversations.
    """

    def __init__(self):
        self.db = supabase_db
        self.agent_store = AgentStore()

    async def get_recent_messages(
        self, user_id: str, limit: int = 8, agent_id: str = "tutor"
    ) -> List[Dict[str, Any]]:
        if not user_id:
            return []
        try:
            return await self.agent_store.get_conversation_history(
                user_id, agent_id, limit=limit
            )
        except Exception as exc:
            log.warning("tutor_memory_history_failed", error=str(exc), user_id=user_id)
            return []

    async def append_message(
        self,
        user_id: str,
        role: str,
        content: str,
        agent_id: str = "tutor",
        metadata: Optional[Dict[str, Any]] = None,
    ):
        if not user_id:
            return
        try:
            await self.agent_store.save_message(user_id, agent_id, role, content)
        except Exception as exc:
            log.warning("tutor_memory_save_failed", error=str(exc), user_id=user_id)

    async def record_signal(
        self,
        user_id: str,
        signal: str,
        note: Optional[str] = None,
    ):
        """Records a learner signal (e.g., 'confusion', 'mastery') in agent memory."""
        if not user_id or not signal:
            return
        try:
            # We record signals as special 'context' items in agent_memory
            await self.agent_store.store_memory(
                agent_id="tutor",
                user_id=user_id,
                key=f"signal:{signal}",
                value=note or "detected"
            )
        except Exception as exc:
            log.warning("tutor_record_signal_failed", error=str(exc), user_id=user_id)
