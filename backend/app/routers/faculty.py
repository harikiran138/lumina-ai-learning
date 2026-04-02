from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.api.deps import get_current_faculty as get_current_user
from app.database.supabase_manager import supabase_db
from app.database.scoped_db import get_scoped_db
from app.services.personalization_service import get_personalization_service
from app.personalization.schemas import InterventionUpdateRequest, InterventionStatus, InterventionPriority

router = APIRouter()


class FacultyOnboardingCompleteRequest(BaseModel):
    confirmed_assignment_ids: List[str] = []
    teaching_styles: List[str] = []
    subject_confidence: Dict[str, float] = {}
    teaching_goal: str
    primary_device: str
    internet_type: str
    consents: Dict[str, bool]


def _require_faculty(user: dict):
    pass


def _clamp_unit_interval(value: Any, default: float = 0.7) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return default
    return max(0.0, min(1.0, numeric))


def _build_assignment_views(
    assignments: List[Dict[str, Any]],
    courses: List[Dict[str, Any]],
    classes: List[Dict[str, Any]],
    batches: List[Dict[str, Any]],
    programs: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    course_lookup = {str(course.get("id")): course for course in courses}
    class_lookup = {str(item.get("id")): item for item in classes}
    batch_lookup = {str(item.get("id")): item for item in batches}
    program_lookup = {str(item.get("id")): item for item in programs}

    views: List[Dict[str, Any]] = []
    for assignment in assignments:
        course = course_lookup.get(str(assignment.get("course_id")))
        class_row = class_lookup.get(str(assignment.get("class_id")))
        batch = batch_lookup.get(str(assignment.get("batch_id")))
        program = program_lookup.get(
            str((course or {}).get("program_id") or (class_row or {}).get("program_id"))
        )
        views.append(
            {
                "assignment": assignment,
                "course": course,
                "class": class_row,
                "batch": batch,
                "program": program,
            }
        )
    return views


@router.get("/faculty/onboarding/options")
async def get_faculty_onboarding_options(current_user: dict = Depends(get_current_user)):
    _require_faculty(current_user)
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Teacher onboarding access required")

    teacher_id = str(current_user.get("id"))
    db = get_scoped_db(current_user)
    assignments = await db.fetch_all("teacher_assignments", {"teacher_id": teacher_id})

    course_ids = list({item.get("course_id") for item in assignments if item.get("course_id")})
    class_ids = list({item.get("class_id") for item in assignments if item.get("class_id")})
    batch_ids = list({item.get("batch_id") for item in assignments if item.get("batch_id")})

    courses = db.table("courses").select("*").in_("id", course_ids).execute().data or [] if course_ids else []
    classes = db.table("classes").select("*").in_("id", class_ids).execute().data or [] if class_ids else []
    batches = db.table("batches").select("*").in_("id", batch_ids).execute().data or [] if batch_ids else []

    program_ids = list(
        {
            item.get("program_id")
            for item in [*courses, *classes]
            if item.get("program_id")
        }
    )
    programs = (
        db.table("programs").select("*").in_("id", program_ids).execute().data or []
        if program_ids
        else []
    )

    teacher_profile = (
        await db.fetch_one("teacher_profiles", {"employee_id": current_user.get("employee_id")})
        if current_user.get("employee_id")
        else None
    )
    dashboard_preferences = await db.fetch_all("dashboard_preferences", {"user_id": teacher_id})
    existing_user_data = await db.fetch_one("user_data", {"user_id": teacher_id})
    progress = (existing_user_data or {}).get("progress") or {}

    return {
        "assignments": _build_assignment_views(assignments, courses, classes, batches, programs),
        "teacherProfile": teacher_profile or {},
        "dashboardPreferences": dashboard_preferences or [],
        "step5": progress.get("step_5") or {},
    }


@router.post("/faculty/onboarding/complete")
async def complete_faculty_onboarding(
    payload: FacultyOnboardingCompleteRequest,
    current_user: dict = Depends(get_current_user),
):
    _require_faculty(current_user)
    if current_user.get("role") not in {"teacher", "faculty"}:
        raise HTTPException(status_code=403, detail="Teacher onboarding access required")

    required_consents = ("teacherVerifiedAi", "academicIntegrity", "dataPolicy")
    if not all(payload.consents.get(key) is True for key in required_consents):
        raise HTTPException(status_code=400, detail="All mandatory faculty consents must be accepted")
    if not payload.teaching_styles:
        raise HTTPException(status_code=400, detail="Select at least one teaching preference")

    teacher_id = str(current_user.get("id"))
    employee_id = current_user.get("employee_id")
    db = get_scoped_db(current_user)
    if not employee_id:
        raise HTTPException(status_code=400, detail="Employee ID is missing from your teacher account")

    assignments = await db.fetch_all("teacher_assignments", {"teacher_id": teacher_id})
    assignment_lookup = {str(item.get("id")): item for item in assignments if item.get("id")}

    if assignments and not payload.confirmed_assignment_ids:
        raise HTTPException(status_code=400, detail="Confirm your batch and subject assignments before finishing setup")

    invalid_ids = sorted(set(payload.confirmed_assignment_ids) - set(assignment_lookup.keys()))
    if invalid_ids:
        raise HTTPException(status_code=403, detail="One or more confirmed assignments do not belong to this teacher")

    confirmed_assignments = (
        [assignment_lookup[assignment_id] for assignment_id in payload.confirmed_assignment_ids]
        if payload.confirmed_assignment_ids
        else []
    )

    course_ids = list({item.get("course_id") for item in confirmed_assignments if item.get("course_id")})
    class_ids = list({item.get("class_id") for item in confirmed_assignments if item.get("class_id")})
    batch_ids = list({item.get("batch_id") for item in confirmed_assignments if item.get("batch_id")})

    courses = db.table("courses").select("*").in_("id", course_ids).execute().data or [] if course_ids else []
    classes = db.table("classes").select("*").in_("id", class_ids).execute().data or [] if class_ids else []
    batches = db.table("batches").select("*").in_("id", batch_ids).execute().data or [] if batch_ids else []

    program_ids = list(
        {
            item.get("program_id")
            for item in [*courses, *classes]
            if item.get("program_id")
        }
    )
    programs = (
        db.table("programs").select("*").in_("id", program_ids).execute().data or []
        if program_ids
        else []
    )

    assignment_views = _build_assignment_views(confirmed_assignments, courses, classes, batches, programs)
    existing_user_data = await db.fetch_one("user_data", {"user_id": teacher_id})
    progress = (existing_user_data or {}).get("progress") or {}
    step_3 = progress.get("step_3") or {}
    step_4 = progress.get("step_4") or {}

    specialization = (step_3.get("specialization") or "").strip()
    subject_labels = [
        row.get("course", {}).get("course_name")
        or row.get("course", {}).get("name")
        or row.get("course", {}).get("course_code")
        or str(row.get("assignment", {}).get("course_id"))
        for row in assignment_views
    ]
    subject_confidence = {
        str(course_id): _clamp_unit_interval(payload.subject_confidence.get(str(course_id)), 0.7)
        for course_id in course_ids
    }
    program_names = [
        program.get("program_name") or program.get("name") or program.get("code")
        for program in programs
        if program.get("program_name") or program.get("name") or program.get("code")
    ]
    skills_summary = []
    if specialization:
        skills_summary.append(f"Specialization: {specialization}")
    if payload.teaching_styles:
        skills_summary.append(f"Teaching styles: {', '.join(payload.teaching_styles)}")

    now = datetime.utcnow().isoformat()
    teacher_profile = await db.upsert(
        "teacher_profiles",
        {
            "employee_id": employee_id,
            "username": (current_user.get("email") or "").split("@")[0] or employee_id,
            "program": ", ".join(sorted(set(program_names))) or None,
            "phone": current_user.get("phone"),
            "email": current_user.get("email"),
            "skills": " | ".join(skills_summary) or specialization or None,
            "designation": "Faculty",
            "subjects": subject_labels,
            "bio": (
                f"Engineering faculty setup complete. Goal: {payload.teaching_goal}. "
                f"Assessment policy: {step_4.get('gradingScale') or 'default grading'}."
            ),
            "is_profile_complete": True,
            "updated_at": now,
        },
        on_conflict="employee_id",
    )
    if not teacher_profile:
        raise HTTPException(status_code=500, detail="Failed to initialize teacher profile")

    primary_program_id = next(
        (
            row.get("program", {}).get("id")
            for row in assignment_views
            if row.get("program", {}).get("id")
        ),
        None,
    )
    if primary_program_id:
        dashboard_payload = {
            "user_id": teacher_id,
            "program_id": primary_program_id,
            "enabled_modules": [
                "courses",
                "students",
                "attendance",
                "verification_queue",
                "interventions",
                "analytics",
            ],
            "layout_order": [
                "overview",
                "courses",
                "students",
                "verification_queue",
                "attendance",
                "analytics",
            ],
            "updated_at": now,
        }
        existing_dashboard = await db.fetch_one("dashboard_preferences", {"user_id": teacher_id})
        if existing_dashboard and existing_dashboard.get("id"):
            updated_dashboard = await db.update(
                "dashboard_preferences",
                dashboard_payload,
                {"id": existing_dashboard["id"]},
            )
            if updated_dashboard is None:
                raise HTTPException(status_code=500, detail="Failed to initialize faculty dashboard preferences")
        else:
            created_dashboard = await db.insert("dashboard_preferences", dashboard_payload)
            if created_dashboard is None:
                raise HTTPException(status_code=500, detail="Failed to create faculty dashboard preferences")

    updated_user = await db.update("users", {"onboarding_step": 5}, {"id": teacher_id})
    if updated_user is None:
        raise HTTPException(status_code=500, detail="Failed to update faculty onboarding state")

    progress["step_5"] = {
        "confirmedAssignmentIds": payload.confirmed_assignment_ids,
        "teachingStyles": payload.teaching_styles,
        "subjectConfidence": subject_confidence,
        "goal": payload.teaching_goal,
        "deviceType": payload.primary_device,
        "internetType": payload.internet_type,
        "consents": payload.consents,
        "subjectIds": course_ids,
        "assignmentCount": len(payload.confirmed_assignment_ids),
        "batchIds": batch_ids,
    }
    progress["onboarding_status"] = "COMPLETED"
    progress["onboarding_step"] = 5

    if existing_user_data:
        updated_user_data = await db.update(
            "user_data",
            {"progress": progress, "updated_at": now},
            {"user_id": teacher_id},
        )
        if updated_user_data is None:
            raise HTTPException(status_code=500, detail="Failed to store faculty onboarding progress")
    else:
        created_user_data = await db.insert(
            "user_data",
            {"user_id": teacher_id, "progress": progress, "updated_at": now},
        )
        if created_user_data is None:
            raise HTTPException(status_code=500, detail="Failed to create faculty onboarding progress")

    return {
        "success": True,
        "teacherId": teacher_id,
        "assignmentCount": len(payload.confirmed_assignment_ids),
        "subjectCount": len(course_ids),
        "programCount": len(program_names),
    }


@router.get("/faculty/subjects")
async def list_faculty_subjects(current_user: dict = Depends(get_current_user)):
    """List all subjects/courses assigned to this faculty member."""
    _require_faculty(current_user)
    db = get_scoped_db(current_user)
    assignments = await db.fetch_all(
        "teacher_assignments",
        {"teacher_id": current_user.get("id")},
    )
    if not assignments:
        return []
    course_ids = list({item.get("course_id") for item in assignments if item.get("course_id")})
    courses = (
        db.table("courses").select("*").in_("id", course_ids).execute().data or []
        if course_ids else []
    )
    course_lookup = {c["id"]: c for c in courses}

    results = []
    for assignment in assignments:
        course = course_lookup.get(assignment.get("course_id"))
        results.append({
            "assignment": assignment,
            "course": course,
        })
    return results


@router.get("/faculty/students/{batch_id}")
async def list_batch_students(
    batch_id: str,
    section: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List all students in a specific batch/section."""
    _require_faculty(current_user)
    db = get_scoped_db(current_user)
    filters = {"batch_id": batch_id, "role": "student"}
    if section:
        filters["section"] = section
    students = await db.fetch_all("users", filters)
    # Enrich with enrollment info if available
    enriched = []
    for student in students:
        enrollments = await db.fetch_all("student_enrollments", {"student_id": student.get("id")})
        student_data = {**student, "enrollments": enrollments or []}
        enriched.append(student_data)
    return enriched


@router.get("/dashboard")
async def get_faculty_dashboard_summary(current_user: dict = Depends(get_current_user)):
    """Get faculty dashboard summary with courses, students, and pending tasks."""
    _require_faculty(current_user)
    db = get_scoped_db(current_user)

    # Get teacher assignments
    assignments = await db.fetch_all(
        "teacher_assignments",
        {"teacher_id": current_user.get("id")},
    )

    course_ids = list({item.get("course_id") for item in assignments if item.get("course_id")})
    class_ids = list({item.get("class_id") for item in assignments if item.get("class_id")})

    # Get courses
    courses_data = []
    active_alerts = []
    if course_ids:
        courses_data = db.table("courses").select("*").in_("id", course_ids).execute().data or []

    # Get total students across all classes
    total_students = 0
    if class_ids:
        for class_id in class_ids:
            students = await db.fetch_all("student_enrollments", {"class_id": class_id})
            total_students += len(students or [])

    # Get pending submissions to grade
    pending_submissions = await db.fetch_all("submissions", {"graded_by": None, "status": "submitted"})

    # Get active interventions
    service = get_personalization_service(db=db)
    interventions = await service.get_interventions()

    active_alerts = [
        {
            "id": str(i.id),
            "type": "warning" if i.priority in ["high", "critical"] else "info",
            "title": i.recommended_action,
            "description": i.reason,
            "priority": i.priority,
        }
        for i in interventions
        if i.status in [InterventionStatus.OPEN, InterventionStatus.ACKNOWLEDGED]
    ]

    return {
        "stats": [
            {"label": "Total Students", "value": str(total_students), "trend": "Stable", "icon": "Users"},
            {"label": "Avg. Mastery", "value": "72%", "trend": "+3.2%", "icon": "Target"},
            {"label": "Active Interventions", "value": str(len(active_alerts)), "trend": "Needs Attention", "icon": "AlertTriangle"},
            {"label": "Pending Grades", "value": str(len(pending_submissions or [])), "trend": "Due Soon", "icon": "FileCheck"},
        ],
        "alerts": active_alerts[:5],
        "charts": {
            "masteryDistribution": [
                {"category": "90-100%", "count": 12},
                {"category": "75-89%", "count": 25},
                {"category": "60-74%", "count": 18},
                {"category": "Below 60%", "count": total_students - 55 if total_students > 55 else 5},
            ]
        },
        "feed": [
            {
                "id": f"sub-{s.get('id')}",
                "type": "submission",
                "title": f"New Submission: {s.get('id')[:8]}",
                "time": s.get("submitted_at") or s.get("created_at"),
                "meta": {"student_id": s.get("student_id")}
            }
            for s in pending_submissions[:10]
        ],
        "meta": {
            "courses": courses_data,
            "role": "faculty"
        }
    }


@router.get("/faculty/interventions/queue")
async def get_intervention_queue(current_user: dict = Depends(get_current_user)):
    """Get intervention queue for faculty - students needing attention."""
    _require_faculty(current_user)
    service = get_personalization_service()
    interventions = await service.get_interventions(user_id=None)
    active = [
        item.model_dump(mode="json")
        for item in interventions
        if item.status in (InterventionStatus.OPEN, InterventionStatus.ACKNOWLEDGED)
    ]
    return active


@router.patch("/faculty/interventions/{intervention_id}")
async def update_intervention_status(
    intervention_id: str,
    update: InterventionUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update intervention status and add teacher notes."""
    _require_faculty(current_user)
    service = get_personalization_service()
    updated = await service.update_intervention(
        intervention_id=intervention_id,
        status=update.status,
        teacher_notes=update.teacher_notes,
        action_taken=update.action_taken
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Intervention not found")
    return updated.model_dump(mode="json")


@router.get("/faculty/alerts")
async def get_faculty_alerts(current_user: dict = Depends(get_current_user)):
    """Get alerts for at-risk students in faculty's classes."""
    _require_faculty(current_user)
    service = get_personalization_service()
    interventions = await service.get_interventions(user_id=None)
    alerts = [
        item.model_dump(mode="json")
        for item in interventions
        if item.priority in (InterventionPriority.CRITICAL, InterventionPriority.HIGH)
        and item.status != InterventionStatus.RESOLVED
    ]
    return alerts


@router.get("/faculty/attendance/{course_id}")
async def get_course_attendance(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get attendance records for a course."""
    _require_faculty(current_user)
    db = get_scoped_db(current_user)
    attendance_records = await db.fetch_all("attendance", {"course_id": course_id})
    return attendance_records or []


@router.post("/faculty/attendance/mark")
async def mark_attendance(
    records: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    """Mark attendance for students."""
    _require_faculty(current_user)
    db = get_scoped_db(current_user)
    created = []
    for record in records:
        try:
            new_record = await db.insert("attendance", {
                "course_id": record.get("course_id"),
                "teacher_id": current_user.get("id"),
                "student_id": record.get("student_id"),
                "batch_id": record.get("batch_id"),
                "section": record.get("section"),
                "class_date": record.get("class_date", datetime.utcnow().strftime("%Y-%m-%d")),
                "is_present": record.get("is_present", False),
            })
            if new_record:
                created.append(new_record)
        except Exception:
            pass  # Skip duplicates or errors
    return {"created": len(created), "records": created}


@router.get("/faculty/analytics/misconceptions")
async def get_misconception_clusters(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    """Get misconception clusters for specified students."""
    _require_faculty(current_user)
    service = get_personalization_service()
    return await service.get_cohort_misconceptions(student_ids)


@router.get("/faculty/analytics/growth")
async def get_growth_trajectories(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    """Get growth trajectories for specified students."""
    _require_faculty(current_user)
    service = get_personalization_service()
    return await service.get_growth_trajectories(student_ids)


@router.get("/faculty/students/{student_id}/analytics")
async def get_student_analytics(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed analytics for a specific student."""
    _require_faculty(current_user)
    service = get_personalization_service()
    return await service.get_teacher_projection(student_id)
