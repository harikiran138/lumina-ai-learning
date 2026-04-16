from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.store.peer_tutor_store import PeerTutorStore
from app.dependencies import get_peer_tutor_store

async def get_current_peer_tutor_local(request: Request):
    from app.api.deps import get_current_peer_tutor
    # Handle the fact that get_current_peer_tutor might expect some arguments if called directly
    # but usually Depends works by passing the func itself.
    # However, if we want to use it as a dependency, we can just point to it.
    return await get_current_peer_tutor(request)


router = APIRouter()

@router.get("/sessions")
async def get_tutor_sessions(
    current_user: dict = Depends(get_current_peer_tutor_local),
    store: PeerTutorStore = Depends(get_peer_tutor_store)
):
    return await store.get_sessions(current_user["id"])

@router.get("/training")
async def get_training_progress(
    current_user: dict = Depends(get_current_peer_tutor_local),
    store: PeerTutorStore = Depends(get_peer_tutor_store)
):
    return await store.get_training_progress(current_user["id"])

@router.get("/eligibility")
async def get_eligible_tutors(
    current_user: dict = Depends(get_current_peer_tutor_local),
    store: PeerTutorStore = Depends(get_peer_tutor_store)
):
    # This might be for students looking for tutors or admins
    return await store.get_eligible_tutors()
