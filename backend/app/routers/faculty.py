from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.api.deps import get_current_faculty as get_current_user
from app.database.supabase_manager import supabase_db
from app.database.scoped_db import get_scoped_db
from app.services.personalization_service import get_personalization_service
from app.services.onboarding_service import OnboardingService
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


@router.get("/onboarding/options")
async def get_faculty_onboarding_options(current_user: dict = Depends(get_current_user)):
    _require_faculty(current_user)
    if current_user.get("role") not in {"teacher", "faculty"}:
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


@router.post("/onboarding/complete")
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
    step_1 = progress.get("step_1") or {}
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
    
    primary_program_id = next(
        (
            row.get("program", {}).get("id")
            for row in assignment_views
            if row.get("program", {}).get("id")
        ),
        None,
    )

    # Prepare payload for centralized onboarding service
    onboarding_payload = {
        "full_name": current_user.get("full_name"),
        "employee_id": employee_id,
        "designation": "Faculty",
        "specialization": specialization,
        "experience_years": step_1.get("experienceYears") or step_1.get("experience_years"),
        "subjects": subject_labels,
        "teaching_goal": payload.teaching_goal,
        "bio": (
            f"Engineering faculty setup complete. Goal: {payload.teaching_goal}. "
            f"Assessment policy: {step_4.get('gradingScale') or 'default grading'}."
        ),
        "preferences": {
            "teaching_styles": payload.teaching_styles,
            "teaching_goal": payload.teaching_goal,
            "subject_confidence": subject_confidence,
            "confirmed_assignments": payload.confirmed_assignment_ids,
            "program_names": program_names,
            "primary_program_id": primary_program_id,
            "primary_device": payload.primary_device,
            "internet_type": payload.internet_type,
            "consents": payload.consents,
            "subject_ids": course_ids,
            "batch_ids": batch_ids
        }
    }

    onboarding_service = OnboardingService(db=db)
    result = await onboarding_service.complete_onboarding(
        user_id=teacher_id,
        role="faculty",
        current_user=current_user,
        payload=onboarding_payload
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to finalize faculty onboarding")

    return {
        "success": True,
        "status": "success",
        "teacher_id": teacher_id,
        "assignments_confirmed": len(confirmed_assignments),
        "profile_migrated": True
    }


@router.get("/subjects")
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


@router.get("/students/{batch_id}")
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
    pending_submissions = await db.fetch_all("assignment_submissions", {"graded_by": None, "status": "submitted"})

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


@router.get("/interventions/queue")
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


@router.patch("/interventions/{intervention_id}")
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


@router.get("/alerts")
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


@router.get("/attendance/{course_id}")
async def get_course_attendance(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get attendance records for a course."""
    _require_faculty(current_user)
    db = get_scoped_db(current_user)
    # Get attendance sessions for the course
    sessions = await db.fetch_all("attendance_sessions", {"course_id": course_id})
    return sessions or []


@router.post("/attendance/mark")
async def mark_attendance_faculty(
    records: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    """Mark attendance for students via faculty router."""
    _require_faculty(current_user)
    db = get_scoped_db(current_user)
    
    if not records:
        raise HTTPException(status_code=400, detail="No attendance records provided")

    # Group by session (assuming one session per call)
    first = records[0]
    course_id = first.get("course_id")
    batch_id = first.get("batch_id")
    section = first.get("section")
    class_date = first.get("class_date", datetime.utcnow().strftime("%Y-%m-%d"))

    if not all([course_id, batch_id, section]):
        raise HTTPException(status_code=400, detail="Missing required session fields (course_id, batch_id, section)")

    # 1. Create/Update Session
    session_data = {
        "course_id": course_id,
        "teacher_id": current_user.get("id"),
        "batch_id": batch_id,
        "section": section,
        "class_date": class_date,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    session_res = db.table("attendance_sessions").upsert(
        session_data, on_conflict="course_id,batch_id,section,class_date"
    ).execute()
    
    if not session_res.data:
        raise HTTPException(status_code=500, detail="Failed to create attendance session")
    
    session_id = session_res.data[0]["id"]

    # 2. Insert Records
    normalized_records = []
    for record in records:
        normalized_records.append({
            "session_id": session_id,
            "student_id": record.get("student_id"),
            "is_present": bool(record.get("is_present", False)),
            "created_at": datetime.utcnow().isoformat(),
        })

    response = db.table("attendance_records").upsert(
        normalized_records, on_conflict="session_id,student_id"
    ).execute()
    
    return {"created": len(response.data or []), "session_id": session_id}


@router.get("/analytics/misconceptions")
async def get_misconception_clusters(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    """Get misconception clusters for specified students."""
    _require_faculty(current_user)
    service = get_personalization_service()
    return await service.get_cohort_misconceptions(student_ids)


@router.get("/analytics/growth")
async def get_growth_trajectories(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    """Get growth trajectories for specified students."""
    _require_faculty(current_user)
    service = get_personalization_service()
    return await service.get_growth_trajectories(student_ids)


@router.get("/students/{student_id}/analytics")
async def get_student_analytics(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed analytics for a specific student."""
    _require_faculty(current_user)
    service = get_personalization_service()
    return await service.get_teacher_projection(student_id)
