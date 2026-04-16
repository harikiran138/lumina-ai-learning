from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime
import structlog

from app.api.deps import get_current_college_admin
from app.database.scoped_db import get_scoped_db, ScopedSupabase
from app.dependencies import get_institution_store
from app.store.institution_store import InstitutionStore
from app.core.audit import audit_logger

router = APIRouter()
log = structlog.get_logger(__name__)

def is_admin(current_user: dict = Depends(get_current_college_admin)):
    if not current_user.get("two_factor_enabled"):
        log.warning("admin_access_without_2fa", user_id=current_user.get("id"))
    return current_user

@router.get("/")
async def get_institutions(admin: dict = Depends(is_admin), store: InstitutionStore = Depends(get_institution_store)):
    """List institutions (limited to primary in single-tenant mode)."""
    primary = await store.get_primary_institution()
    return [primary] if primary else []

@router.post("/")
async def create_institution(data: dict, admin: dict = Depends(is_admin), store: InstitutionStore = Depends(get_institution_store)):
    """Create a new institution (restricted to one in single-tenant mode)."""
    existing = await store.list_institutions()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Platform is configured for single institution only."
        )
    return await store.create_institution(data)

@router.patch("/{inst_id}/status")
async def update_institution_status(inst_id: str, data: dict, admin: dict = Depends(is_admin), store: InstitutionStore = Depends(get_institution_store)):
    """Explicitly update the onboarding status of an institution."""
    status = data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="status field is required")
    
    success = await store.update_institution_status(inst_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Institution not found or update failed")
    
    audit_logger.log(
        action="institution_status_updated",
        user_id=str(admin.get("id")),
        metadata={"institution_id": inst_id, "new_status": status}
    )
    return {"success": True, "new_status": status}

@router.get("/{inst_id}/programs")
async def list_programs(inst_id: str, admin: dict = Depends(is_admin), store: InstitutionStore = Depends(get_institution_store)):
    """List all programs for an institution."""
    return await store.list_programs(inst_id)

@router.post("/{inst_id}/programs")
async def create_program(inst_id: str, data: dict, admin: dict = Depends(is_admin), store: InstitutionStore = Depends(get_institution_store)):
    """Create a new program under an institution."""
    data["institution_id"] = inst_id
    return await store.create_program(data)


@router.get("/{inst_id}/departments")
async def list_departments(inst_id: str, admin: dict = Depends(is_admin), store: InstitutionStore = Depends(get_institution_store)):
    """List all departments for an institution."""
    return await store.list_departments(inst_id)


@router.post("/{inst_id}/departments")
async def create_department(inst_id: str, data: dict, admin: dict = Depends(is_admin), store: InstitutionStore = Depends(get_institution_store)):
    """Create a new department under an institution."""
    data["institution_id"] = inst_id
    return await store.create_department(data)

