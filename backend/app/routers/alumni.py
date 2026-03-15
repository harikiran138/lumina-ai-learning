from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .auth import get_current_user
from app.store.alumni_store import AlumniStore
from app.dependencies import get_alumni_store

router = APIRouter()

class MentorshipStatusRequest(BaseModel):
    is_available: bool

@router.get("/portfolio")
async def get_alumni_portfolio(
    current_user: dict = Depends(get_current_user),
    store: AlumniStore = Depends(get_alumni_store)
):
    if current_user.get("role") != "alumni":
        raise HTTPException(status_code=403, detail="Forbidden")
    portfolio = await store.get_portfolio(current_user["id"])
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio

@router.post("/mentorship/status")
async def update_mentorship_status(
    request: MentorshipStatusRequest,
    current_user: dict = Depends(get_current_user),
    store: AlumniStore = Depends(get_alumni_store)
):
    if current_user.get("role") != "alumni":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    success = await store.update_mentorship_status(current_user["id"], request.is_available)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update mentorship status")
    return {"status": "success", "is_available": request.is_available}
