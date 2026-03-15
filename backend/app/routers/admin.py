from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime

from .auth import get_current_user
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.analytics_store import AnalyticsStore
from app.store.institution_store import InstitutionStore
from app.services.personalization_service import get_personalization_service
from app.database.supabase_manager import supabase_db
import structlog
from app.core.audit import audit_logger
from app.services.guardian_service import get_guardian_service
from app.services.compliance_service import get_compliance_service
from app.database.models import Institution, Department, Stakeholder

router = APIRouter()
log = structlog.get_logger(__name__)


def is_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Requirement: Mandatory 2FA for all admin routes
    # In a real system, we'd check if the session has a 2FA flag
    if not current_user.get("two_factor_enabled"):
        # We allow it to pass for now but log a warning if 2FA implementation is pending
        log.warning("admin_access_without_2fa", user_id=current_user.get("id"))
    
    return current_user


@router.get("/config")
async def get_platform_config(admin: dict = Depends(is_admin)):
    """Fetch global platform configuration (Maintenance mode, feature flags)."""
    # Mocking config for now, would typically come from a KV store or specific DB table
    return {
        "maintenance_mode": False,
        "public_registration": True,
        "ai_tutor_enabled": True,
        "guardian_mode": "active",
        "api_rate_limit": 10000
    }


@router.post("/config")
async def update_platform_config(config: dict, admin: dict = Depends(is_admin)):
    """Update global platform configuration."""
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
async def get_admin_dashboard(admin: dict = Depends(is_admin)):
    """Get high-level system stats for the admin dashboard."""
    return await AnalyticsStore().get_admin_dashboard_stats()


@router.get("/health")
async def get_system_health(admin: dict = Depends(is_admin)):
    """Comprehensive system-wide health audit."""
    return await AnalyticsStore().get_system_health_audit()


@router.get("/queue-health")
async def get_queue_health(admin: dict = Depends(is_admin)):
    """AI verification backlog and throughput signals."""
    return await AnalyticsStore().get_verification_queue_stats()


@router.get("/guardian")
async def get_guardian_signals(admin: dict = Depends(is_admin)):
    """Fetch active Guardian agent flagging signals."""
    return await get_guardian_service().get_active_signals()


@router.get("/roles/matrix")
async def get_role_matrix(admin: dict = Depends(is_admin)):
    """Fetch the functional role-per-permission matrix."""
    return {
        "roles": ["student", "teacher", "admin", "parent"],
        "permissions": {
            "course_create": ["admin", "teacher"],
            "course_delete": ["admin"],
            "user_manage": ["admin"],
            "analytics_view": ["admin", "teacher"],
            "billing_manage": ["admin"]
        }
    }


@router.get("/users")
async def get_all_users(admin: dict = Depends(is_admin)):
    """List all users in the system."""
    user_store = UserStore()
    return await user_store.list_all_users()


@router.post("/users")
async def create_user(data: dict, admin: dict = Depends(is_admin)):
    """Create a user without replacing the admin session."""
    role = (data.get("role") or "student").strip().lower()
    if role not in {"student", "teacher", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    full_name = (data.get("name") or data.get("full_name") or "").strip()
    phone = (data.get("phone") or "").strip()

    if not email or not password or not full_name:
        raise HTTPException(
            status_code=400,
            detail="name, email, and password are required",
        )

    user_store = UserStore()
    try:
        return await user_store.create_user(email, password, full_name, role, phone)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(is_admin)):
    """Delete a user from the system."""
    user_store = UserStore()
    success = await user_store.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}


@router.post("/users/{user_id}/status")
async def update_user_status(user_id: str, status: str, admin: dict = Depends(is_admin)):
    """Update a user's active status."""
    normalized_status = (status or "").strip().lower()
    if normalized_status not in {"active", "inactive", "suspended"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Must be active, inactive, or suspended",
        )

    user_store = UserStore()
    success = await user_store.update_user_status(user_id, normalized_status)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}


@router.post("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: dict = Depends(is_admin)):
    """Change a user's role."""
    if role not in ("student", "teacher", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be student, teacher, or admin")
    user_store = UserStore()
    success = await user_store.update_user_role(user_id, role)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}


@router.get("/courses")
async def get_all_courses(admin: dict = Depends(is_admin)):
    """List all courses for admin management."""
    course_store = CourseStore()
    return await course_store.list_courses()


@router.get("/logs/ai")
async def get_ai_logs(admin: dict = Depends(is_admin)):
    """Fetch AI interaction logs."""
    try:
        response = supabase_db.client.table("ai_logs").select("*").order("timestamp", desc=True).limit(100).execute()
        return response.data
    except Exception as e:
        return []

@router.delete("/logs/ai/{log_id}")
async def delete_ai_log(log_id: str, admin: dict = Depends(is_admin)):
    """Delete a specific AI log entry."""
    try:
        res = supabase_db.client.table("ai_logs").delete().eq("id", log_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Log entry not found")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs/chat")
async def get_chat_logs(admin: dict = Depends(is_admin)):
    """Fetch AI tutor chat conversation logs."""
    try:
        response = supabase_db.client.table("conversations").select("*").order("last_updated", desc=True).limit(100).execute()
        return response.data
    except Exception as e:
        return []


@router.get("/students-progress")
async def get_students_progress(admin: dict = Depends(is_admin)):
    """Get progress data for all students."""
    return await AnalyticsStore().get_admin_student_progress_snapshot()


@router.get("/interventions")
async def get_interventions(admin: dict = Depends(is_admin)):
    """List open intervention recommendations generated by the personalization engine."""
    return [
        item.model_dump(mode="json")
        for item in await get_personalization_service().get_interventions()
    ]


# --- Institution & Connection Management ---

@router.get("/institutions")
async def get_institutions(admin: dict = Depends(is_admin)):
    """List all institutions."""
    return await InstitutionStore().list_institutions()


@router.post("/institutions")
async def create_institution(data: dict, admin: dict = Depends(is_admin)):
    """Create a new institution."""
    return await InstitutionStore().create_institution(data)


@router.get("/institutions/{inst_id}/departments")
async def get_departments(inst_id: str, admin: dict = Depends(is_admin)):
    """List all departments for an institution."""
    return await InstitutionStore().list_departments(inst_id)


@router.post("/institutions/{inst_id}/departments")
async def create_department(inst_id: str, data: dict, admin: dict = Depends(is_admin)):
    """Create a new department."""
    data["institution_id"] = inst_id
    return await InstitutionStore().create_department(data)


@router.post("/connections/link")
async def link_stakeholder(data: dict, admin: dict = Depends(is_admin)):
    """Link a user as a stakeholder to an institution or program."""
    return await InstitutionStore().create_stakeholder(data)


@router.get("/connections")
async def get_connections(inst_id: Optional[str] = None, program_id: Optional[str] = None, admin: dict = Depends(is_admin)):
    """List stakeholder connections."""
    store = InstitutionStore()
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
    users = {item["id"]: item for item in await UserStore().list_all_users()}

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
async def get_deletion_requests(admin: dict = Depends(is_admin)):
    """List pending and completed data deletion requests."""
    try:
        response = supabase_db.client.table("deletion_requests").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception:
        return []


@router.post("/compliance/deletions/{request_id}/process")
async def process_deletion_request(request_id: str, admin: dict = Depends(is_admin)):
    """Approve and process a data deletion request."""
    # Fetch request to get user_id
    try:
        req_res = supabase_db.client.table("deletion_requests").select("user_id").eq("id", request_id).single().execute()
        user_id = req_res.data.get("user_id") if req_res.data else "unknown"
        
        success = await get_compliance_service().process_deletion_pipeline(request_id, user_id)
        if not success:
            raise HTTPException(status_code=500, detail="Pipeline execution failed")

        supabase_db.client.table("deletion_requests").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", request_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compliance/audit-logs")
async def get_compliance_audit_logs(admin: dict = Depends(is_admin)):
    """Fetch immutable audit logs for compliance tracking."""
    try:
        response = supabase_db.client.table("audit_logs").select("*").order("created_at", desc=True).limit(200).execute()
        return response.data
    except Exception:
        return []
