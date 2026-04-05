from fastapi import APIRouter, Depends, HTTPException, Query, status
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
from app.database.supabase_manager import supabase_db
from datetime import datetime, timezone
import uuid

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


# ---------------------------------------------------------------------------
# New endpoints
# ---------------------------------------------------------------------------

@router.get("/students/at-risk")
async def get_at_risk_students(
    severity: Optional[str] = Query(default=None, description="Filter by risk level: low|medium|high|critical"),
    limit: int = Query(default=50, le=100),
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """
    Returns anonymized at-risk student list with risk scores.
    Names are NOT included by default - counselor must use /reveal endpoint.
    """
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")

    try:
        client = supabase_db.get_client()
        query = client.table("student_risk_scores").select("*")
        if severity:
            query = query.eq("risk_level", severity)
        # Order by detected_at desc so latest record per student floats to top
        query = query.order("detected_at", desc=True).limit(limit)
        res = await query.async_execute()
        rows = res.data or []

        # Deduplicate: keep the latest record per student_id
        seen: set = set()
        deduped = []
        for row in rows:
            sid = row.get("student_id", "")
            if sid not in seen:
                seen.add(sid)
                deduped.append(row)

        result = []
        for row in deduped:
            student_id = row.get("student_id", "")
            result.append({
                "id": row.get("id"),
                "anonymized_id": f"Student-{student_id[-4:]}",
                "risk_score": row.get("risk_score"),
                "risk_level": row.get("risk_level"),
                "reasons": row.get("reasons", []),
                "detected_at": row.get("detected_at"),
            })

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch at-risk students: {str(e)}")


# --- Pydantic models for new endpoints ---

class CreateInterventionRequest(BaseModel):
    student_id: str
    intervention_type: str  # counseling_session | support_resources | faculty_notification | message | referral
    notes: Optional[str] = None
    outcome: Optional[str] = None  # improved | same | worse | None
    due_at: Optional[str] = None   # ISO timestamp for scheduled follow-up


class SafeguardingEventRequest(BaseModel):
    student_id: Optional[str] = None
    event_type: str  # concern_raised | referral_made | case_closed | identity_reveal | escalation
    reason: str
    severity: str = "medium"


@router.post("/interventions")
async def create_intervention(
    request: CreateInterventionRequest,
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """Create a new intervention record."""
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")

    now = datetime.now(timezone.utc).isoformat()
    record_id = str(uuid.uuid4())

    payload = {
        "id": record_id,
        "counselor_id": current_user["id"],
        "student_id": request.student_id,
        "intervention_type": request.intervention_type,
        "notes": request.notes,
        "outcome": request.outcome,
        "due_at": request.due_at,
        "status": "scheduled",
        "created_at": now,
        "updated_at": now,
    }

    try:
        client = supabase_db.get_client()
        # Upsert so re-submissions don't create duplicates
        res = await client.table("counselor_interventions").upsert(payload, on_conflict="id").async_execute()
        created = res.data[0] if res.data else payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create intervention: {str(e)}")

    # If due_at is provided, also schedule a follow-up task
    if request.due_at:
        try:
            follow_up_payload = {
                "id": str(uuid.uuid4()),
                "student_id": request.student_id,
                "counselor_id": current_user["id"],
                "status": "pending",
                "due_at": request.due_at,
                "created_at": now,
                "updated_at": now,
            }
            await client.table("follow_up_tasks").insert(follow_up_payload).async_execute()
        except Exception as fe:
            # Non-fatal: log but don't fail the whole request
            import logging
            logging.getLogger(__name__).warning("follow_up_task_creation_failed: %s", str(fe))

    return {"status": "created", "intervention": created}


@router.get("/follow-up")
async def get_follow_up_tasks(
    status: Optional[str] = Query(default=None, description="Filter by task status"),
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """List follow-up tasks for this counselor, ordered by due_at ASC (most urgent first)."""
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")

    try:
        client = supabase_db.get_client()
        query = (
            client.table("follow_up_tasks")
            .select("*")
            .eq("counselor_id", current_user["id"])
        )
        if status:
            query = query.eq("status", status)
        query = query.order("due_at", desc=False)
        res = await query.async_execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch follow-up tasks: {str(e)}")


@router.post("/safeguarding/log")
async def log_safeguarding_event(
    request: SafeguardingEventRequest,
    current_user: dict = Depends(get_current_user),
    store: CounselorStore = Depends(get_counselor_store)
):
    """Log a safeguarding event (audit trail for formal reports)."""
    if current_user.get("role") not in ["counselor", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Counselor role required")

    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "id": str(uuid.uuid4()),
        "counselor_id": current_user["id"],
        "student_id": request.student_id,
        "event_type": request.event_type,
        "reason": request.reason,
        "severity": request.severity,
        "revealed_at": now,  # reuse existing column; acts as event timestamp
    }

    try:
        client = supabase_db.get_client()
        res = await client.table("risk_reveal_logs").insert(payload).async_execute()
        created = res.data[0] if res.data else payload
        return {"status": "logged", "id": created.get("id")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log safeguarding event: {str(e)}")
