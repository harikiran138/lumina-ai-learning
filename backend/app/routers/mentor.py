from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.api.deps import get_current_mentor as get_current_user
from app.store.mentor_store import MentorStore
from app.dependencies import get_mentor_store

router = APIRouter()

class SessionRequest(BaseModel):
    mentee_id: str
    session_date: str
    notes: Optional[Dict[str, Any]] = None
    next_steps: Optional[str] = None

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
    if not any(str(m["student_id"]) == mentee_id for m in matches):
        raise HTTPException(status_code=403, detail="You can only view profiles of your mentees")
    
    profile = await store.get_mentee_profile(mentee_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Mentee profile not found")
    return profile

@router.get("/mentees/{mentee_id}/briefing")
async def get_mentee_briefing(
    mentee_id: str,
    current_user: dict = Depends(get_current_user),
    store: MentorStore = Depends(get_mentor_store)
):
    # Verify match
    matches = await store.get_matches(current_user["id"])
    if not any(str(m["student_id"]) == mentee_id for m in matches):
        raise HTTPException(status_code=403, detail="Unauthorized briefing request")
    
    return await store.get_session_briefing(current_user["id"], mentee_id)

@router.post("/session/schedule")
async def schedule_mentor_session(
    request: SessionRequest,
    current_user: dict = Depends(get_current_user),
    store: MentorStore = Depends(get_mentor_store)
):
    session = await store.schedule_session(
        current_user["id"], 
        request.mentee_id, 
        request.session_date, 
        request.notes,
        request.next_steps
    )
    if not session:
        raise HTTPException(status_code=500, detail="Failed to schedule session")
    return {"status": "success", "session": session}

@router.get("/sessions")
async def get_mentor_sessions(
    current_user: dict = Depends(get_current_user),
    store: MentorStore = Depends(get_mentor_store)
):
    return await store.get_sessions(current_user["id"])
