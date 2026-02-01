from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.store.user_data_store import UserDataStore
from app.dependencies import get_user_data_store
from .auth import get_current_user

router = APIRouter()


class QuizResultRequest(BaseModel):
    # user_id: str  <-- REMOVED (Security Fix)
    topic: str
    score: float
    total_questions: int
    correct_count: int
    difficulty: str
    details: Optional[Dict[str, Any]] = None


class NoteRequest(BaseModel):
    # user_id: str  <-- REMOVED (Security Fix)
    content: str


@router.post("/quiz-result")
async def save_quiz_result(
    request: QuizResultRequest,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Save the result of a quiz attempt for the CURRENT user.
    """
    # Use ID from token, not request body
    store.add_quiz_attempt(current_user["id"], request.dict())
    return {"status": "success", "message": "Quiz result saved"}


@router.post("/note")
async def save_note(
    request: NoteRequest,
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Save a student note for the CURRENT user.
    """
    store.add_note(current_user["id"], request.content)
    return {"status": "success", "message": "Note saved"}


@router.get("/profile")  # Changed from /profile/{user_id}
async def get_profile(
    current_user: dict = Depends(get_current_user),
    store: UserDataStore = Depends(get_user_data_store),
):
    """
    Get the full profile for the CURRENT user.
    """
    stats = store.get_recent_quiz_stats(current_user["id"])
    notes = store.get_notes(current_user["id"])
    return {
        "stats": stats,
        "notes": notes,
        "user_info": {"name": current_user["full_name"], "email": current_user["email"]},
    }
