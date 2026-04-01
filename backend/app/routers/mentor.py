from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.api.deps import get_current_mentor as get_current_user
from app.store.mentor_store import MentorStore
from app.dependencies import get_mentor_store

router = APIRouter()

class SessionRequest(BaseModel):
    mentee_id: str
    scheduled_at: str
    notes: Optional[str] = None

class PortfolioReviewRequest(BaseModel):
    mentee_id: str
    portfolio_data: Dict[str, Any]
    feedback: str

@router.get("/matches")
async def get_mentor_matches(
    current_user: dict = Depends(get_current_user),
    store: MentorStore = Depends(get_mentor_store)
):
    return await store.get_matches(current_user["id"])

@router.get("/mentees/{mentee_id}/profile")
async def get_mentee_profile(
    mentee_id: str,
    current_user: dict = Depends(get_current_user),
    store: MentorStore = Depends(get_mentor_store)
):
    
    # Verify match
    matches = await store.get_matches(current_user["id"])
    if not any(str(m["mentee_id"]) == mentee_id for m in matches):
        raise HTTPException(status_code=403, detail="You can only view profiles of your mentees")
    
    profile = await store.get_mentee_profile(mentee_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Mentee profile not found")
    return profile

@router.post("/session/schedule")
async def schedule_mentor_session(
    request: SessionRequest,
    current_user: dict = Depends(get_current_user),
    store: MentorStore = Depends(get_mentor_store)
):
    
    session = await store.schedule_session(current_user["id"], request.mentee_id, request.scheduled_at, request.notes or "")
    if not session:
        raise HTTPException(status_code=500, detail="Failed to schedule session")
    return {"status": "success", "session": session}

@router.post("/portfolio-review")
async def create_portfolio_review(
    request: PortfolioReviewRequest,
    current_user: dict = Depends(get_current_user),
    store: MentorStore = Depends(get_mentor_store)
):
    
    review = await store.create_portfolio_review(current_user["id"], request.mentee_id, request.portfolio_data, request.feedback)
    if not review:
        raise HTTPException(status_code=500, detail="Failed to create portfolio review")
    return {"status": "success", "review": review}

@router.get("/sessions")
async def get_mentor_sessions(
    current_user: dict = Depends(get_current_user),
    store: MentorStore = Depends(get_mentor_store)
):
    return await store.get_sessions(current_user["id"])
