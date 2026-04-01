from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from .auth import get_current_user
from app.services.flashcard_service import get_flashcard_service

router = APIRouter(prefix="/api/flashcards", tags=["Flashcards"])

@router.get("/deck/{course_id}")
async def get_flashcard_deck(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Fetch flashcards due for review for the current student in a specific course."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can access flashcards")
    
    service = get_flashcard_service()
    return await service.get_student_deck(current_user["id"], course_id)

@router.post("/review")
async def record_review(
    flashcard_id: str,
    rating: int = Query(..., ge=1, le=4, description="1=Again, 2=Hard, 3=Good, 4=Easy"),
    current_user: dict = Depends(get_current_user)
):
    """Record a review for a flashcard and update its spaced repetition schedule."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can review flashcards")
    
    service = get_flashcard_service()
    return await service.review_card(current_user["id"], flashcard_id, rating)

@router.post("/generate")
async def generate_flashcards(
    course_id: str,
    topic: str,
    content: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate new flashcards from course content using AI."""
    if current_user.get("role") not in ("teacher", "faculty", "admin"):
         raise HTTPException(status_code=403, detail="Only faculty can generate flashcards")
    
    institution_id = current_user.get("institution_id")
    if not institution_id:
        raise HTTPException(status_code=400, detail="Institution context required")
        
    service = get_flashcard_service()
    return await service.generate_flashcards(course_id, institution_id, topic, content)
