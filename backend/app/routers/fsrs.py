from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.database.supabase_manager import supabase_db
from app.services.fsrs_engine import get_due_cards, update_card

router = APIRouter(tags=["fsrs"])


class ReviewRequest(BaseModel):
    card_id: str
    grade: int       # 1-4
    response_time_ms: int = 0


def _check_student_access(current_user: dict, student_id: str):
    if current_user.get("role") != "admin" and current_user.get("id") != student_id:
        raise HTTPException(status_code=403, detail="Forbidden: access denied")


@router.get("/student/{student_id}/due-cards")
async def get_student_due_cards(
    student_id: str,
    limit: int = Query(default=5, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    """Return flashcards due for spaced-repetition review."""
    _check_student_access(current_user, student_id)
    try:
        client = supabase_db.get_client()
        cards = await get_due_cards(client, student_id, limit=limit)
        return {"cards": cards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch due cards: {str(e)}")


@router.post("/student/{student_id}/review")
async def submit_card_review(
    student_id: str,
    body: ReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """Submit a review grade (1-4) for a flashcard and update FSRS scheduling."""
    _check_student_access(current_user, student_id)
    if body.grade < 1 or body.grade > 4:
        raise HTTPException(status_code=400, detail="grade must be between 1 and 4")
    try:
        client = supabase_db.get_client()
        updated_card = await update_card(
            client,
            student_id=student_id,
            card_id=body.card_id,
            grade=body.grade,
            response_time_ms=body.response_time_ms,
        )
        return updated_card
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process card review: {str(e)}")
