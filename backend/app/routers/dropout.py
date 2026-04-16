from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks

from app.api.deps import get_current_active_user
from app.database.scoped_db import ScopedSupabase, get_scoped_db
from app.services.risk_service import RiskAnalysisService

router = APIRouter()

_ALLOWED_ROLES = {"teacher", "hod", "college_admin", "admin", "super_admin", "counselor", "supervisor", "auditor"}

def _require_risk_access(current_user: Dict[str, Any]) -> None:
    role = str(current_user.get("role") or "").lower()
    if role not in _ALLOWED_ROLES:
        raise HTTPException(status_code=403, detail="Risk analytics access requires faculty, counselor, or admin privileges")

@router.get("/students/{student_id}")
async def get_latest_dropout_signal(
    student_id: str,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: ScopedSupabase = Depends(get_scoped_db),
):
    _require_risk_access(current_user)
    service = RiskAnalysisService(db=db)
    risk = await service.get_student_risk(student_id)
    return {
        "student_id": student_id,
        "analysis_type": "weighted_signals_v1",
        "explainability_type": "human_readable_reasons",
        "risk": risk,
    }

@router.post("/students/{student_id}/analyze")
async def run_dropout_analysis(
    student_id: str,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: ScopedSupabase = Depends(get_scoped_db),
):
    _require_risk_access(current_user)
    institution_id = current_user.get("institution_id") or current_user.get("institution_id")
    if not institution_id and str(current_user.get("role") or "").lower() != "super_admin":
        raise HTTPException(status_code=400, detail="Unable to resolve institution for risk analysis")

    service = RiskAnalysisService(db=db)
    
    # Run heavy analysis in background
    background_tasks.add_task(service.run_risk_analysis, student_id, institution_id or "global")
    
    return {
        "student_id": student_id,
        "message": "Dropout risk analysis has been queued.",
        "analysis_type": "weighted_signals_v1",
        "status": "processing"
    }
