from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.api.deps import get_current_counselor as get_current_user
from app.store.counselor_store import CounselorStore
from app.dependencies import get_counselor_store

router = APIRouter()

class NoteRequest(BaseModel):
    student_id: str
    encrypted_content: str

class RevealRequest(BaseModel):
    student_id: str
    reason: str

@router.get("/students")
async def get_assigned_students(
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    return await store.get_assigned_students(current_user["id"])

@router.get("/crisis")
async def get_crisis_cases(
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    return await store.get_crisis_cases()

@router.post("/notes")
async def add_counseling_note(
    request: NoteRequest,
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    
    # Note: Encryption happens client-side as per spec, we just store the payload
    note = await store.add_note(current_user["id"], request.student_id, request.encrypted_content)
    if not note:
        raise HTTPException(status_code=500, detail="Failed to save note")
    return {"status": "success", "note": note}

@router.post("/reveal")
async def reveal_student_identity(
    request: RevealRequest,
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    
    # Log the reveal as per safeguarding requirement
    await store.log_reveal(current_user["id"], request.student_id, request.reason)
    
    # In a real system, this would call an RPC to get the real identity
    return {"status": "success", "message": "Identity reveal logged and granted"}
