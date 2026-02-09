from typing import Dict, List
from datetime import datetime
from app.database.manager import db
from app.core.logging import structlog

log = structlog.get_logger()


class UserDataStore:
    """
    MongoDB store for User Data (Progress, Notes, Quiz History).
    All methods are ASYNC.
    """

    def __init__(self):
        pass

    @property
    def user_data_collection(self):
        # Use get_collection which handles connection check
        return db.get_collection("user_data")

    async def _get_or_create_user(self, user_id: str) -> dict:
        collection = self.user_data_collection
        if collection is None:
            raise Exception("Database not connected")

        doc = await collection.find_one({"user_id": user_id})
        if not doc:
            doc = {
                "user_id": user_id,
                "progress": {"completed_modules": [], "current_score": 0},
                "notes": [],
                "quiz_history": [],
                "updated_at": datetime.now().isoformat(),
            }
            try:
                await collection.insert_one(doc)
            except Exception as e:
                # Handle race condition where it might have been created
                log.warning("user_data_create_race", error=str(e))
                doc = await collection.find_one({"user_id": user_id})
        return doc

    # --- Quiz History ---

    async def add_quiz_attempt(self, user_id: str, attempt: dict):
        collection = self.user_data_collection
        if collection is None:
            log.error("db_not_connected_quiz_attempt")
            return

        attempt["timestamp"] = datetime.now().isoformat()

        # We need to fetch history to update average
        # Optimize: Use aggregation or just $push and recalc on read if history is long
        # For now, simplistic approach consistent with previous logic
        doc = await self._get_or_create_user(user_id)
        history = doc.get("quiz_history", [])
        history.append(attempt)

        avg = sum(a.get("score", 0) for a in history) / len(history) if history else 0

        await collection.update_one(
            {"user_id": user_id},
            {
                "$push": {"quiz_history": attempt},
                "$set": {
                    "progress.current_score": round(avg, 2),
                    "updated_at": datetime.now().isoformat(),
                },
            },
        )

    async def get_recent_quiz_stats(self, user_id: str, limit: int = 5) -> Dict:
        collection = self.user_data_collection
        if collection is None:
            return {
                "attempt_count": 0,
                "recent_average": 0,
                "weak_topics": [],
                "error": "DB Disconnected",
            }

        doc = await collection.find_one({"user_id": user_id})
        if not doc or not doc.get("quiz_history"):
            return {"attempt_count": 0, "recent_average": 0, "weak_topics": []}

        history = doc["quiz_history"]
        recent = history[-limit:]

        avg = sum(a.get("score", 0) for a in recent) / len(recent) if recent else 0

        # Weak topic analysis
        weak_topics = set()
        for h in history:
            if h.get("score", 0) < 60 and h.get("topic"):
                weak_topics.add(h.get("topic"))

        return {
            "attempt_count": len(history),
            "recent_average": round(avg, 2),
            "weak_topics": list(weak_topics),
            "recent_history": recent,
        }

    # --- Notes ---

    async def add_note(self, user_id: str, content: str):
        collection = self.user_data_collection
        if collection is None:
            return

        # Ensure user exists first
        await self._get_or_create_user(user_id)

        note = {"content": content, "timestamp": datetime.now().isoformat()}

        await collection.update_one(
            {"user_id": user_id},
            {"$push": {"notes": note}, "$set": {"updated_at": datetime.now().isoformat()}},
        )

    async def get_notes(self, user_id: str) -> List[Dict]:
        collection = self.user_data_collection
        if collection is None:
            return []

        doc = await collection.find_one({"user_id": user_id})
        return doc.get("notes", []) if doc else []

    # --- Progress ---

    async def update_progress_metric(self, user_id: str, metric: str, value: any):
        collection = self.user_data_collection
        if collection is None:
            return

        await self._get_or_create_user(user_id)

        await collection.update_one(
            {"user_id": user_id},
            {"$set": {f"progress.{metric}": value, "updated_at": datetime.now().isoformat()}},
        )

    async def get_full_profile_string(self, user_id: str) -> str:
        """Returns a string summary for AI Context injection"""
        stats = await self.get_recent_quiz_stats(user_id)
        notes = await self.get_notes(user_id)

        weak_str = (
            ", ".join(stats.get("weak_topics", [])) if stats.get("weak_topics") else "None detected"
        )

        return (
            f"User Profile ({user_id}):\n"
            f"- Average Recent Score: {stats.get('recent_average', 0)}%\n"
            f"- Total Quizzes Taken: {stats.get('attempt_count', 0)}\n"
            f"- Weak Topics: {weak_str}\n"
            f"- Notes Saved: {len(notes)}\n"
        )
