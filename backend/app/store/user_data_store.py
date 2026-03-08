from typing import Dict, List
from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class UserDataStore:
    """
    Supabase store for User Data (Progress, Notes, Quiz History).
    Assumes a user_data table with JSONB fields: progress, notes, quiz_history.
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    @property
    def user_data_collection(self):
        return self.client.table("user_data")

    async def _get_or_create_user(self, user_id: str) -> dict:
        try:
            response = self.user_data_collection.select("*").eq("user_id", user_id).execute()
            if response.data:
                return response.data[0]
                
            doc = {
                "user_id": user_id,
                "progress": {"completed_modules": [], "current_score": 0},
                "notes": [],
                "quiz_history": [],
                "updated_at": datetime.now().isoformat(),
            }
            
            insert_response = self.user_data_collection.insert(doc).execute()
            if insert_response.data:
                return insert_response.data[0]
            return doc
        except Exception as e:
            log.warning("user_data_create_error", error=str(e))
            # Fallback fetch in case of race condition
            response = self.user_data_collection.select("*").eq("user_id", user_id).execute()
            if response.data:
                return response.data[0]
            return {"user_id": user_id, "progress": {}, "notes": [], "quiz_history": []}

    # --- Quiz History ---

    async def add_quiz_attempt(self, user_id: str, attempt: dict):
        try:
            attempt["timestamp"] = datetime.now().isoformat()

            doc = await self._get_or_create_user(user_id)
            history = doc.get("quiz_history", []) or []
            history.append(attempt)

            avg = sum(a.get("score", 0) for a in history) / len(history) if history else 0
            
            progress = doc.get("progress", {}) or {}
            progress["current_score"] = round(avg, 2)

            self.user_data_collection.update({
                "quiz_history": history,
                "progress": progress,
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", user_id).execute()
            
        except Exception as e:
            log.error("quiz_attempt_update_failed", error=str(e))

    async def get_recent_quiz_stats(self, user_id: str, limit: int = 5) -> Dict:
        try:
            response = self.user_data_collection.select("quiz_history").eq("user_id", user_id).execute()
            
            if not response.data or not response.data[0].get("quiz_history"):
                return {"attempt_count": 0, "recent_average": 0, "weak_topics": [], "recent_history": []}
                
            history = response.data[0]["quiz_history"]
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
        except Exception as e:
            log.error("get_recent_quiz_stats_failed", error=str(e))
            return {"attempt_count": 0, "recent_average": 0, "weak_topics": [], "error": str(e)}

    # --- Notes ---

    async def add_note(self, user_id: str, content: str):
        try:
            doc = await self._get_or_create_user(user_id)
            notes = doc.get("notes", []) or []
            note = {"content": content, "timestamp": datetime.now().isoformat()}
            notes.append(note)
            
            self.user_data_collection.update({
                "notes": notes,
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", user_id).execute()
        except Exception as e:
            log.error("add_note_failed", error=str(e))

    async def get_notes(self, user_id: str) -> List[Dict]:
        try:
            response = self.user_data_collection.select("notes").eq("user_id", user_id).execute()
            if response.data and response.data[0].get("notes"):
                return response.data[0]["notes"]
            return []
        except Exception as e:
            log.error("get_notes_failed", error=str(e))
            return []

    # --- Progress ---

    async def update_progress_metric(self, user_id: str, metric: str, value: any):
        try:
            doc = await self._get_or_create_user(user_id)
            progress = doc.get("progress", {}) or {}
            progress[metric] = value
            
            self.user_data_collection.update({
                "progress": progress,
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", user_id).execute()
        except Exception as e:
            log.error("update_progress_failed", error=str(e))

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
