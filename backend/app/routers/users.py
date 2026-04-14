from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional, List
from datetime import datetime
import structlog

from app.routers.auth import get_current_user
from app.api.deps import get_current_college_admin
from app.store.user_store import UserStore
from app.store.analytics_store import AnalyticsStore
from app.database.scoped_db import get_scoped_db
from app.core.audit import audit_logger
from app.core.rbac import normalize_role, Role

router = APIRouter()
log = structlog.get_logger(__name__)

def _normalize_admin_role(role: Optional[str]) -> str:
    return normalize_role(role)

def is_admin(current_user: dict = Depends(get_current_college_admin)):
    if not current_user.get("two_factor_enabled"):
        log.warning("admin_access_without_2fa", user_id=current_user.get("id"))
    return current_user

@router.get("/")
async def get_all_users(admin: dict = Depends(is_admin)):
    """List all users in the system."""
    db = get_scoped_db(admin)
    user_store = UserStore(db=db)
    return await user_store.list_all_users()

@router.post("/")
async def create_user(data: dict, admin: dict = Depends(is_admin)):
    """Create a user without replacing the admin session."""
    role = _normalize_admin_role(data.get("role"))
    valid_roles = {r.value for r in Role}
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(sorted(valid_roles))}")

    actor_role = _normalize_admin_role(admin.get("role"))
    if role == "super_admin" and actor_role != "super_admin":
        raise HTTPException(status_code=403, detail="Only a super admin can create another super admin")

    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    full_name = (data.get("name") or data.get("full_name") or "").strip()
    phone = (data.get("phone") or "").strip()

    if not email or not password or not full_name:
        raise HTTPException(status_code=400, detail="name, email, and password are required")

    db = get_scoped_db(admin)
    user_store = UserStore(db=db)
    try:
        user = await user_store.create_user(email, password, full_name, role, phone)
        if data.get("department_id"):
            await user_store.update_user_fields(user["id"], {"department_id": data["department_id"]})
        audit_logger.log(
            action="admin_user_created",
            user_id=str(admin.get("id")),
            resource_id=str(user.get("id")),
            metadata={"role": role, "email": email},
        )
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(is_admin)):
    """Delete a user from the system."""
    db = get_scoped_db(admin)
    user_store = UserStore(db=db)
    target_user = await user_store.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    actor_role = _normalize_admin_role(admin.get("role"))
    target_role = _normalize_admin_role(target_user.get("role"))
    if str(admin.get("id")) == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")
    if target_role == "super_admin":
        raise HTTPException(status_code=403, detail="Super admin accounts cannot be deleted from the dashboard")
    if target_role == "college_admin" and actor_role != "super_admin":
        raise HTTPException(status_code=403, detail="Only a super admin can delete a college admin account")

    success = await user_store.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    audit_logger.log(
        action="admin_user_deleted",
        user_id=str(admin.get("id")),
        resource_id=user_id,
        metadata={"deleted_role": target_role, "deleted_email": target_user.get("email")},
    )
    return {"success": True}

@router.post("/{user_id}/status")
async def update_user_status(user_id: str, status: str, admin: dict = Depends(is_admin)):
    """Update a user's active status."""
    normalized_status = (status or "").strip().lower()
    if normalized_status not in {"active", "inactive", "suspended"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    db = get_scoped_db(admin)
    user_store = UserStore(db=db)
    target_user = await user_store.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    success = await user_store.update_user_status(user_id, normalized_status)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    audit_logger.log(
        action="admin_user_status_updated",
        user_id=str(admin.get("id")),
        resource_id=user_id,
        metadata={"status": normalized_status, "target_email": target_user.get("email")},
    )
    return {"success": True}

@router.get("/teachers")
async def get_all_teachers(admin: dict = Depends(is_admin)):
    """List teacher and HOD performance statistics."""
    db = get_scoped_db(admin)
    analytics = AnalyticsStore(db=db)
    institution_id = admin.get("resolved_institution_id")
    return await analytics.get_all_teacher_stats(institution_id)

@router.get("/students")
async def get_all_students(admin: dict = Depends(is_admin)):
    """List student progress and risk signals."""
    db = get_scoped_db(admin)
    analytics = AnalyticsStore(db=db)
    return await analytics.get_admin_student_progress_snapshot()
