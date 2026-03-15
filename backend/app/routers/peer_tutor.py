from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .auth import get_current_user
from app.store.peer_tutor_store import PeerTutorStore
from app.dependencies import get_peer_tutor_store

router = APIRouter()

@router.get("/sessions")
async def get_tutor_sessions(
    current_user: dict = Depends(get_current_user),
    store: PeerTutorStore = Depends(get_peer_tutor_store)
):
    if current_user.get("role") != "peer_tutor":
        raise HTTPException(status_code=403, detail="Forbidden")
    return await store.get_sessions(current_user["id"])

@router.get("/training")
async def get_training_progress(
    current_user: dict = Depends(get_current_user),
    store: PeerTutorStore = Depends(get_peer_tutor_store)
):
    if current_user.get("role") != "peer_tutor":
        raise HTTPException(status_code=403, detail="Forbidden")
    return await store.get_training_progress(current_user["id"])

@router.get("/eligibility")
async def get_eligible_tutors(
    current_user: dict = Depends(get_current_user),
    store: PeerTutorStore = Depends(get_peer_tutor_store)
):
    # This might be for students looking for tutors or admins
    return await store.get_eligible_tutors()
