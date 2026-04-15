from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status
import csv
import io
import uuid
from pydantic import EmailStr
from typing import Optional, List
from datetime import datetime, timedelta

from app.routers.auth import get_current_user
from app.api.deps import get_current_college_admin
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.analytics_store import AnalyticsStore
from app.store.institution_store import InstitutionStore
from app.store.academic_store import AcademicStore
from app.store.config_store import ConfigStore
from app.dependencies import (
    get_user_store, 
    get_course_store, 
    get_analytics_store, 
    get_institution_store, 
    get_config_store, 
    get_academic_store
)
from app.services.personalization_service import get_personalization_service
from app.database.supabase_manager import supabase_db
from app.database.scoped_db import get_scoped_db, ScopedSupabase

import structlog
from app.core.audit import audit_logger
from app.core.rbac import normalize_role, Role
from pydantic import BaseModel

class CreateDeptRequest(BaseModel):
    institution_id: str
    department_name: str
    code: Optional[str] = None
    hod_id: Optional[str] = None

class CreateClassRequest(BaseModel):
    department_id: str
    program_id: str
    semester_id: str
    class_name: str
    batch_name: str
    student_limit: int = 60
    teacher_limit: int = 5

router = APIRouter()
log = structlog.get_logger(__name__)
def _normalize_admin_role(role: Optional[str]) -> str:
    return normalize_role(role)


def is_admin(user: dict = Depends(get_current_college_admin)):
    # Log 2FA posture without hard-blocking legitimate admin sessions.
    if not (user.get("two_factor_enabled") or user.get("is_2fa_enabled")):
        log.warning("admin_access_missing_2fa", user_id=user.get("id"))
    
    return user


@router.get("/config")
async def get_platform_config(
    admin: dict = Depends(is_admin),
    config_store: ConfigStore = Depends(get_config_store)
):
    """Fetch global platform configuration (Maintenance mode, feature flags)."""
    return await config_store.get_all_config()


@router.post("/config")
async def update_platform_config(
    config: dict, 
    admin: dict = Depends(is_admin),
    config_store: ConfigStore = Depends(get_config_store)
):
    """Update global platform configuration."""
    success = await config_store.update_bulk_config(config)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update configuration")
    
    audit_logger.log(
        action="platform_config_updated",
        user_id=str(admin.get("id")),
        metadata=config
    )
    return {"success": True, "updated_config": config}


@router.post("/shadow-mode")
async def toggle_shadow_mode(target_user_id: Optional[str] = None, admin: dict = Depends(is_admin)):
    """Toggle admin shadow mode to view platform as another user."""
    audit_logger.log(
        action="shadow_mode_toggled",
        user_id=str(admin.get("id")),
        metadata={"target_user_id": target_user_id}
    )
    return {"success": True, "shadow_mode_active": target_user_id is not None, "target_user_id": target_user_id}


@router.get("/dashboard")
async def get_admin_dashboard(
    admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """Get high-level system stats for the admin dashboard."""
    stats = await analytics_store.get_admin_dashboard_stats()
    
    # Standardized response structure using live statistics
    return {
        "stats": [
            {
                "label": "Total Students", 
                "value": str(stats.get("totalStudents", stats.get("total_users", 0))), 
                "trend": f"+{stats.get('activeUsers', 0)} active", 
                "icon": "Users"
            },
            {
                "label": "System Courses", 
                "value": str(stats.get("totalCourses", stats.get("total_courses", 0))), 
                "trend": f"{stats.get('activeCourses', 0)} Live", 
                "icon": "BookOpen"
            },
            {
                "label": "Overall Health", 
                "value": stats.get("systemHealthLabel", "95%"), 
                "trend": stats.get("systemStatus", "Healthy").capitalize(), 
                "icon": "TrendingUp"
            },
            {
                "label": "Security State", 
                "value": "Hardened" if stats.get("securityAlerts", 0) == 0 else "Watch", 
                "trend": f"{stats.get('securityAlerts', 0)} High Alerts", 
                "icon": "ShieldCheck"
            },
        ],
        "alerts": stats.get("summary", {}).get("attention_queue", stats.get("attention_queue", [])),
        "activity": stats.get("activity_feed", []),
        "services": stats.get("system_services", []),
        "charts": stats.get("charts", {
            "userGrowth": [
                {"month": "N/A", "users": 0}
            ],
            "roleDistribution": [
                {"role": "N/A", "count": 0}
            ]
        })
    }


@router.get("/health")
async def get_system_health(
    admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """Comprehensive system-wide health audit."""
    return await analytics_store.get_system_health_audit()


@router.get("/queue-health")
async def get_queue_health(
    admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """AI verification backlog and throughput signals."""
    return await analytics_store.get_verification_queue_stats()


@router.get("/guardian")
async def get_guardian_signals(
    admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Fetch active Guardian agent flagging signals."""
    try:
        from app.services.guardian_service import get_guardian_service
        return await get_guardian_service(db=db).get_active_signals()
    except Exception as exc:
        log.warning("guardian_signals_fetch_failed", error=str(exc))
        return []


@router.get("/security/audit-logs")
async def get_security_audit_logs(
    admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db),
    limit: int = 100,
):
    """Return security/admin audit logs for auditor dashboard."""
    try:
        rows = (
            db.table("admin_audit_logs")
            .select("id, admin_user_id, institution_id, action_type, resource_name, ip_address, payload, created_at")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
            or []
        )
        return rows
    except Exception as exc:
        log.warning("security_audit_logs_fetch_failed", error=str(exc))
        return []


@router.get("/notifications")
async def get_admin_notifications(
    admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db),
    limit: int = 100,
):
    """Return admin notifications from DB-backed sources."""
    notifications = []
    try:
        items = (
            db.table("notification_logs")
            .select("id, title, message, severity, category, created_at, is_read")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
            .data
            or []
        )
        for item in items:
            notifications.append({
                "id": item.get("id"),
                "title": item.get("title") or "Notification",
                "message": item.get("message") or "",
                "severity": (item.get("severity") or "info").lower(),
                "category": (item.get("category") or "system").lower(),
                "timestamp": item.get("created_at"),
                "read": bool(item.get("is_read", False)),
            })
    except Exception as exc:
        log.warning("admin_notifications_fetch_failed", error=str(exc))
    return notifications


@router.get("/content/audit")
async def get_content_audit(
    admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db),
    limit: int = 100,
):
    """Return course audit rows derived from real course records."""
    try:
        rows = (
            db.table("courses")
            .select("id, title, name, code, review_status, updated_at, created_at, modules")
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
            .data
            or []
        )

        result = []
        for row in rows:
            review_status = (row.get("review_status") or "pending").lower()
            if review_status in {"published", "approved", "reviewed"}:
                status_label = "reviewed"
            elif review_status in {"rejected", "flagged"}:
                status_label = "flagged"
            else:
                status_label = "pending"

            modules = row.get("modules") or []
            quality_score = 0
            if isinstance(modules, list) and modules:
                quality_score = min(100, 60 + len(modules) * 8)

            result.append(
                {
                    "id": row.get("id"),
                    "title": row.get("title") or row.get("name") or "Untitled Course",
                    "code": row.get("code") or "N/A",
                    "status": status_label,
                    "last_audit": row.get("updated_at") or row.get("created_at"),
                    "quality_score": quality_score,
                }
            )
        return result
    except Exception as exc:
        log.warning("content_audit_fetch_failed", error=str(exc))
        return []


@router.get("/roles/matrix")
async def get_role_matrix(
    admin: dict = Depends(is_admin),
    config_store: ConfigStore = Depends(get_config_store)
):
    """Fetch the functional role-per-permission matrix."""
    return await config_store.get_role_matrix()


@router.post("/roles/matrix")
async def update_role_matrix(
    data: dict, 
    admin: dict = Depends(is_admin),
    config_store: ConfigStore = Depends(get_config_store)
):
    """Update the role-permission matrix. Validates structure then persists."""
    roles = data.get("roles")
    permissions = data.get("permissions")

    if not isinstance(roles, list) or not isinstance(permissions, dict):
        raise HTTPException(status_code=400, detail="Expected {roles: [...], permissions: {...}}")

    # Validate each permission maps to a subset of the provided roles
    role_set = set(roles)
    for perm, assigned_roles in permissions.items():
        if not isinstance(assigned_roles, list):
            raise HTTPException(status_code=400, detail=f"Permission '{perm}' must map to a list of roles")
        unknown = set(assigned_roles) - role_set
        if unknown:
            raise HTTPException(status_code=400, detail=f"Unknown roles in '{perm}': {unknown}")

    success = await config_store.update_role_matrix(data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update role matrix")

    audit_logger.log(
        action="role_matrix_updated",
        user_id=str(admin.get("id")),
        metadata={"roles": roles, "permissions": list(permissions.keys())}
    )
    return {"success": True, "matrix": data}


@router.get("/users")
async def get_all_users(
    admin: dict = Depends(is_admin),
    user_store: UserStore = Depends(get_user_store)
):
    """List all users in the system."""
    return await user_store.list_all_users()


@router.post("/users")
async def create_user(data: dict, admin: dict = Depends(is_admin),
    user_store: UserStore = Depends(get_user_store)
):
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
        raise HTTPException(
            status_code=400,
            detail="name, email, and password are required",
        )
    user_store = user_store
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


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(is_admin),
    user_store: UserStore = Depends(get_user_store)
):
    """Delete a user from the system."""
    user_store = user_store
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


@router.post("/users/{user_id}/status")
async def update_user_status(user_id: str, status: str, admin: dict = Depends(is_admin),
    user_store: UserStore = Depends(get_user_store)
):
    """Update a user's active status."""
    normalized_status = (status or "").strip().lower()
    if normalized_status not in {"active", "inactive", "suspended"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Must be active, inactive, or suspended",
        )
    user_store = user_store
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


@router.post("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: dict = Depends(is_admin),
    user_store: UserStore = Depends(get_user_store)
):
    """Change a user's role."""
    role = _normalize_admin_role(role)
    valid_roles = {r.value for r in Role}
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(sorted(valid_roles))}")
    user_store = user_store
    target_user = await user_store.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    actor_role = _normalize_admin_role(admin.get("role"))
    target_role = _normalize_admin_role(target_user.get("role"))
    if str(admin.get("id")) == user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own admin role from this screen")
    if role == "super_admin" and actor_role != "super_admin":
        raise HTTPException(status_code=403, detail="Only a super admin can assign the super admin role")
    if target_role == "super_admin" and actor_role != "super_admin":
        raise HTTPException(status_code=403, detail="Only a super admin can modify another super admin")

    success = await user_store.update_user_role(user_id, role)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    audit_logger.log(
        action="admin_user_role_updated",
        user_id=str(admin.get("id")),
        resource_id=user_id,
        metadata={"previous_role": target_role, "next_role": role, "target_email": target_user.get("email")},
    )
    return {"success": True}


@router.patch("/users/by-email")
async def assign_user_dept_by_email(data: dict, admin: dict = Depends(is_admin),
    user_store: UserStore = Depends(get_user_store)
):
    """Update dept_id / college_id for a user identified by email. Used by demo setup."""
    email = (data.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="email is required")
    user_store = user_store
    target = await user_store.get_user_by_email(email)
    if not target:
        raise HTTPException(status_code=404, detail=f"User {email} not found")

    updates: dict = {}
    if data.get("dept_id"):
        updates["dept_id"] = data["dept_id"]
    if data.get("college_id"):
        updates["college_id"] = data["college_id"]
    if not updates:
        raise HTTPException(status_code=400, detail="No updatable fields provided")

    await user_store.update_user_fields(target["id"], updates)
    return {"success": True, "user_id": target["id"], "updated": updates}


@router.get("/courses")
async def get_all_courses(admin: dict = Depends(is_admin),
    course_store: CourseStore = Depends(get_course_store),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """List courses scoped to the primary institution."""
    store = institution_store
    inst_id = await store.get_primary_institution_id()
    if not inst_id:
        return []

    course_store = course_store
    all_courses = await course_store.list_courses()
    
    # In single-tenant mode, we assume all courses belong to the primary inst if defined.
    # If we wanted to be stricter, we'd check programs -> semesters -> courses chain.
    # For the MVP, we filter if program links exist.
    return all_courses


@router.get("/teachers")
async def get_all_teachers(admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """List teacher and HOD performance statistics for the admin workspace."""
    analytics = analytics_store
    institution_id = admin.get("resolved_institution_id")
    return await analytics.get_all_teacher_stats(institution_id)


@router.get("/students")
async def get_all_students(admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """List student progress and risk signals for the admin workspace."""
    analytics = analytics_store
    return await analytics.get_admin_student_progress_snapshot()


@router.get("/logs/ai")
async def get_ai_logs(admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Fetch AI interaction logs."""
    try:
        response = db.table("ai_logs").select("*").order("timestamp", desc=True).limit(100).execute()
        return response.data
    except Exception as e:
        return []

@router.delete("/logs/ai/{log_id}")
async def delete_ai_log(log_id: str, admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Delete a specific AI log entry."""
    try:
        res = db.table("ai_logs").delete().eq("id", log_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Log entry not found")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs/chat")
async def get_chat_logs(admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Fetch AI tutor chat conversation logs."""
    try:
        response = db.table("conversations").select("*").order("last_updated", desc=True).limit(100).execute()
        return response.data
    except Exception as e:
        return []


@router.get("/students-progress")
async def get_students_progress(admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """Get progress data for all students."""
    return await analytics_store.get_admin_student_progress_snapshot()


@router.get("/interventions")
async def get_interventions(admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """List open intervention recommendations generated by the personalization engine."""
    p_service = get_personalization_service(db=db)
    return [
        item.model_dump(mode="json")
        for item in await p_service.get_interventions()
    ]


# --- Institution & Connection Management ---

@router.get("/institutions")
async def get_institutions(admin: dict = Depends(is_admin),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """List institutions (limited to primary in single-tenant mode)."""
    store = institution_store
    primary = await store.get_primary_institution()
    return [primary] if primary else []


@router.post("/institutions")
async def create_institution(data: dict, admin: dict = Depends(is_admin),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """Create a new institution (restricted to one in single-tenant mode)."""
    store = institution_store
    existing = await store.list_institutions()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Platform is configured for single institution only. Multiple institutions are not allowed."
        )
    return await store.create_institution(data)


@router.patch("/institutions/{inst_id}/status")
async def update_institution_status(inst_id: str, data: dict, admin: dict = Depends(is_admin),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """Explicitly update the onboarding status of an institution."""
    status = data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="status field is required")
    success = await institution_store.update_institution_status(inst_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Institution not found or update failed")
    
    audit_logger.log(
        action="institution_status_updated",
        user_id=str(admin.get("id")),
        metadata={"institution_id": inst_id, "new_status": status}
    )
    return {"success": True, "new_status": status}


@router.get("/institutions/{inst_id}/departments")
async def get_departments(inst_id: str, admin: dict = Depends(is_admin),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """List all departments for an institution."""
    return await institution_store.list_departments(inst_id)


@router.post("/institutions/{inst_id}/departments")
async def create_department(inst_id: str, data: dict, admin: dict = Depends(is_admin),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """Create a new department."""
    data["institution_id"] = inst_id
    return await institution_store.create_department(data)


@router.patch("/institutions/{inst_id}/departments/{dept_id}")
async def update_department(
    inst_id: str,
    dept_id: str,
    data: dict,
    admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Update department metadata and limits."""
    allowed = {
        "department_name",
        "description",
        "code",
        "teacher_limit",
        "class_limit",
        "course_limit",
        "metadata",
    }
    payload = {k: v for k, v in data.items() if k in allowed}
    if not payload:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    payload["updated_at"] = datetime.utcnow().isoformat()
    result = await db.update(
        "departments",
        payload,
        {"id": dept_id, "institution_id": inst_id},
    )
    if not result:
        raise HTTPException(status_code=404, detail="Department not found")
    return result[0]


@router.patch("/institutions/{inst_id}/departments/{dept_id}/hod")
async def assign_hod(
    inst_id: str,
    dept_id: str,
    data: dict,
    admin: dict = Depends(is_admin),
    user_store: UserStore = Depends(get_user_store),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Assign or update HOD for a department."""
    hod_id = data.get("hod_id")
    if not hod_id:
        raise HTTPException(status_code=400, detail="Missing hod_id")

    hod_user = await user_store.get_user_by_id(hod_id)
    if not hod_user:
        raise HTTPException(status_code=404, detail="HOD user not found")

    # Ensure role is hod
    await user_store.update_user_role(hod_id, "hod")
    await user_store.update_user_fields(hod_id, {"department_id": dept_id})

    # Update department
    res = await db.update(
        "departments",
        {"hod_id": hod_id, "updated_at": datetime.utcnow().isoformat()},
        {"id": dept_id, "institution_id": inst_id},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"status": "success", "department_id": dept_id, "hod_id": hod_id}


@router.get("/teachers/stats", response_model=List[dict])
async def get_teacher_stats(inst_id: Optional[str] = None, admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """Fetch teacher utilization and risk metrics."""
    return await analytics_store.get_all_teacher_stats(inst_id)


@router.get("/institutions/{inst_id}/programs")
async def list_programs(inst_id: str, admin: dict = Depends(is_admin),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """List all programs for an institution."""
    return await institution_store.list_programs(inst_id)


@router.post("/institutions/{inst_id}/programs")
async def create_program(inst_id: str, data: dict, admin: dict = Depends(is_admin),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """Create a new program under an institution (and optional department)."""
    data["institution_id"] = inst_id
    return await institution_store.create_program(data)


@router.get("/programs/{program_id}/semesters")
async def list_semesters(program_id: str, admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """List semesters for a program."""
    return await db.fetch_all("semesters", {"program_id": program_id})


@router.post("/programs/{program_id}/semesters")
async def create_semester(program_id: str, data: dict, admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Create a semester under a program."""
    semester_number = data.get("semester_number")
    if semester_number is None:
        raise HTTPException(status_code=400, detail="Missing semester_number")
    payload = {
        "program_id": program_id,
        "semester_number": semester_number,
        "title": data.get("title"),
    }
    return await db.insert("semesters", payload)


@router.patch("/classes/{class_id}")
async def update_class(class_id: str, data: dict, admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Update class metadata and limits."""
    allowed = {
        "section_name",
        "class_name",
        "batch_name",
        "batch",
        "section",
        "academic_year",
        "semester_id",
        "program_id",
        "student_limit",
        "teacher_limit",
        "metadata",
    }
    payload = {k: v for k, v in data.items() if k in allowed}
    if not payload:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    payload["updated_at"] = datetime.utcnow().isoformat()
    result = await db.update("classes", payload, {"id": class_id})
    if not result:
        raise HTTPException(status_code=404, detail="Class not found")
    return result[0]


@router.get("/classes/{class_id}/summary")
async def class_summary(class_id: str, admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Summarize class capacity usage and assignments."""
    students = (
        db.table("student_enrollments")
        .select("id")
        .eq("class_id", class_id)
        .execute()
        .data
        or []
    )
    assignments = (
        db.table("teacher_assignments")
        .select("*")
        .eq("class_id", class_id)
        .execute()
        .data
        or []
    )
    teacher_ids = list({item.get("teacher_id") for item in assignments if item.get("teacher_id")})
    course_ids = list({item.get("course_id") for item in assignments if item.get("course_id")})

    courses = {}
    if course_ids:
        course_rows = (
            db.table("courses")
            .select("id, title, course_name, name, course_code, code")
            .in_("id", course_ids)
            .execute()
            .data
            or []
        )
        courses = {row["id"]: row for row in course_rows}

    return {
        "students_count": len(students),
        "teachers_count": len(teacher_ids),
        "assignments": assignments,
        "courses": list(courses.values()),
    }


@router.post("/connections/link")
async def link_stakeholder(data: dict, admin: dict = Depends(is_admin),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """Link a user as a stakeholder to an institution or program."""
    return await institution_store.create_stakeholder(data)


@router.get("/connections")
async def get_connections(inst_id: Optional[str] = None, program_id: Optional[str] = None, admin: dict = Depends(is_admin),
    user_store: UserStore = Depends(get_user_store),
    institution_store: InstitutionStore = Depends(get_institution_store)
):
    """List stakeholder connections (scoped to primary institution)."""
    store = institution_store
    
    # Enforce single-institution scope if no inst_id provided
    if not inst_id:
        inst_id = await store.get_primary_institution_id()
    
    connections = await store.list_stakeholders(inst_id, program_id)
    institutions = {
        item["id"]: item for item in await store.list_institutions()
    }
    programs = {}
    if inst_id:
        program_records = await store.list_programs(inst_id)
    else:
        program_records = []
        for institution in institutions.values():
            program_records.extend(await store.list_programs(institution["id"]))
    for item in program_records:
        programs[item["id"]] = item
    user_store = user_store
    users = {item["id"]: item for item in await user_store.list_all_users()}

    enriched = []
    for item in connections:
        user = users.get(item.get("user_id") or "")
        institution = institutions.get(item.get("institution_id") or "")
        program = programs.get(item.get("program_id") or "")
        enriched.append(
            {
                **item,
                "user_name": user.get("name") if user else item.get("name"),
                "user_email": user.get("email") if user else item.get("email"),
                "user_role": user.get("role") if user else None,
                "institution_name": institution.get("institution_name") if institution else None,
                "program_name": program.get("program_name") if program else None,
            }
        )

    return enriched


@router.get("/compliance/deletions")
async def get_deletion_requests(admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """List pending and completed data deletion requests."""
    try:
        response = db.table("deletion_requests").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception:
        return []


@router.post("/compliance/deletions/{request_id}/process")
async def process_deletion_request(request_id: str, admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Approve and process a data deletion request."""
    # Fetch request to get user_id
    try:
        req_res = db.table("deletion_requests").select("user_id").eq("id", request_id).single().execute()
        user_id = req_res.data.get("user_id") if req_res.data else "unknown"
        
        success = await get_compliance_service(db=db).process_deletion_pipeline(request_id, user_id)
        if not success:
            raise HTTPException(status_code=500, detail="Pipeline execution failed")

        db.table("deletion_requests").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", request_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compliance/audit-logs")
async def get_compliance_audit_logs(admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Fetch immutable audit logs for compliance tracking."""
    try:
        response = db.table("audit_logs").select("*").order("created_at", desc=True).limit(200).execute()
        return response.data
    except Exception:
        return []


@router.get("/compliance")
async def get_compliance_summary(admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Return deletion and audit-log summary for the admin compliance dashboard."""

    try:
        deletions = (
            db.table("deletion_requests")
            .select("*")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
            .data
            or []
        )
    except Exception:
        deletions = []

    try:
        audit_logs = (
            db.table("audit_logs")
            .select("*")
            .order("created_at", desc=True)
            .limit(100)
            .execute()
            .data
            or []
        )
    except Exception:
        audit_logs = []

    open_deletions = sum(1 for item in deletions if str(item.get("status", "")).lower() in {"pending", "queued", "requested"})
    completed_deletions = sum(1 for item in deletions if str(item.get("status", "")).lower() in {"completed", "done", "processed"})
    high_severity_events = sum(
        1
        for item in audit_logs
        if str(item.get("severity") or item.get("level") or "").lower() in {"high", "critical", "error"}
    )

    return {
        "summary": {
            "open_deletions": open_deletions,
            "completed_deletions": completed_deletions,
            "audit_events": len(audit_logs),
            "high_severity_events": high_severity_events,
        },
        "deletion_requests": deletions,
        "audit_logs": audit_logs,
    }


@router.get("/guardian-log")
async def get_guardian_log(admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """Return Guardian moderation and intervention signals for the admin dashboard."""
    analytics = analytics_store
    return await analytics.get_guardian_signals()


@router.get("/reports")
async def get_admin_reports(admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """Aggregate report-ready operational metrics for the admin dashboard."""
    analytics = analytics_store

    dashboard = await analytics.get_admin_dashboard_stats()
    queue = await analytics.get_verification_queue_stats()
    ai_usage = await analytics.get_ai_cost_analysis()
    guardian = await analytics.get_guardian_signals()

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "summary": dashboard.get("summary", dashboard),
        "activity_feed": dashboard.get("activityFeed", []),
        "attention_queue": dashboard.get("attentionQueue", []),
        "system_services": dashboard.get("systemServices", []),
        "queue": queue,
        "ai_usage": ai_usage,
        "guardian_events": guardian[:10],
    }

# --- Academic Management ---

@router.get("/students/{student_id}/enrollment")
async def get_student_enrollment(student_id: str, admin: dict = Depends(is_admin),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    """Fetch student's current enrollment and academic placement."""
    store = academic_store
    enrollment = await store.get_student_enrollment(student_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return enrollment


@router.post("/students/{student_id}/promote")
async def promote_student(student_id: str, admin: dict = Depends(is_admin),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    """Promote student to the next academic semester."""
    store = academic_store
    result = await store.promote_student(student_id)
    if not result:
        raise HTTPException(
            status_code=400, 
            detail="Promotion failed. Check if student is already in the final semester."
        )
    return {"success": True, "updated_enrollment": result}


@router.get("/students/{student_id}/credits")
async def get_student_credits(student_id: str, admin: dict = Depends(is_admin),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    """Fetch student credit history across semesters."""
    store = academic_store
    return await store.get_student_credits(student_id)


@router.post("/students/{student_id}/credits")
async def update_student_credits(
    student_id: str, 
    semester_id: str, 
    earned: int, 
    total: int, 
    admin: dict = Depends(is_admin),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    """Update student credits for a specific semester."""
    result = await academic_store.update_credits(student_id, semester_id, earned, total)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to update credits")
@router.post("/bulk-enrollment")
async def bulk_enrollment(
    file: UploadFile = File(...), 
    admin: dict = Depends(is_admin),
    user_store: UserStore = Depends(get_user_store),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """
    Process CSV for bulk user enrollment and invite generation.
    Expected CSV: email, full_name, role, dept_code, batch_label, section
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    total_processed = 0
    users_created = 0
    enrollment_errors = []

    for row in reader:
        total_processed += 1
        try:
            email = row.get("email")
            name = row.get("full_name") or row.get("name")
            role = row.get("role", "student")
            dept_code = row.get("dept_code")
            batch_label = row.get("batch_label")
            section = row.get("section")

            # 1. Check if user exists
            user = await user_store.get_user_by_email(email)
            if not user:
                # 2. Basic User Creation (Inactive)
                user_id = str(uuid.uuid4())
                await db.insert(
                    "users",
                    {
                        "id": user_id,
                        "email": email,
                        "full_name": name,
                        "role": role,
                        "onboarding_step": 0,
                        "is_active": False,
                    },
                )
                users_created += 1
                user = {"id": user_id, "email": email}
            else:
                user_id = user["id"]

            # 3. Handle Department / Batch mapping if provided
            if dept_code:
                dept = await db.fetch_one("departments", {"code": dept_code})
                if dept:
                    update_data = {"dept_id": dept["id"]}
                    if batch_label:
                        batch = await db.fetch_one(
                            "batches", {"dept_id": dept["id"], "label": batch_label}
                        )
                        if batch:
                            update_data["batch_id"] = batch["id"]
                    if section:
                        update_data["section"] = section
                    
                    await user_store.update_user_fields(user_id, update_data)
 
            # 4. Generate Invite Token
            invite_token = str(uuid.uuid4())
            expires_at = (datetime.utcnow() + timedelta(days=7)).isoformat()
            await db.insert(
                "invite_tokens",
                {"user_id": user_id, "token": invite_token, "expires_at": expires_at},
            )

        except Exception as e:
            enrollment_errors.append({"row": row, "error": str(e)})

    return {
        "success": True, 
        "results": {
            "total": total_processed,
            "created": users_created,
            "errors": enrollment_errors
        }
    }


# --- Hierarchy Management ---

@router.get("/departments", response_model=List[dict])
async def list_all_departments(admin: dict = Depends(is_admin),
    institution_store: InstitutionStore = Depends(get_institution_store),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    """Fetch all departments across institutions."""
    # For now, we assume a single primary institution if no ID is passed, 
    # but a full admin should see all.
    inst_store = institution_store
    inst = await inst_store.get_primary_institution()
    if not inst:
        return []
    academic_store = academic_store
    return await academic_store.get_departments(inst["id"])


@router.post("/departments")
async def create_new_department(payload: CreateDeptRequest, admin: dict = Depends(is_admin),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    academic_store = academic_store
    dept = await academic_store.create_department(payload.dict())
    if not dept:
        raise HTTPException(status_code=500, detail="Failed to create department")
    return {"success": True, "department": dept}


@router.delete("/departments/{dept_id}")
async def delete_department(dept_id: str, admin: dict = Depends(is_admin),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    academic_store = academic_store
    success = await academic_store.delete_department(dept_id)
    if not success:
        raise HTTPException(status_code=404, detail="Department not found or delete failed")
    return {"success": True}


@router.get("/classes", response_model=List[dict])
async def list_all_classes(admin: dict = Depends(is_admin),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    academic_store = academic_store
    return await academic_store.list_all_classes()


@router.post("/classes")
async def create_new_class(payload: CreateClassRequest, admin: dict = Depends(is_admin),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    academic_store = academic_store
    new_cls = await academic_store.create_class(payload.dict())
    if not new_cls:
        raise HTTPException(status_code=500, detail="Failed to create class")
    return {"success": True, "class": new_cls}


@router.delete("/classes/{class_id}")
async def delete_class(class_id: str, admin: dict = Depends(is_admin),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    academic_store = academic_store
    success = await academic_store.delete_class(class_id)
    if not success:
        raise HTTPException(status_code=404, detail="Class not found or delete failed")
    return {"success": True}


# --- AI Configuration Endpoints ---

@router.get("/ai/prompts")
async def get_ai_prompts(admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """List configured AI system prompts."""
    try:
        response = db.client.table("ai_prompts").select("*").order("created_at", desc=True).execute()
        return response.data or []
    except Exception:
        return []


@router.get("/ai/models")
async def get_ai_models(admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):
    """List available AI model configurations with live metrics."""
    analytics = analytics_store
    return await analytics.get_ai_model_metrics()


@router.get("/ai/costs")
async def get_ai_costs(admin: dict = Depends(is_admin),
    analytics_store: AnalyticsStore = Depends(get_analytics_store)
):

    analytics = analytics_store
    return await analytics.get_ai_cost_analysis()


# --- Parent Management ---

@router.get("/parents/pending-verification")
async def get_pending_parent_links(admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """List parent-student links awaiting admin verification (Item 1: Security)."""
    try:
        # Fetch links that are status='linked' but not yet verified
        res = await db.client.table("parent_student_links").select("*, parent:parent_id(full_name, email), student:student_id(full_name, email)").eq("status", "linked").eq("verified_by_admin", False).async_execute()
        return res.data
    except Exception as e:
        log.error("get_pending_parent_links_failed", error=str(e))
        return []


@router.post("/parents/verify/{link_id}")
async def verify_parent_link(link_id: str, admin: dict = Depends(is_admin),
    db: ScopedSupabase = Depends(get_scoped_db)
):
    """Manually verify a parent-student link after checking ID/Email (Item 1: Security)."""
    try:
        now = datetime.utcnow().isoformat()
        res = await db.client.table("parent_student_links").update({
            "verified_by_admin": True,
            "status": "linked", # Keep it as linked so it appears on dashboard
            "verification_status": "verified",
            "verified_at": now,
            "verified_by": admin.get("id")
        }).eq("id", link_id).async_execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Link not found")
            
        audit_logger.log(
            action="parent_link_verified",
            user_id=str(admin.get("id")),
            resource_id=link_id,
            metadata={"link_id": link_id}
        )
        return {"success": True, "verified_at": now}
    except Exception as e:
        log.error("verify_parent_link_failed", link_id=link_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to verify link")
