import json
import os
import time
from typing import Dict, List, Optional
from datetime import datetime

DATA_FILE = "data/user_data.json"

class UserDataStore:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(UserDataStore, cls).__new__(cls)
            cls._instance.data = {}
            cls._instance.load_data()
        return cls._instance

    def load_data(self):
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r') as f:
                    self.data = json.load(f)
            except Exception as e:
                print(f"Error loading user data: {e}")
                self.data = {}
        else:
            self.data = {}

    def save_data(self):
        try:
            os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
            with open(DATA_FILE, 'w') as f:
                json.dump(self.data, f, indent=4)
        except Exception as e:
            print(f"Error saving user data: {e}")

    def _get_user_entry(self, user_id: str) -> dict:
        if user_id not in self.data:
            self.data[user_id] = {
                "progress": {"completed_modules": [], "current_score": 0},
                "notes": [],
                "quiz_history": []
            }
        return self.data[user_id]

    # --- Quiz History ---

    def add_quiz_attempt(self, user_id: str, attempt: dict):
        user = self._get_user_entry(user_id)
        attempt["timestamp"] = datetime.now().isoformat()
        user["quiz_history"].append(attempt)
        # Update current average score
        history = user["quiz_history"]
        if history:
            avg = sum(a.get("score", 0) for a in history) / len(history)
            user["progress"]["current_score"] = round(avg, 2)
        self.save_data()

    def get_recent_quiz_stats(self, user_id: str, limit: int = 5) -> Dict:
        user = self._get_user_entry(user_id)
        history = user["quiz_history"][-limit:]
        if not history:
            return {"attempt_count": 0, "recent_average": 0, "weak_topics": []}
            
        avg = sum(a.get("score", 0) for a in history) / len(history)
        # Simple weak topic analysis (score < 50)
        weak_topics = []
        for h in history:
            if h.get("score", 0) < 50 and h.get("topic"):
                weak_topics.append(h.get("topic"))
        
        return {
            "attempt_count": len(user["quiz_history"]),
            "recent_average": round(avg, 2),
            "weak_topics": list(set(weak_topics)),
            "recent_history": history
        }

    # --- Notes ---

    def add_note(self, user_id: str, content: str):
        user = self._get_user_entry(user_id)
        user["notes"].append({
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        self.save_data()

    def get_notes(self, user_id: str) -> List[Dict]:
        user = self._get_user_entry(user_id)
        return user["notes"]

    # --- Progress ---

    def update_progress_metric(self, user_id: str, metric: str, value: any):
        user = self._get_user_entry(user_id)
        user["progress"][metric] = value
        self.save_data()

    def get_full_profile_string(self, user_id: str) -> str:
        """Returns a string summary for AI Context injection"""
        user = self._get_user_entry(user_id)
        stats = self.get_recent_quiz_stats(user_id)
        notes_count = len(user["notes"])
        
        return (
            f"User Profile ({user_id}):\n"
            f"- Average Quiz Score: {stats['recent_average']}%\n"
            f"- Total Quizzes Taken: {stats['attempt_count']}\n"
            f"- Weak Topics: {', '.join(stats['weak_topics']) if stats['weak_topics'] else 'None detected'}\n"
            f"- Notes Saved: {notes_count}\n"
        )
