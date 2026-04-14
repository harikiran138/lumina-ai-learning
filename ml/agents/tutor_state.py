import hashlib
import json
import os
from datetime import datetime
from typing import Dict


class TutorStateManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TutorStateManager, cls).__new__(cls)
            cls._instance._init_store()
        return cls._instance

    def _init_store(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(base_dir, "data")
        os.makedirs(data_dir, exist_ok=True)
        self.file_path = os.path.join(data_dir, "tutor_sessions.json")

    def _load_sessions(self) -> Dict[str, dict]:
        if not os.path.exists(self.file_path):
            return {}

        try:
            with open(self.file_path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except (json.JSONDecodeError, OSError):
            return {}

    def _save_sessions(self, sessions: Dict[str, dict]):
        with open(self.file_path, "w", encoding="utf-8") as handle:
            json.dump(sessions, handle, indent=2)

    def _default_session(self, session_id: str) -> dict:
        now = datetime.utcnow().isoformat()
        return {
            "session_id": session_id,
            "asked_hashes": [],
            "asked_questions_preview": [],
            "topic_coverage": {},
            "last_activity": now,
            "updated_at": now,
        }

    async def get_session(self, session_id: str) -> dict:
        sessions = self._load_sessions()
        session = sessions.get(session_id)
        if not session:
            session = self._default_session(session_id)
            sessions[session_id] = session
            self._save_sessions(sessions)
        return session

    def _compute_hash(self, text: str) -> str:
        normalized = "".join(text.lower().split())
        return hashlib.sha256(normalized.encode()).hexdigest()

    async def add_question(self, session_id: str, question_text: str):
        sessions = self._load_sessions()
        session = sessions.get(session_id) or self._default_session(session_id)

        q_hash = self._compute_hash(question_text)
        preview = question_text[:50] + "..." if len(question_text) > 50 else question_text

        if q_hash not in session["asked_hashes"]:
            session["asked_hashes"].append(q_hash)
        if preview not in session["asked_questions_preview"]:
            session["asked_questions_preview"] = (session["asked_questions_preview"] + [preview])[-20:]

        session["last_activity"] = datetime.utcnow().isoformat()
        session["updated_at"] = session["last_activity"]
        sessions[session_id] = session
        self._save_sessions(sessions)

    async def is_duplicate(self, session_id: str, question_text: str) -> bool:
        doc = await self.get_session(session_id)
        q_hash = self._compute_hash(question_text)
        return q_hash in doc.get("asked_hashes", [])

    async def get_avoid_context(self, session_id: str) -> str:
        doc = await self.get_session(session_id)
        previews = doc.get("asked_questions_preview", [])
        if not previews:
            return ""
        return "\n".join([f"- {question}" for question in previews])


def get_tutor_state() -> TutorStateManager:
    return TutorStateManager()
