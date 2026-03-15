import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.logging import structlog
from app.database.supabase_manager import supabase_db
from app.store.agent_store import AgentStore

log = structlog.get_logger()


class TutorMemoryStore:
    """
    Persistent memory layer for the tutor agent.

    - Uses Supabase conversations when available.
    - Falls back to local JSON storage when Supabase is disabled.
    """

    def __init__(self):
        self.client = supabase_db.get_client()
        self.agent_store = AgentStore() if self.client else None

        base_dir = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        data_dir = os.path.join(base_dir, "data")
        os.makedirs(data_dir, exist_ok=True)
        self.file_path = os.path.join(data_dir, "tutor_memory.json")

    def _read_local(self) -> Dict[str, Any]:
        if not os.path.exists(self.file_path):
            return {"users": {}}

        try:
            with open(self.file_path, "r", encoding="utf-8") as handle:
                payload = json.load(handle)
        except (OSError, json.JSONDecodeError):
            return {"users": {}}

        if not isinstance(payload, dict):
            return {"users": {}}
        payload.setdefault("users", {})
        return payload

    def _write_local(self, payload: Dict[str, Any]):
        with open(self.file_path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)

    def _get_local_user(self, payload: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        users = payload.setdefault("users", {})
        user_doc = users.get(user_id)
        if not user_doc:
            user_doc = {"messages": [], "signals": [], "last_updated": None}
            users[user_id] = user_doc
        return user_doc

    async def get_recent_messages(
        self, user_id: str, limit: int = 8, agent_id: str = "tutor"
    ) -> List[Dict[str, Any]]:
        if not user_id:
            return []

        if self.agent_store and self.client:
            try:
                return await self.agent_store.get_conversation_history(
                    user_id, agent_id, limit=limit
                )
            except Exception as exc:
                log.warning("tutor_memory_supabase_history_failed", error=str(exc))

        payload = self._read_local()
        user_doc = self._get_local_user(payload, user_id)
        messages = user_doc.get("messages", []) or []
        return messages[-limit:]

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

        if self.agent_store and self.client:
            try:
                await self.agent_store.save_message(user_id, agent_id, role, content)
                return
            except Exception as exc:
                log.warning("tutor_memory_supabase_save_failed", error=str(exc))

        payload = self._read_local()
        user_doc = self._get_local_user(payload, user_id)
        entry = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if metadata:
            entry["metadata"] = metadata
        messages = (user_doc.get("messages") or []) + [entry]
        user_doc["messages"] = messages[-50:]
        user_doc["last_updated"] = datetime.utcnow().isoformat()
        self._write_local(payload)

    async def record_signal(
        self,
        user_id: str,
        signal: str,
        note: Optional[str] = None,
    ):
        if not user_id or not signal:
            return

        payload = self._read_local()
        user_doc = self._get_local_user(payload, user_id)
        signals = user_doc.get("signals", []) or []
        signals.append(
            {
                "signal": signal,
                "note": note,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )
        user_doc["signals"] = signals[-20:]
        user_doc["last_updated"] = datetime.utcnow().isoformat()
        self._write_local(payload)
