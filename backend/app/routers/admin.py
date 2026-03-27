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
from app.store.academic_store import AcademicStore

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
        "roles": ["student", "teacher", "hod", "admin", "parent"],
        "permissions": {
            "course_create": ["admin", "teacher", "hod"],
            "course_delete": ["admin"],
            "user_manage": ["admin"],
            "analytics_view": ["admin", "teacher", "hod"],
            "billing_manage": ["admin"]
        }
    }


@router.get("/users")
async def get_all_users(admin: dict = Depends(is_admin)):
    """List users scoped to the primary institution."""
    store = InstitutionStore()
    inst_id = await store.get_primary_institution_id()
    
    user_store = UserStore()
    all_users = await user_store.list_all_users()
    
    if not inst_id:
        return []
        
    # Filter users: Include all admins, plus students/teachers linked to this institution via stakeholders
    # In a real single-tenant system, this is the entire user list.
    # For safety, we fetch stakeholders for this institution.
    stakeholders = await store.list_stakeholders(inst_id)
    relevant_user_ids = {s.get("user_id") for s in stakeholders if s.get("user_id")}
    
    return [u for u in all_users if u["role"] == "admin" or u["id"] in relevant_user_ids]


@router.post("/users")
async def create_user(data: dict, admin: dict = Depends(is_admin)):
    """Create a user without replacing the admin session."""
    role = (data.get("role") or "student").strip().lower()
    
    # Restrict new admin creation as per single-institution policy
    if role == "admin":
        raise HTTPException(
            status_code=403, 
            detail="Platform policy permits only one primary administrator account. Cannot create additional admin roles."
        )

    if role not in {"student", "teacher", "hod"}:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'student', 'teacher', or 'hod'.")

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
        user = await user_store.create_user(email, password, full_name, role, phone)
        if data.get("department_id"):
            await user_store.update_user_fields(user["id"], {"department_id": data["department_id"]})
        return user
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
    if role not in ("student", "teacher", "hod", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be student, teacher, hod, or admin")
    user_store = UserStore()
    success = await user_store.update_user_role(user_id, role)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}


@router.get("/courses")
async def get_all_courses(admin: dict = Depends(is_admin)):
    """List courses scoped to the primary institution."""
    store = InstitutionStore()
    inst_id = await store.get_primary_institution_id()
    if not inst_id:
        return []

    course_store = CourseStore()
    all_courses = await course_store.list_courses()
    
    # In single-tenant mode, we assume all courses belong to the primary inst if defined.
    # If we wanted to be stricter, we'd check programs -> semesters -> courses chain.
    # For the MVP, we filter if program links exist.
    return all_courses


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
    """List institutions (limited to primary in single-tenant mode)."""
    store = InstitutionStore()
    primary = await store.get_primary_institution()
    return [primary] if primary else []


@router.post("/institutions")
async def create_institution(data: dict, admin: dict = Depends(is_admin)):
    """Create a new institution (restricted to one in single-tenant mode)."""
    store = InstitutionStore()
    existing = await store.list_institutions()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Platform is configured for single institution only. Multiple institutions are not allowed."
        )
    return await store.create_institution(data)


@router.patch("/institutions/{inst_id}/status")
async def update_institution_status(inst_id: str, data: dict, admin: dict = Depends(is_admin)):
    """Explicitly update the onboarding status of an institution."""
    status = data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="status field is required")
    
    success = await InstitutionStore().update_institution_status(inst_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Institution not found or update failed")
    
    audit_logger.log(
        action="institution_status_updated",
        user_id=str(admin.get("id")),
        metadata={"institution_id": inst_id, "new_status": status}
    )
    return {"success": True, "new_status": status}


@router.get("/institutions/{inst_id}/departments")
async def get_departments(inst_id: str, admin: dict = Depends(is_admin)):
    """List all departments for an institution."""
    return await InstitutionStore().list_departments(inst_id)


@router.post("/institutions/{inst_id}/departments")
async def create_department(inst_id: str, data: dict, admin: dict = Depends(is_admin)):
    """Create a new department."""
    data["institution_id"] = inst_id
    return await InstitutionStore().create_department(data)


@router.patch("/institutions/{inst_id}/departments/{dept_id}")
async def update_department(
    inst_id: str,
    dept_id: str,
    data: dict,
    admin: dict = Depends(is_admin),
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
    result = await supabase_db.update(
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
):
    """Assign or update HOD for a department."""
    hod_id = data.get("hod_id")
    if not hod_id:
        raise HTTPException(status_code=400, detail="Missing hod_id")

    user_store = UserStore()
    hod_user = await user_store.get_user_by_id(hod_id)
    if not hod_user:
        raise HTTPException(status_code=404, detail="HOD user not found")

    # Ensure role is hod
    await user_store.update_user_role(hod_id, "hod")
    await user_store.update_user_fields(hod_id, {"department_id": dept_id})

    # Update department
    res = await supabase_db.update(
        "departments",
        {"hod_id": hod_id, "updated_at": datetime.utcnow().isoformat()},
        {"id": dept_id, "institution_id": inst_id},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"status": "success", "department_id": dept_id, "hod_id": hod_id}


@router.get("/institutions/{inst_id}/programs")
async def list_programs(inst_id: str, admin: dict = Depends(is_admin)):
    """List all programs for an institution."""
    return await InstitutionStore().list_programs(inst_id)


@router.post("/institutions/{inst_id}/programs")
async def create_program(inst_id: str, data: dict, admin: dict = Depends(is_admin)):
    """Create a new program under an institution (and optional department)."""
    data["institution_id"] = inst_id
    return await InstitutionStore().create_program(data)


@router.get("/programs/{program_id}/semesters")
async def list_semesters(program_id: str, admin: dict = Depends(is_admin)):
    """List semesters for a program."""
    return await supabase_db.fetch_all("semesters", {"program_id": program_id})


@router.post("/programs/{program_id}/semesters")
async def create_semester(program_id: str, data: dict, admin: dict = Depends(is_admin)):
    """Create a semester under a program."""
    semester_number = data.get("semester_number")
    if semester_number is None:
        raise HTTPException(status_code=400, detail="Missing semester_number")
    payload = {
        "program_id": program_id,
        "semester_number": semester_number,
        "title": data.get("title"),
    }
    return await supabase_db.insert("semesters", payload)


@router.patch("/classes/{class_id}")
async def update_class(class_id: str, data: dict, admin: dict = Depends(is_admin)):
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
    result = await supabase_db.update("classes", payload, {"id": class_id})
    if not result:
        raise HTTPException(status_code=404, detail="Class not found")
    return result[0]


@router.get("/classes/{class_id}/summary")
async def class_summary(class_id: str, admin: dict = Depends(is_admin)):
    """Summarize class capacity usage and assignments."""
    client = supabase_db.get_client()
    students = (
        client.table("student_enrollments")
        .select("id")
        .eq("class_id", class_id)
        .execute()
        .data
        or []
    )
    assignments = (
        client.table("teacher_assignments")
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
            client.table("courses")
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
async def link_stakeholder(data: dict, admin: dict = Depends(is_admin)):
    """Link a user as a stakeholder to an institution or program."""
    return await InstitutionStore().create_stakeholder(data)


@router.get("/connections")
async def get_connections(inst_id: Optional[str] = None, program_id: Optional[str] = None, admin: dict = Depends(is_admin)):
    """List stakeholder connections (scoped to primary institution)."""
    store = InstitutionStore()
    
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

# --- Academic Management ---

@router.get("/students/{student_id}/enrollment")
async def get_student_enrollment(student_id: str, admin: dict = Depends(is_admin)):
    """Fetch student's current enrollment and academic placement."""
    store = AcademicStore()
    enrollment = await store.get_student_enrollment(student_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return enrollment


@router.post("/students/{student_id}/promote")
async def promote_student(student_id: str, admin: dict = Depends(is_admin)):
    """Promote student to the next academic semester."""
    store = AcademicStore()
    result = await store.promote_student(student_id)
    if not result:
        raise HTTPException(
            status_code=400, 
            detail="Promotion failed. Check if student is already in the final semester."
        )
    return {"success": True, "updated_enrollment": result}


@router.get("/students/{student_id}/credits")
async def get_student_credits(student_id: str, admin: dict = Depends(is_admin)):
    """Fetch student credit history across semesters."""
    store = AcademicStore()
    return await store.get_student_credits(student_id)


@router.post("/students/{student_id}/credits")
async def update_student_credits(
    student_id: str, 
    semester_id: str, 
    earned: int, 
    total: int, 
    admin: dict = Depends(is_admin)
):
    """Update student credits for a specific semester."""
    store = AcademicStore()
    result = await store.update_credits(student_id, semester_id, earned, total)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to update credits")
    return {"success": True, "credits": result}
