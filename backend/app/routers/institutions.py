from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime
import structlog

from app.api.deps import get_current_college_admin
from app.store.institution_store import InstitutionStore
from app.database.scoped_db import get_scoped_db
from app.core.audit import audit_logger

router = APIRouter()
log = structlog.get_logger(__name__)

def is_admin(current_user: dict = Depends(get_current_college_admin)):
    if not current_user.get("two_factor_enabled"):
        log.warning("admin_access_without_2fa", user_id=current_user.get("id"))
    return current_user

@router.get("/")
async def get_institutions(admin: dict = Depends(is_admin)):
    """List institutions (limited to primary in single-tenant mode)."""
    db = get_scoped_db(admin)
    store = InstitutionStore(db=db)
    primary = await store.get_primary_institution()
    return [primary] if primary else []

@router.post("/")
async def create_institution(data: dict, admin: dict = Depends(is_admin)):
    """Create a new institution (restricted to one in single-tenant mode)."""
    store = InstitutionStore()
    existing = await store.list_institutions()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Platform is configured for single institution only."
        )
    return await store.create_institution(data)

@router.patch("/{inst_id}/status")
async def update_institution_status(inst_id: str, data: dict, admin: dict = Depends(is_admin)):
    """Explicitly update the onboarding status of an institution."""
    status = data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="status field is required")
    
    db = get_scoped_db(admin)
    success = await InstitutionStore(db=db).update_institution_status(inst_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Institution not found or update failed")
    
    audit_logger.log(
        action="institution_status_updated",
        user_id=str(admin.get("id")),
        metadata={"institution_id": inst_id, "new_status": status}
    )
    return {"success": True, "new_status": status}

@router.get("/{inst_id}/programs")
async def list_programs(inst_id: str, admin: dict = Depends(is_admin)):
    """List all programs for an institution."""
    db = get_scoped_db(admin)
    return await InstitutionStore(db=db).list_programs(inst_id)

@router.post("/{inst_id}/programs")
async def create_program(inst_id: str, data: dict, admin: dict = Depends(is_admin)):
    """Create a new program under an institution."""
    data["institution_id"] = inst_id
    db = get_scoped_db(admin)
    return await InstitutionStore(db=db).create_program(data)
