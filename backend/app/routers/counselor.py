from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.store.counselor_store import CounselorStore
from app.database.models import (
    RevealRequest, 
    EncryptedNoteCreate, 
    RiskAlertAnonymized,
    CounselorNote,
    FollowUpTask
)

router = APIRouter(tags=["counselor"])

# Injected store dependency for future unit testing
def get_counselor_store():
    return CounselorStore()

@router.get("/risk-alerts", response_model=List[RiskAlertAnonymized])
async def get_risk_alerts(
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """Fetch anonymized risk signals for immediate intervention."""
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")
    
    alerts = await store.get_risk_alerts()
    # Masking sensitive info by default
    return alerts

@router.post("/risk-alerts/{alert_id}/reveal")
async def reveal_student_identity(
    alert_id: str,
    request: RevealRequest,
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """Deanonymize student risk signal with mandatory audit reason."""
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")
    
    # Audit log reason must be provided
    if not request.reason.strip():
        raise HTTPException(status_code=400, detail="Reason is required for deanonymization")
    
    student_identity = await store.reveal_student_identity(current_user["id"], alert_id, request.reason)
    if not student_identity:
        raise HTTPException(status_code=404, detail="Risk alert not found or reveal failed")
    
    return {"status": "revealed", "identity": student_identity}

@router.post("/notes", response_model=Dict[str, Any])
async def add_counseling_note(
    request: EncryptedNoteCreate,
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """Store client-side encrypted notes (AES-256-GCM). Plaintext never touches the server."""
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")
    
    note_data = {
        "encrypted_blob": request.encrypted_blob,
        "iv": request.iv,
        "auth_tag": request.auth_tag
    }
    
    note = await store.add_encrypted_note(current_user["id"], request.student_id, note_data)
    if not note:
        raise HTTPException(status_code=500, detail="Failed to save encrypted note")
    
    return {"status": "success", "note_id": note.get("id")}

@router.get("/notes/{student_id}", response_model=List[CounselorNote])
async def get_counseling_notes(
    student_id: str,
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """Fetch encrypted history for a student."""
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")
    
    return await store.get_encrypted_notes(current_user["id"], student_id)

@router.post("/risk-alerts/{alert_id}/suppress")
async def suppress_risk_alert(
    alert_id: str,
    expiry_hours: int = 24,
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """Temporarily suppress alert after initial intervention."""
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")
    
    success = await store.suppress_alert(alert_id, expiry_hours)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to suppress alert")
    
    return {"status": "suppressed", "expiry_hours": expiry_hours}

@router.patch("/follow-up/{task_id}")
async def update_follow_up_task(
    task_id: str,
    update_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """Update follow-up task status (e.g., set to 'acknowledged' or 'completed')."""
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")
    
    task = await store.manage_follow_up(task_id, update_data)
    if not task:
        raise HTTPException(status_code=404, detail="Follow-up task not found")
    
    return {"status": "success", "task": task}
