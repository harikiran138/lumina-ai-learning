from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class UserDataStore:
    """
    Supabase store for User Data (Progress, Notes, Quiz History).
    Operates on the 'user_data' table with JSONB fields.
    """

    def __init__(self):
        self.db = supabase_db

    async def _get_or_create_user_data(self, user_id: str) -> dict:
        """Retrieves user data or creates it if it doesn't exist."""
        try:
            data = await self.db.fetch_one("user_data", {"user_id": user_id})
            if data:
                return data
                
            doc = {
                "user_id": user_id,
                "progress": {"completed_modules": [], "current_score": 0},
                "notes": [],
                "quiz_history": [],
                "updated_at": datetime.utcnow().isoformat(),
            }
            
            result = await self.db.upsert("user_data", doc)
            return result or doc
        except Exception as e:
            log.warning("user_data_get_create_error", error=str(e), user_id=user_id)
            return {"user_id": user_id, "progress": {}, "notes": [], "quiz_history": []}

    # --- Quiz History ---

    async def add_quiz_attempt(self, user_id: str, attempt: dict):
        try:
            attempt["timestamp"] = datetime.utcnow().isoformat()
            doc = await self._get_or_create_user_data(user_id)
            
            history = doc.get("quiz_history", []) or []
            history.append(attempt)

            avg = sum(a.get("score", 0) for a in history) / len(history) if history else 0
            progress = doc.get("progress", {}) or {}
            progress["current_score"] = round(avg, 2)

            client = self.db.get_client()
            client.table("user_data").update({
                "quiz_history": history,
                "progress": progress,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
                
        except Exception as e:
            log.error("quiz_attempt_update_failed", error=str(e), user_id=user_id)

    async def get_recent_quiz_stats(self, user_id: str, limit: int = 5) -> Dict:
        try:
            client = self.db.get_client()
            response = client.table("user_data").select("quiz_history").eq("user_id", user_id).execute()
            
            if not response.data or not response.data[0].get("quiz_history"):
                return {"attempt_count": 0, "recent_average": 0, "weak_topics": [], "recent_history": []}
                
            history = response.data[0]["quiz_history"]
            recent = history[-limit:]
            avg = sum(a.get("score", 0) for a in recent) / len(recent) if recent else 0

            weak_topics = {h.get("topic") for h in history if h.get("score", 0) < 60 and h.get("topic")}

            return {
                "attempt_count": len(history),
                "recent_average": round(avg, 2),
                "weak_topics": list(weak_topics),
                "recent_history": recent,
            }
        except Exception as e:
            log.error("get_recent_quiz_stats_failed", error=str(e), user_id=user_id)
            return {"attempt_count": 0, "recent_average": 0, "weak_topics": [], "error": str(e)}

    # --- Notes ---

    async def add_note(self, user_id: str, content: str, title: str = "Untitled Note", subject: str = "General"):
        try:
            doc = await self._get_or_create_user_data(user_id)
            notes = doc.get("notes", []) or []
            note = {
                "id": str(uuid.uuid4()),
                "title": title,
                "subject": subject,
                "content": content, 
                "timestamp": datetime.utcnow().isoformat()
            }
            notes.append(note)
            
            client = self.db.get_client()
            client.table("user_data").update({
                "notes": notes,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
            return note
        except Exception as e:
            log.error("add_note_failed", error=str(e), user_id=user_id)
            return None

    async def get_notes(self, user_id: str) -> List[Dict]:
        try:
            client = self.db.get_client()
            response = client.table("user_data").select("notes").eq("user_id", user_id).execute()
            if response.data and response.data[0].get("notes"):
                return response.data[0]["notes"]
            return []
        except Exception as e:
            log.error("get_notes_failed", error=str(e), user_id=user_id)
            return []

    async def update_note(self, user_id: str, note_id: str, content: str, title: str = None, subject: str = None):
        try:
            doc = await self._get_or_create_user_data(user_id)
            notes = doc.get("notes", []) or []
            found = False
            for n in notes:
                if n.get("id") == note_id:
                    n["content"] = content
                    if title is not None: n["title"] = title
                    if subject is not None: n["subject"] = subject
                    n["updated_at"] = datetime.utcnow().isoformat()
                    found = True
                    break
            if found:
                client = self.db.get_client()
                client.table("user_data").update({
                    "notes": notes,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("user_id", user_id).execute()
            return found
        except Exception as e:
            log.error("update_note_failed", error=str(e), user_id=user_id)
            return False

    async def delete_note(self, user_id: str, note_id: str):
        try:
            doc = await self._get_or_create_user_data(user_id)
            notes = doc.get("notes", []) or []
            original_len = len(notes)
            notes = [n for n in notes if n.get("id") != note_id]
            if len(notes) < original_len:
                client = self.db.get_client()
                client.table("user_data").update({
                    "notes": notes,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("user_id", user_id).execute()
                return True
            return False
        except Exception as e:
            log.error("delete_note_failed", error=str(e), user_id=user_id)
            return False

    # --- Progress ---

    async def update_progress_metric(self, user_id: str, metric: str, value: any):
        try:
            doc = await self._get_or_create_user_data(user_id)
            progress = doc.get("progress", {}) or {}
            progress[metric] = value
            
            client = self.db.get_client()
            client.table("user_data").update({
                "progress": progress,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
        except Exception as e:
            log.error("update_progress_failed", error=str(e), user_id=user_id)

    async def get_profile_settings(self, user_id: str) -> Dict:
        doc = await self._get_or_create_user_data(user_id)
        progress = doc.get("progress", {}) or {}
        settings = progress.get("profile_settings", {})
        return settings if isinstance(settings, dict) else {}

    async def update_profile_settings(self, user_id: str, updates: Dict) -> Dict:
        try:
            doc = await self._get_or_create_user_data(user_id)
            progress = doc.get("progress", {}) or {}
            settings = progress.get("profile_settings", {}) or {}
            settings.update(updates)
            progress["profile_settings"] = settings

            client = self.db.get_client()
            client.table("user_data").update({
                "progress": progress,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("user_id", user_id).execute()
            return settings
        except Exception as e:
            log.error("update_profile_settings_failed", error=str(e), user_id=user_id)
            return {}

    async def get_full_profile_string(self, user_id: str) -> str:
        """Returns a string summary for AI Context injection"""
        stats = await self.get_recent_quiz_stats(user_id)
        notes = await self.get_notes(user_id)
        weak_str = ", ".join(stats.get("weak_topics", [])) if stats.get("weak_topics") else "None detected"

        return (
            f"User Profile ({user_id}):\n"
            f"- Average Recent Score: {stats.get('recent_average', 0)}%\n"
            f"- Total Quizzes Taken: {stats.get('attempt_count', 0)}\n"
            f"- Weak Topics: {weak_str}\n"
            f"- Notes Saved: {len(notes)}\n"
        )
