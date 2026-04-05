from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.api.deps import get_current_user
from app.database.supabase_manager import supabase_db
from app.services.wellbeing import log_checkin, send_wellbeing_alert, assess_distress_signals

router = APIRouter(tags=["wellbeing"])


class CheckinRequest(BaseModel):
    student_id: str
    mood: str           # "great" | "okay" | "struggling"
    notes: Optional[str] = None


class AlertRequest(BaseModel):
    student_id: str
    signals: List[str]
    severity: str       # "low" | "medium" | "high" | "critical"


@router.post("/checkin")
async def student_checkin(
    body: CheckinRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Log a student mood check-in.  If distress signals are detected an internal alert
    may be raised, but we NEVER expose that information to the student — only return
    { status: 'logged' }.
    """
    valid_moods = {"great", "okay", "struggling"}
    if body.mood not in valid_moods:
        raise HTTPException(
            status_code=400,
            detail=f"mood must be one of: {sorted(valid_moods)}",
        )

    try:
        client = supabase_db.get_client()
        await log_checkin(
            client,
            student_id=body.student_id,
            mood=body.mood,
            notes=body.notes,
        )
        # Always return the same response regardless of alert outcome
        return {"status": "logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log check-in: {str(e)}")


@router.post("/alert")
async def trigger_wellbeing_alert(
    body: AlertRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Internal endpoint — teacher or admin only.
    Sends a wellbeing alert for a student with specified signals and severity.
    """
    if current_user.get("role") not in {"teacher", "admin", "counselor"}:
        raise HTTPException(status_code=403, detail="Forbidden: teacher or admin role required")

    try:
        client = supabase_db.get_client()
        result = await send_wellbeing_alert(
            client,
            student_id=body.student_id,
            signals=body.signals,
            severity=body.severity,
            triggered_by=current_user.get("id"),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send wellbeing alert: {str(e)}")
