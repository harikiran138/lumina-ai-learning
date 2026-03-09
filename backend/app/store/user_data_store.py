from typing import Dict, List, Optional
import uuid

from datetime import datetime
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from app.store.local_store import LocalJsonStore

log = structlog.get_logger()


class UserDataStore:
    """
    Supabase store for User Data (Progress, Notes, Quiz History).
    Assumes a user_data table with JSONB fields: progress, notes, quiz_history.
    """

    def __init__(self):
        try:
            self.client = supabase_db.get_client()
        except Exception as e:
            log.warning("user_data_store_unavailable", error=str(e))
            self.client = None
        self.local = LocalJsonStore()

    @property
    def user_data_collection(self):
        if not self.client:
            return None
        return self.client.table("user_data")

    async def _get_or_create_user(self, user_id: str) -> dict:
        if self.user_data_collection is None:
            payload = self.local.read()
            existing = next(
                (item for item in payload["user_data"] if item.get("user_id") == user_id),
                None,
            )
            if existing:
                return existing

            doc = {
                "user_id": user_id,
                "progress": {"completed_modules": [], "current_score": 0},
                "notes": [],
                "quiz_history": [],
                "updated_at": datetime.now().isoformat(),
            }
            payload["user_data"].append(doc)
            self.local.write(payload)
            return doc
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
        if self.user_data_collection is None:
            attempt["timestamp"] = datetime.now().isoformat()
            payload = self.local.read()
            doc = await self._get_or_create_user(user_id)
            history = doc.get("quiz_history", []) or []
            history.append(attempt)
            avg = sum(a.get("score", 0) for a in history) / len(history) if history else 0
            progress = doc.get("progress", {}) or {}
            progress["current_score"] = round(avg, 2)
            for item in payload["user_data"]:
                if item.get("user_id") == user_id:
                    item["quiz_history"] = history
                    item["progress"] = progress
                    item["updated_at"] = datetime.now().isoformat()
                    break
            self.local.write(payload)
            return
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
            
            # Also update the 'mastery' in the 'progress' table if applicable
            # We assume 'attempt' might have course_id or we find the relevant progress record
            course_id = attempt.get("course_id")
            if course_id:
                # Update specific course mastery
                try:
                    supabase_db.get_client().table("progress").update({
                        "mastery": round(avg, 2)
                    }).eq("userId", user_id).eq("courseId", course_id).execute()
                except Exception as progress_error:
                    log.warning("progress_mastery_update_skipped", error=str(progress_error))
            else:
                # Update overall mastery across all progress records if needed, 
                # but better to do it per topic/course.
                pass
                
        except Exception as e:
            log.error("quiz_attempt_update_failed", error=str(e))

    async def get_recent_quiz_stats(self, user_id: str, limit: int = 5) -> Dict:
        if self.user_data_collection is None:
            payload = self.local.read()
            doc = next(
                (item for item in payload["user_data"] if item.get("user_id") == user_id),
                None,
            )
            if not doc:
                return {"attempt_count": 0, "recent_average": 0, "weak_topics": [], "recent_history": []}

            history = doc.get("quiz_history", [])
            recent = history[-limit:]
            avg = sum(a.get("score", 0) for a in recent) / len(recent) if recent else 0
            weak_topics = {
                h.get("topic") for h in history if h.get("score", 0) < 60 and h.get("topic")
            }
            return {
                "attempt_count": len(history),
                "recent_average": round(avg, 2),
                "weak_topics": list(weak_topics),
                "recent_history": recent,
            }
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

    async def add_note(self, user_id: str, content: str, title: str = "Untitled Note", subject: str = "General"):
        if self.user_data_collection is None:
            payload = self.local.read()
            doc = next(
                (item for item in payload["user_data"] if item.get("user_id") == user_id),
                None,
            )
            if not doc:
                doc = {
                    "user_id": user_id,
                    "progress": {"completed_modules": [], "current_score": 0},
                    "notes": [],
                    "quiz_history": [],
                    "updated_at": datetime.now().isoformat(),
                }
                payload["user_data"].append(doc)
            
            notes = doc.get("notes", []) or []
            note = {
                "id": str(uuid.uuid4()),
                "title": title,
                "subject": subject,
                "content": content, 
                "timestamp": datetime.now().isoformat()
            }
            notes.append(note)
            doc["notes"] = notes
            doc["updated_at"] = datetime.now().isoformat()
            self.local.write(payload)
            return note
        try:
            doc = await self._get_or_create_user(user_id)
            notes = doc.get("notes", []) or []
            note = {
                "id": str(uuid.uuid4()),
                "title": title,
                "subject": subject,
                "content": content, 
                "timestamp": datetime.now().isoformat()
            }
            notes.append(note)
            
            self.user_data_collection.update({
                "notes": notes,
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", user_id).execute()
            return note
        except Exception as e:
            log.error("add_note_failed", error=str(e))
            return None

    async def get_notes(self, user_id: str) -> List[Dict]:
        if self.user_data_collection is None:
            payload = self.local.read()
            doc = next(
                (item for item in payload["user_data"] if item.get("user_id") == user_id),
                None,
            )
            notes = (doc or {}).get("notes", [])
            # Ensure all notes have IDs
            updated = False
            for n in notes:
                if "id" not in n:
                    n["id"] = str(uuid.uuid4())
                    updated = True
            if updated:
                self.local.write(payload)
            return notes
        try:
            response = self.user_data_collection.select("notes").eq("user_id", user_id).execute()
            if response.data and response.data[0].get("notes"):
                notes = response.data[0]["notes"]
                updated = False
                for n in notes:
                    if "id" not in n:
                        n["id"] = str(uuid.uuid4())
                        updated = True
                if updated:
                    self.user_data_collection.update({"notes": notes}).eq("user_id", user_id).execute()
                return notes
            return []
        except Exception as e:
            log.error("get_notes_failed", error=str(e))
            return []

    async def update_note(self, user_id: str, note_id: str, content: str, title: str = None, subject: str = None):
        if self.user_data_collection is None:
            payload = self.local.read()
            doc = next(
                (item for item in payload["user_data"] if item.get("user_id") == user_id),
                None,
            )
            if not doc: return False
            
            notes = doc.get("notes", []) or []
            found = False
            for n in notes:
                if n.get("id") == note_id:
                    n["content"] = content
                    if title is not None: n["title"] = title
                    if subject is not None: n["subject"] = subject
                    n["updated_at"] = datetime.now().isoformat()
                    found = True
                    break
            if found:
                doc["notes"] = notes
                doc["updated_at"] = datetime.now().isoformat()
                self.local.write(payload)
            return found
        try:
            doc = await self._get_or_create_user(user_id)
            notes = doc.get("notes", []) or []
            found = False
            for n in notes:
                if n.get("id") == note_id:
                    n["content"] = content
                    if title is not None: n["title"] = title
                    if subject is not None: n["subject"] = subject
                    n["updated_at"] = datetime.now().isoformat()
                    found = True
                    break
            if found:
                self.user_data_collection.update({
                    "notes": notes,
                    "updated_at": datetime.now().isoformat()
                }).eq("user_id", user_id).execute()
            return found
        except Exception as e:
            log.error("update_note_failed", error=str(e))
            return False

    async def delete_note(self, user_id: str, note_id: str):
        if self.user_data_collection is None:
            payload = self.local.read()
            doc = next(
                (item for item in payload["user_data"] if item.get("user_id") == user_id),
                None,
            )
            if not doc: return False
            
            notes = doc.get("notes", []) or []
            original_len = len(notes)
            notes = [n for n in notes if n.get("id") != note_id]
            if len(notes) < original_len:
                doc["notes"] = notes
                doc["updated_at"] = datetime.now().isoformat()
                self.local.write(payload)
                return True
            return False
        try:
            doc = await self._get_or_create_user(user_id)
            notes = doc.get("notes", []) or []
            original_len = len(notes)
            notes = [n for n in notes if n.get("id") != note_id]
            if len(notes) < original_len:
                self.user_data_collection.update({
                    "notes": notes,
                    "updated_at": datetime.now().isoformat()
                }).eq("user_id", user_id).execute()
                return True
            return False
        except Exception as e:
            log.error("delete_note_failed", error=str(e))
            return False

    # --- Progress ---

    async def update_progress_metric(self, user_id: str, metric: str, value: any):
        if self.user_data_collection is None:
            payload = self.local.read()
            doc = await self._get_or_create_user(user_id)
            progress = doc.get("progress", {}) or {}
            progress[metric] = value
            for item in payload["user_data"]:
                if item.get("user_id") == user_id:
                    item["progress"] = progress
                    item["updated_at"] = datetime.now().isoformat()
                    break
            self.local.write(payload)
            return
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

    async def get_profile_settings(self, user_id: str) -> Dict:
        doc = await self._get_or_create_user(user_id)
        progress = doc.get("progress", {}) or {}
        settings = progress.get("profile_settings", {})
        return settings if isinstance(settings, dict) else {}

    async def update_profile_settings(self, user_id: str, updates: Dict) -> Dict:
        if self.user_data_collection is None:
            payload = self.local.read()
            doc = await self._get_or_create_user(user_id)
            progress = doc.get("progress", {}) or {}
            settings = progress.get("profile_settings", {}) or {}
            settings.update(updates)
            progress["profile_settings"] = settings

            for item in payload["user_data"]:
                if item.get("user_id") == user_id:
                    item["progress"] = progress
                    item["updated_at"] = datetime.now().isoformat()
                    break

            self.local.write(payload)
            return settings

        try:
            doc = await self._get_or_create_user(user_id)
            progress = doc.get("progress", {}) or {}
            settings = progress.get("profile_settings", {}) or {}
            settings.update(updates)
            progress["profile_settings"] = settings

            self.user_data_collection.update(
                {
                    "progress": progress,
                    "updated_at": datetime.now().isoformat(),
                }
            ).eq("user_id", user_id).execute()
            return settings
        except Exception as e:
            log.error("update_profile_settings_failed", error=str(e))
            return {}

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
