from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from store.user_data_store import UserDataStore

router = APIRouter()
store = UserDataStore()

class QuizResultRequest(BaseModel):
    user_id: str
    topic: str
    score: float
    total_questions: int
    correct_count: int
    difficulty: str
    details: Optional[Dict[str, Any]] = None

class NoteRequest(BaseModel):
    user_id: str
    content: str

@router.post("/quiz-result")
async def save_quiz_result(request: QuizResultRequest):
    """
    Save the result of a quiz attempt.
    """
    store.add_quiz_attempt(request.user_id, request.dict())
    return {"status": "success", "message": "Quiz result saved"}

@router.post("/note")
async def save_note(request: NoteRequest):
    """
    Save a student note.
    """
    store.add_note(request.user_id, request.content)
    return {"status": "success", "message": "Note saved"}

@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    """
    Get the full profile for a user.
    """
    stats = store.get_recent_quiz_stats(user_id)
    notes = store.get_notes(user_id)
    return {
        "stats": stats,
        "notes": notes
    }
