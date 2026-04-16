from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime
import structlog

from app.api.deps import get_current_college_admin
from app.store.institution_store import InstitutionStore
from app.store.user_store import UserStore
from app.database.scoped_db import get_scoped_db

router = APIRouter()
log = structlog.get_logger(__name__)

def is_admin(current_user: dict = Depends(get_current_college_admin)):
    if not current_user.get("two_factor_enabled"):
        log.warning("admin_access_without_2fa", user_id=current_user.get("id"))
    return current_user

@router.get("/{inst_id}")
async def get_departments(inst_id: str, admin: dict = Depends(is_admin)):
    """List all departments for an institution."""
    db = get_scoped_db(admin)
    return await InstitutionStore(db=db).list_departments(inst_id)

@router.post("/{inst_id}")
async def create_department(inst_id: str, data: dict, admin: dict = Depends(is_admin)):
    """Create a new department."""
    data["institution_id"] = inst_id
    db = get_scoped_db(admin)
    return await InstitutionStore(db=db).create_department(data)

@router.patch("/{inst_id}/{department_id}")
async def update_department(
    inst_id: str,
    department_id: str,
    data: dict,
    admin: dict = Depends(is_admin),
):
    """Update department metadata."""
    allowed = {"department_name", "description", "code", "teacher_limit", "class_limit", "course_limit", "metadata"}
    payload = {k: v for k, v in data.items() if k in allowed}
    if not payload:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    payload["updated_at"] = datetime.utcnow().isoformat()
    db = get_scoped_db(admin)
    result = await db.update("departments", payload, {"id": department_id, "institution_id": inst_id})
    if not result:
        raise HTTPException(status_code=404, detail="Department not found")
    return result[0]

@router.patch("/{inst_id}/{department_id}/hod")
async def assign_hod(
    inst_id: str,
    department_id: str,
    data: dict,
    admin: dict = Depends(is_admin),
):
    """Assign or update HOD for a department."""
    hod_id = data.get("hod_id")
    if not hod_id:
        raise HTTPException(status_code=400, detail="Missing hod_id")

    db = get_scoped_db(admin)
    user_store = UserStore(db=db)
    hod_user = await user_store.get_user_by_id(hod_id)
    if not hod_user:
        raise HTTPException(status_code=404, detail="HOD user not found")

    await user_store.update_user_role(hod_id, "hod")
    await user_store.update_user_fields(hod_id, {"department_id": department_id})

    res = await db.update(
        "departments",
        {"hod_id": hod_id, "updated_at": datetime.utcnow().isoformat()},
        {"id": department_id, "institution_id": inst_id},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"status": "success", "department_id": department_id, "hod_id": hod_id}
