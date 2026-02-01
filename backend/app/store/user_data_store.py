from typing import Dict, List
from datetime import datetime
from .database import db


class UserDataStore:
    """
    MongoDB store for User Data (Progress, Notes, Quiz History).
    """

    def __init__(self):
        self._user_data_collection = None

    @property
    def user_data_collection(self):
        if self._user_data_collection is None:
            _db = db.get_db()
            if _db is not None:
                self._user_data_collection = _db["user_data"]
                try:
                    self._user_data_collection.create_index("user_id", unique=True)
                except Exception as e:
                    from app.core.logging import structlog

                    log = structlog.get_logger()
                    log.error("index_creation_failed", error=str(e), collection="user_data")
            else:
                from app.core.logging import structlog
                from fastapi import HTTPException

                log = structlog.get_logger()
                log.error("mongodb_connection_missing", collection="user_data")
                raise HTTPException(status_code=503, detail="Database connection unavailable")
        return self._user_data_collection

    def _get_or_create_user(self, user_id: str) -> dict:
        collection = self.user_data_collection
        if collection is None:
            raise Exception("Database not connected")

        doc = collection.find_one({"user_id": user_id})
        if not doc:
            doc = {
                "user_id": user_id,
                "progress": {"completed_modules": [], "current_score": 0},
                "notes": [],
                "quiz_history": [],
                "updated_at": datetime.now().isoformat(),
            }
            collection.insert_one(doc)
        return doc

    # --- Quiz History ---

    def add_quiz_attempt(self, user_id: str, attempt: dict):
        collection = self.user_data_collection
        if collection is None:
            return

        attempt["timestamp"] = datetime.now().isoformat()

        # Calculate new average
        doc = self._get_or_create_user(user_id)
        history = doc.get("quiz_history", [])
        history.append(attempt)

        avg = sum(a.get("score", 0) for a in history) / len(history) if history else 0

        collection.update_one(
            {"user_id": user_id},
            {
                "$push": {"quiz_history": attempt},
                "$set": {
                    "progress.current_score": round(avg, 2),
                    "updated_at": datetime.now().isoformat(),
                },
            },
        )

    def get_recent_quiz_stats(self, user_id: str, limit: int = 5) -> Dict:
        collection = self.user_data_collection
        if collection is None:
            return {"error": "DB not connected"}

        doc = collection.find_one({"user_id": user_id})
        if not doc or not doc.get("quiz_history"):
            return {"attempt_count": 0, "recent_average": 0, "weak_topics": []}

        history = doc["quiz_history"][-limit:]
        full_history = doc["quiz_history"]

        avg = sum(a.get("score", 0) for a in history) / len(history)
        # Simple weak topic analysis (score < 50)
        weak_topics = []
        for h in history:
            if h.get("score", 0) < 50 and h.get("topic"):
                weak_topics.append(h.get("topic"))

        return {
            "attempt_count": len(full_history),
            "recent_average": round(avg, 2),
            "weak_topics": list(set(weak_topics)),
            "recent_history": history,
        }

    # --- Notes ---

    def add_note(self, user_id: str, content: str):
        collection = self.user_data_collection
        if collection is None:
            return

        self._get_or_create_user(user_id)  # Ensure exists

        note = {"content": content, "timestamp": datetime.now().isoformat()}

        collection.update_one(
            {"user_id": user_id},
            {"$push": {"notes": note}, "$set": {"updated_at": datetime.now().isoformat()}},
        )

    def get_notes(self, user_id: str) -> List[Dict]:
        collection = self.user_data_collection
        if collection is None:
            return []

        doc = collection.find_one({"user_id": user_id})
        return doc.get("notes", []) if doc else []

    # --- Progress ---

    def update_progress_metric(self, user_id: str, metric: str, value: any):
        collection = self.user_data_collection
        if collection is None:
            return

        self._get_or_create_user(user_id)

        collection.update_one(
            {"user_id": user_id},
            {"$set": {f"progress.{metric}": value, "updated_at": datetime.now().isoformat()}},
        )

    def get_full_profile_string(self, user_id: str) -> str:
        """Returns a string summary for AI Context injection"""
        stats = self.get_recent_quiz_stats(user_id)
        notes = self.get_notes(user_id)

        return (
            f"User Profile ({user_id}):\n"
            f"- Average Quiz Score: {stats.get('recent_average', 0)}%\n"
            f"- Total Quizzes Taken: {stats.get('attempt_count', 0)}\n"
            f"- Weak Topics: {', '.join(stats.get('weak_topics', [])) if stats.get('weak_topics') else 'None detected'}\n"
            f"- Notes Saved: {len(notes)}\n"
        )
