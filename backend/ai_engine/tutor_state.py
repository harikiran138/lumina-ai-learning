import hashlib
import json
import os
import time
from typing import Dict, Set, List, Optional

STATE_FILE = "data/tutor_state.json"

class TutorSessionState:
    def __init__(self, session_id: str, data: dict = None):
        self.session_id = session_id
        if data:
            self.asked_hashes: Set[str] = set(data.get("asked_hashes", []))
            self.asked_questions_preview: List[str] = data.get("asked_questions_preview", [])
            self.last_activity: float = data.get("last_activity", time.time())
            self.topic_coverage: Dict[str, int] = data.get("topic_coverage", {})
        else:
            self.asked_hashes: Set[str] = set()
            self.asked_questions_preview: List[str] = [] 
            self.last_activity: float = time.time()
            self.topic_coverage: Dict[str, int] = {}
            
    def to_dict(self):
        return {
            "asked_hashes": list(self.asked_hashes),
            "asked_questions_preview": self.asked_questions_preview,
            "last_activity": self.last_activity,
            "topic_coverage": self.topic_coverage
        }

class TutorStateManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TutorStateManager, cls).__new__(cls)
            cls._instance.sessions = {} # type: Dict[str, TutorSessionState]
            cls._instance.load_state()
        return cls._instance

    def load_state(self):
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, 'r') as f:
                    data = json.load(f)
                    for sid, sdata in data.items():
                        self.sessions[sid] = TutorSessionState(sid, sdata)
            except Exception as e:
                print(f"Error loading tutor state: {e}")

    def save_state(self):
        try:
            os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
            data = {sid: session.to_dict() for sid, session in self.sessions.items()}
            with open(STATE_FILE, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            print(f"Error saving tutor state: {e}")

    def get_session(self, session_id: str) -> TutorSessionState:
        if session_id not in self.sessions:
            self.sessions[session_id] = TutorSessionState(session_id)
        self.sessions[session_id].last_activity = time.time()
        return self.sessions[session_id]

    def _compute_hash(self, text: str) -> str:
        # Normalize: lower case and remove whitespace
        normalized = "".join(text.lower().split())
        return hashlib.sha256(normalized.encode()).hexdigest()

    def add_question(self, session_id: str, question_text: str):
        session = self.get_session(session_id)
        q_hash = self._compute_hash(question_text)
        session.asked_hashes.add(q_hash)
        
        # Store a preview for context (e.g., "What is a Variable?")
        # Keep list short (last 20 for better history)
        preview = question_text[:50] + "..." if len(question_text) > 50 else question_text
        # Avoid duplicate previews visually
        if preview not in session.asked_questions_preview:
            session.asked_questions_preview.append(preview)
            
        if len(session.asked_questions_preview) > 20:
            session.asked_questions_preview.pop(0)
            
        self.save_state() # Persist on update

    def is_duplicate(self, session_id: str, question_text: str) -> bool:
        session = self.get_session(session_id)
        q_hash = self._compute_hash(question_text)
        return q_hash in session.asked_hashes

    def get_avoid_context(self, session_id: str) -> str:
        session = self.get_session(session_id)
        if not session.asked_questions_preview:
            return ""
        
        # Return a prompt-friendly string
        return "\n".join([f"- {q}" for q in session.asked_questions_preview])

# Singleton accessor
def get_tutor_state() -> TutorStateManager:
    return TutorStateManager()
