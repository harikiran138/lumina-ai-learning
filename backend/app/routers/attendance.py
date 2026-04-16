from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime
import structlog

from app.api.deps import (
    get_current_teacher as get_current_user,
    get_current_counselor,
    get_current_attendance_reviewer
)
from app.database.models import AttendanceOverrideCreate, AttendanceOverrideUpdate
from app.services.notification import NotificationService, PRIORITY_HIGH
from app.dependencies import get_attendance_store
from app.store.attendance_store import AttendanceStore

router = APIRouter()
log = structlog.get_logger(__name__)

@router.post("/mark")
async def mark_attendance(
    records: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user),
    attendance_store: AttendanceStore = Depends(get_attendance_store)
):
    """Mark attendance for a batch/section."""
    if not records:
        raise HTTPException(status_code=400, detail="No attendance records provided")
    
    first = records[0]
    course_id = first.get("course_id")
    batch_id = first.get("batch_id")
    section = first.get("section")
    class_date = first.get("class_date", datetime.utcnow().strftime("%Y-%m-%d"))

    if not all([course_id, batch_id, section]):
        raise HTTPException(status_code=400, detail="Missing required session fields")

    session_data = {
        "course_id": course_id,
        "teacher_id": str(current_user["id"]),
        "batch_id": batch_id,
        "section": section,
        "class_date": class_date
    }
    
    session = await attendance_store.upsert_session(session_data)
    
    if not session:
        raise HTTPException(status_code=500, detail="Failed to create/update attendance session")
    
    session_id = session["id"]
    normalized_records = [{
        "session_id": session_id,
        "student_id": r.get("student_id"),
        "is_present": bool(r.get("is_present", False)),
        "created_at": datetime.utcnow().isoformat(),
    } for r in records]

    success = await attendance_store.bulk_upsert_records(normalized_records)
    
    return {"status": "success", "session_id": session_id, "record_count": len(normalized_records)}


# --- Counselor Override Review Loop ---

@router.post("/override/request")
async def request_attendance_override(
    payload: AttendanceOverrideCreate,
    current_user: dict = Depends(get_current_counselor),
    attendance_store: AttendanceStore = Depends(get_attendance_store),
    notif_svc: NotificationService = Depends(lambda: NotificationService())
):
    """Counselor submits a request to change attendance."""
    institution_id = current_user.get("institution_id")
    if not institution_id:
        raise HTTPException(status_code=400, detail="User not associated with an institution")

    # 1. Create the request
    request_data = {
        "institution_id": institution_id,
        "counselor_id": current_user["id"],
        "student_id": payload.student_id,
        "original_status": payload.original_status,
        "requested_status": payload.requested_status,
        "reason": payload.reason,
        "status": "PENDING"
    }
    
    request = await attendance_store.create_override_request(request_data)
    if not request:
        raise HTTPException(status_code=500, detail="Failed to create override request")

    # 2. Find and Notify HOD
    # For simplicity, we find the HOD of the student's department or the institution admin
    from app.database.supabase_manager import supabase_db
    try:
        # Find HOD for this institution (ideally filtered by department)
        hods = await supabase_db.table("users").select("id").eq("institution_id", institution_id).eq("role", "hod").async_execute()
        if hods.data:
            for hod in hods.data:
                notif_svc.send(
                    user_id=hod["id"],
                    title="Attendance Override Request",
                    body=f"Counselor {current_user.get('full_name')} requested an override for Student {payload.student_id}.",
                    notification_type="attendance_override",
                    priority=PRIORITY_HIGH,
                    metadata={"request_id": request["id"]}
                )
    except Exception as e:
        log.warning("failed_to_notify_hod", error=str(e))

    return {"status": "request_pending", "request_id": request["id"]}


@router.get("/override/pending")
async def list_pending_overrides(
    current_user: dict = Depends(get_current_attendance_reviewer),
    attendance_store: AttendanceStore = Depends(get_attendance_store)
):
    """HOD/Admin lists all pending override requests."""
    institution_id = current_user.get("institution_id")
    return await attendance_store.list_pending_overrides(institution_id)


@router.patch("/override/{request_id}/review")
async def review_attendance_override(
    request_id: str,
    payload: AttendanceOverrideUpdate,
    current_user: dict = Depends(get_current_attendance_reviewer),
    attendance_store: AttendanceStore = Depends(get_attendance_store),
    notif_svc: NotificationService = Depends(lambda: NotificationService())
):
    """HOD/Admin approves or rejects an override request."""
    request = await attendance_store.get_override_request(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Override request not found")

    if request["status"] != "PENDING":
        raise HTTPException(status_code=400, detail="Request is already processed")

    status = payload.status.upper()
    if status not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Invalid status. Must be APPROVED or REJECTED")

    # 1. Update request status
    update_data = {
        "status": status,
        "hod_id": current_user["id"]
    }
    
    success = await attendance_store.update_override_request(request_id, update_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update override request")

    # 2. If approved, apply change to main table
    if status == "APPROVED":
        applied = await attendance_store.apply_attendance_override(
            request["student_id"], 
            request["requested_status"]
        )
        if not applied:
            log.error("failed_to_apply_attendance_override", request_id=request_id)

    # 3. Notify Counselor
    notif_svc.send(
        user_id=request["counselor_id"],
        title=f"Attendance Override {status}",
        body=f"Your request for student {request['student_id']} was {status.lower()}.",
        notification_type="attendance_override_result",
        priority=PRIORITY_HIGH
    )

    return {"status": status}

