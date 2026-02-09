import hashlib

from app.database.manager import DatabaseManager as db
from app.database.models import TutorSession
from datetime import datetime


class TutorStateManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TutorStateManager, cls).__new__(cls)
        return cls._instance

    @property
    def collection(self):
        return db.get_collection("tutor_sessions")

    async def get_session(self, session_id: str) -> dict:
        if self.collection is None:
            return {}

        doc = await self.collection.find_one({"session_id": session_id})
        if not doc:
            # Create a new session doc
            new_session = TutorSession(session_id=session_id)
            await self.collection.insert_one(new_session.model_dump(by_alias=True))
            return new_session.model_dump()

        return doc

    def _compute_hash(self, text: str) -> str:
        # Normalize: lower case and remove whitespace
        normalized = "".join(text.lower().split())
        return hashlib.sha256(normalized.encode()).hexdigest()

    async def add_question(self, session_id: str, question_text: str):
        if self.collection is None:
            return

        q_hash = self._compute_hash(question_text)
        preview = question_text[:50] + "..." if len(question_text) > 50 else question_text

        # Atomically update the session
        # Use $addToSet for hashes to ensure uniqueness, and $push for preview if not exists
        await self.collection.update_one(
            {"session_id": session_id},
            {
                "$addToSet": {"asked_hashes": q_hash},
                "$set": {
                    "last_activity": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                },
            },
        )

        # Check if preview already in list before pushing to keep it simple or just use $addToSet
        await self.collection.update_one(
            {"session_id": session_id, "asked_questions_preview": {"$ne": preview}},
            {
                "$push": {
                    "asked_questions_preview": {"$each": [preview], "$slice": -20}  # Keep last 20
                }
            },
        )

    async def is_duplicate(self, session_id: str, question_text: str) -> bool:
        doc = await self.get_session(session_id)
        q_hash = self._compute_hash(question_text)
        return q_hash in doc.get("asked_hashes", [])

    async def get_avoid_context(self, session_id: str) -> str:
        doc = await self.get_session(session_id)
        previews = doc.get("asked_questions_preview", [])
        if not previews:
            return ""

        # Return a prompt-friendly string
        return "\n".join([f"- {q}" for q in previews])


# Singleton accessor
def get_tutor_state() -> TutorStateManager:
    return TutorStateManager()
