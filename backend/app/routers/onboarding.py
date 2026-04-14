from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import structlog

from app.api.deps import get_current_user
from app.services.onboarding_service import OnboardingService
from app.database.scoped_db import get_scoped_db

router = APIRouter()
log = structlog.get_logger(__name__)

class OnboardingCompleteRequest(BaseModel):
    role: str
    payload: Dict[str, Any]

class EnrollmentCodeRequest(BaseModel):
    batch_id: str
    section: Optional[str] = None
    expires_hours: Optional[int] = 72

@router.get("/status")
async def get_onboarding_status(
    current_user: dict = Depends(get_current_user)
):
    """Check the current onboarding status for the user."""
    db = get_scoped_db(current_user)
    try:
        res = await db.fetch_one("user_data", {"user_id": str(current_user["id"])})
        return {"onboarded": (res or {}).get("onboarded", False), "progress": (res or {}).get("progress", {})}
    except Exception as e:
        log.error("get_onboarding_status_failed", error=str(e))
        return {"onboarded": False}

@router.post("/enrollment-codes")
async def create_enrollment_code(
    req: EnrollmentCodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Admin/HOD only: Generate a 6-digit enrollment code for a batch."""
    from uuid import uuid4
    from datetime import datetime, timedelta
    
    db = get_scoped_db(current_user)
    code = uuid4().hex[:6].upper()
    expires_at = (datetime.utcnow() + timedelta(hours=req.expires_hours)).isoformat()
    
    data = {
        "code": code,
        "batch_id": req.batch_id,
        "section": req.section,
        "expires_at": expires_at,
        "created_by": str(current_user["id"]),
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        res = db.table("enrollment_codes").insert(data).execute()
        return {"code": code, "expires_at": expires_at}
    except Exception as e:
        log.error("create_enrollment_code_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create enrollment code")

@router.post("/complete")
async def finalize_onboarding(
    request: OnboardingCompleteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Finalize the onboarding process for any role."""
    db = get_scoped_db(current_user)
    onboarding_service = OnboardingService(db=db)
    
    result = await onboarding_service.complete_onboarding(
        user_id=str(current_user["id"]),
        role=request.role,
        current_user=current_user,
        payload=request.payload
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to finalize onboarding")
    
    return {"success": True}
