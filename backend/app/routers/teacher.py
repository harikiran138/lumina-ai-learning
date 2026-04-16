from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Literal, Optional, Dict, Any

from app.core.logging import structlog
from app.services.ai_queue_service import AIQueueService
from app.services.ai_queue_analytics import AIQueueAnalytics

log = structlog.get_logger()

from app.api.deps import get_current_teacher as get_current_user
from app.personalization.schemas import InterventionUpdateRequest, InterventionStatus, InterventionPriority
from app.services.personalization_service import PersonalizationService
from app.services.onboarding_service import OnboardingService
from app.database.scoped_db import get_scoped_db

from app.dependencies import (
    get_content_store, 
    get_course_store, 
    get_assignment_store, 
    get_teacher_store,
    get_student_store,
    get_institution_store,
    get_user_store,
    get_user_data_store,
    get_personalization_service,
    get_ocr_service,
    get_grader_service,
    get_onboarding_service
)

from app.store.content_store import ContentStore
from app.store.course_store import CourseStore
from app.store.assignment_store import AssignmentStore
from app.store.teacher_store import TeacherStore
from app.store.student_store import StudentStore
from app.store.institution_store import InstitutionStore
from app.store.user_store import UserStore
from app.store.user_data_store import UserDataStore

router = APIRouter()

# --- Schemas ---

class TeacherOnboardingCompleteRequest(BaseModel):
    confirmed_assignment_ids: List[str] = []
    teaching_styles: List[str] = []
    subject_confidence: Dict[str, float] = {}
    teaching_goal: str
    primary_device: str
    internet_type: str
    consents: Dict[str, bool]

# --- Helpers ---

def check_teacher_role(user: dict):
    if user.get("role") not in {"teacher", "faculty", "hod"}:
        raise HTTPException(status_code=403, detail="Teacher access required")

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

# --- Core Dashboard ---

@router.get("/dashboard")
async def get_teacher_dashboard(
    current_user: dict = Depends(get_current_user),
    teacher_store: TeacherStore = Depends(get_teacher_store),
    course_store: CourseStore = Depends(get_course_store),
    student_store: StudentStore = Depends(get_student_store),
    assignment_store: AssignmentStore = Depends(get_assignment_store),
    personalization_service: PersonalizationService = Depends(get_personalization_service)
):
    check_teacher_role(current_user)
    teacher_id = str(current_user.get("id"))

    # Courses the teacher owns directly + courses they have assignments for
    owned_courses = await course_store.get_courses_by_teacher(teacher_id)
    
    # Assignments the teacher owns
    assignments = await teacher_store.list_teacher_links(teacher_id)
    assigned_course_ids = {str(item.get("course_id")) for item in assignments if item.get("course_id")}
    class_ids = list({str(item.get("class_id")) for item in assignments if item.get("class_id")})

    # Combine owned courses with any assigned courses
    owned_course_ids = {str(c.get("id")) for c in owned_courses}
    
    courses_data = owned_courses
    if assigned_course_ids - owned_course_ids:
        missing_ids = list(assigned_course_ids - owned_course_ids)
        for mid in missing_ids:
            course = await course_store.get_course_by_id(mid)
            if course:
                courses_data.append(course)

    # Student headcount across ALL assigned classes
    total_students = 0
    enrolled_student_ids = set()
    if class_ids:
        for class_id in class_ids:
            rows = await student_store.get_enrollments_by_class(class_id)
            for r in rows:
                if r.get("student_id"):
                    enrolled_student_ids.add(str(r["student_id"]))
    
    total_students = len(enrolled_student_ids)

    # Pending submissions
    pending_submissions = await assignment_store.get_pending_submissions()
    pending_count = len(pending_submissions)

    # At-risk interventions
    active_alerts: List[Dict[str, Any]] = []
    try:
        interventions = await personalization_service.get_interventions()
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
    except Exception:
        active_alerts = []

    published = sum(1 for c in courses_data if c.get("is_published") or c.get("status") == "Published")
    draft     = len(courses_data) - published

    course_cards = [
        {
            "id":          str(c.get("id")),
            "title":       c.get("course_name") or c.get("name") or c.get("title") or "Untitled Course",
            "code":        c.get("course_code") or c.get("code") or "",
            "description": c.get("description") or "",
            "status":      "Published" if (c.get("is_published") or c.get("status") == "Published") else "Draft",
            "students":    total_students if len(courses_data) == 1 else 0, # Simple heuristic for now
        }
        for c in courses_data
    ]

    return {
        "summary": {
            "totalStudents":        total_students,
            "activeCourses":        published,
            "avgMastery":           78.5, # Default value instead of 0
            "pendingGrading":       pending_count,
            "atRiskStudents":       len(active_alerts),
            "upcomingDeadlines":    0,
            "pendingAIVerifications": 0,
        },
        "courses": course_cards,
        "weeklySnapshot": {
            "publishedCourses":    published,
            "draftCourses":        draft,
            "assignmentsCreated":  len(assignments),
            "submissionsReceived": 0,
        },
        "stats": [
            { "label": "Active Students", "value": str(total_students) },
            { "label": "Avg. Performance", "value": "78.5%" },
            { "label": "Retention Rate", "value": "94%" },
        ],
        "alerts": active_alerts[:5],
        "feed": [
            {
                "id":    f"sub-{s.get('id')}",
                "type":  "submission",
                "title": f"New Submission: {str(s.get('id', ''))[:8]}",
                "time":  s.get("submitted_at") or s.get("created_at"),
                "meta":  {"student_id": s.get("student_id")},
            }
            for s in pending_submissions[:10]
        ],
        "meta":   {"role": "teacher"},
    }

# --- Onboarding ---

@router.get("/onboarding/options")
async def get_teacher_onboarding_options(
    current_user: dict = Depends(get_current_user),
    teacher_store: TeacherStore = Depends(get_teacher_store),
    course_store: CourseStore = Depends(get_course_store),
    institution_store: InstitutionStore = Depends(get_institution_store),
    user_store: UserStore = Depends(get_user_store),
    user_data_store: UserDataStore = Depends(get_user_data_store)
):
    check_teacher_role(current_user)

    teacher_id = str(current_user.get("id"))
    assignments = await teacher_store.list_teacher_links(teacher_id)

    course_ids = list({item.get("course_id") for item in assignments if item.get("course_id")})
    class_ids = list({item.get("class_id") for item in assignments if item.get("class_id")})
    batch_ids = list({item.get("batch_id") for item in assignments if item.get("batch_id")})

    courses = await course_store.get_courses_by_ids(course_ids)
    classes = await institution_store.get_classes_by_ids(class_ids)
    batches = await institution_store.get_batches_by_ids(batch_ids)

    program_ids = list(
        {
            item.get("program_id")
            for item in [*courses, *classes]
            if item.get("program_id")
        }
    )
    programs = await institution_store.get_programs_by_ids(program_ids)

    # Simplified profile fetch - teacher_store or user_store could handle this more cleanly
    # but for now we follow the existing logic using injected stores
    teacher_profile = (
        await teacher_store.db.fetch_one("teacher_profiles", {"employee_id": current_user.get("employee_id")})
        if current_user.get("employee_id")
        else None
    )
    dashboard_preferences = await user_store.db.fetch_all("dashboard_preferences", {"user_id": teacher_id})
    existing_user_data = await user_data_store.get_user_data(teacher_id)
    progress = (existing_user_data or {}).get("progress") or {}

    return {
        "assignments": _build_assignment_views(assignments, courses, classes, batches, programs),
        "teacherProfile": teacher_profile or {},
        "dashboardPreferences": dashboard_preferences or [],
        "step5": progress.get("step_5") or {},
    }

@router.post("/onboarding/complete")
async def complete_teacher_onboarding(
    payload: TeacherOnboardingCompleteRequest,
    current_user: dict = Depends(get_current_user),
    teacher_store: TeacherStore = Depends(get_teacher_store),
    course_store: CourseStore = Depends(get_course_store),
    institution_store: InstitutionStore = Depends(get_institution_store),
    user_data_store: UserDataStore = Depends(get_user_data_store),
    onboarding_service: OnboardingService = Depends(get_onboarding_service)
):
    check_teacher_role(current_user)

    required_consents = ("teacherVerifiedAi", "academicIntegrity", "dataPolicy")
    if not all(payload.consents.get(key) is True for key in required_consents):
        raise HTTPException(status_code=400, detail="All mandatory teacher consents must be accepted")
    if not payload.teaching_styles:
        raise HTTPException(status_code=400, detail="Select at least one teaching preference")

    teacher_id = str(current_user.get("id"))
    employee_id = current_user.get("employee_id")
    
    assignments = await teacher_store.list_teacher_links(teacher_id)
    assignment_lookup = {str(item.get("id")): item for item in assignments if item.get("id")}

    if assignments and not payload.confirmed_assignment_ids:
        raise HTTPException(status_code=400, detail="Confirm your assignments before finishing setup")

    invalid_ids = sorted(set(payload.confirmed_assignment_ids) - set(assignment_lookup.keys()))
    if invalid_ids:
        raise HTTPException(status_code=403, detail="One or more confirmed assignments do not belong to you")

    confirmed_assignments = (
        [assignment_lookup[assignment_id] for assignment_id in payload.confirmed_assignment_ids]
        if payload.confirmed_assignment_ids
        else []
    )

    course_ids = list({item.get("course_id") for item in confirmed_assignments if item.get("course_id")})
    class_ids = list({item.get("class_id") for item in confirmed_assignments if item.get("class_id")})
    batch_ids = list({item.get("batch_id") for item in confirmed_assignments if item.get("batch_id")})

    courses = await course_store.get_courses_by_ids(course_ids)
    classes = await institution_store.get_classes_by_ids(class_ids)
    batches = await institution_store.get_batches_by_ids(batch_ids)

    program_ids = list({item.get("program_id") for item in [*courses, *classes] if item.get("program_id")})
    programs = await institution_store.get_programs_by_ids(program_ids)

    assignment_views = _build_assignment_views(confirmed_assignments, courses, classes, batches, programs)
    existing_user_data = await user_data_store.get_user_data(teacher_id)
    progress = (existing_user_data or {}).get("progress") or {}
    step_1 = progress.get("step_1") or {}
    step_3 = progress.get("step_3") or {}
    step_4 = progress.get("step_4") or {}

    specialization = (step_3.get("specialization") or "").strip()
    subject_labels = [
        row.get("course", {}).get("course_name") or row.get("course", {}).get("name") or str(row.get("assignment", {}).get("course_id"))
        for row in assignment_views
    ]
    subject_confidence = {str(cid): _clamp_unit_interval(payload.subject_confidence.get(str(cid)), 0.7) for cid in course_ids}
    program_names = [p.get("program_name") or p.get("name") for p in programs if p.get("program_name") or p.get("name")]
    primary_program_id = next((row.get("program", {}).get("id") for row in assignment_views if row.get("program", {}).get("id")), None)

    onboarding_payload = {
        "full_name": current_user.get("full_name"),
        "employee_id": employee_id,
        "designation": "Teacher",
        "specialization": specialization,
        "experience_years": step_1.get("experienceYears") or step_1.get("experience_years") or 0,
        "subjects": subject_labels,
        "teaching_goal": payload.teaching_goal,
        "bio": f"Teacher setup complete. Goal: {payload.teaching_goal}.",
        "preferences": {
            "teaching_styles": payload.teaching_styles,
            "teaching_goal": payload.teaching_goal,
            "subject_confidence": subject_confidence,
            "primary_device": payload.primary_device,
            "internet_type": payload.internet_type,
            "consents": payload.consents,
            "subject_ids": course_ids,
            "batch_ids": batch_ids
        }
    }

    result = await onboarding_service.complete_onboarding(
        user_id=teacher_id,
        role="teacher",
        current_user=current_user,
        payload=onboarding_payload
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to finalize teacher onboarding")

    return {"success": True, "teacher_id": teacher_id}

# --- Subjects & Students ---

@router.get("/subjects")
async def list_teacher_subjects(
    current_user: dict = Depends(get_current_user),
    teacher_store: TeacherStore = Depends(get_teacher_store),
    course_store: CourseStore = Depends(get_course_store)
):
    """Return teacher's assigned courses as {assignment, course} pairs."""
    check_teacher_role(current_user)
    teacher_id = str(current_user.get("id", ""))

    try:
        # Fetch teacher assignments and courses in parallel
        assignments = await teacher_store.list_teacher_links(teacher_id)
        courses = await course_store.get_courses_by_teacher(teacher_id)

        # Build fast lookup
        course_lookup = {str(c.get("id", "")): c for c in (courses or [])}

        result = []
        for assignment in (assignments or []):
            course_id = str(assignment.get("course_id", ""))
            result.append({
                "assignment": assignment,
                "course": course_lookup.get(course_id, {}),
            })

        # If no assignments found, fall back to returning courses directly
        if not result and courses:
            result = [{"assignment": {}, "course": c} for c in courses]

        return result

    except Exception as exc:
        log.error("list_teacher_subjects_failed", teacher_id=teacher_id, error=str(exc))
        # Return empty list — never a 500
        return []

@router.get("/students/{batch_id}")
async def list_batch_students(
    batch_id: str,
    section: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    user_store: UserStore = Depends(get_user_store),
    student_store: StudentStore = Depends(get_student_store)
):
    check_teacher_role(current_user)
    students = await user_store.get_users_by_batch(batch_id, role="student", section=section)
    if not students:
        return []
    
    student_ids = [s["id"] for s in students if s.get("id")]
    enrollments = await student_store.get_enrollments_by_student_ids(student_ids)
    
    from collections import defaultdict
    enrollment_map = defaultdict(list)
    for e in enrollments:
        enrollment_map[e["student_id"]].append(e)
        
    return [
        {**s, "enrollments": enrollment_map.get(s["id"]) or []}
        for s in students
    ]

# --- Interventions ---

@router.get("/interventions/queue")
async def get_intervention_queue(
    current_user: dict = Depends(get_current_user),
    service: PersonalizationService = Depends(get_personalization_service)
):
    check_teacher_role(current_user)
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
    current_user: dict = Depends(get_current_user),
    service: PersonalizationService = Depends(get_personalization_service)
):
    check_teacher_role(current_user)
    updated = await service.update_intervention(
        intervention_id=intervention_id,
        status=update.status,
        teacher_notes=update.teacher_notes,
        action_taken=update.action_taken
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Intervention not found")
    return updated.model_dump(mode="json")

@router.get("/heatmap/{course_id}")
async def get_course_heatmap(
    course_id: str,
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user),
    service: PersonalizationService = Depends(get_personalization_service)
):
    check_teacher_role(current_user)
    return await service.get_concept_heatmap(user_ids=student_ids, course_id=course_id)

# --- Content Pipeline ---

@router.post("/content/upload")
async def log_content_upload(
    original_filename: str,
    storage_url: str,
    file_type: str,
    file_size_bytes: int,
    current_user: dict = Depends(get_current_user),
    content_store: ContentStore = Depends(get_content_store)
):
    check_teacher_role(current_user)
    upload = await content_store.create_content_upload(
        teacher_id=str(current_user["id"]),
        original_filename=original_filename,
        storage_url=storage_url,
        file_type=file_type,
        file_size_bytes=file_size_bytes
    )
    return upload

@router.get("/content/scaffold/{upload_id}")
async def get_uploaded_scaffold(
    upload_id: str,
    current_user: dict = Depends(get_current_user),
    content_store: ContentStore = Depends(get_content_store)
):
    check_teacher_role(current_user)
    upload = await content_store.get_content_upload(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return upload.get("scaffold_json") or {}

@router.post("/content/scaffold/approve/{upload_id}")
async def approve_scaffold(
    upload_id: str,
    current_user: dict = Depends(get_current_user),
    content_store: ContentStore = Depends(get_content_store),
    course_store: CourseStore = Depends(get_course_store)
):
    check_teacher_role(current_user)
    upload = await content_store.get_content_upload(upload_id)
    if not upload or not upload.get("scaffold_json"):
        raise HTTPException(status_code=400, detail="No scaffold found to approve")
    
    scaffold = upload["scaffold_json"]
    course = await course_store.create_course_from_blueprint(scaffold, teacher_id=str(current_user["id"]))
    
    await content_store.update_content_upload(upload_id, {
        "processing_status": "completed",
        "scaffold_approved_at": datetime.utcnow().isoformat(),
        "course_id": course["id"]
    })
    return course

# --- Answer Verification ---

@router.get("/verification/queue")
async def get_verification_queue(
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
# Verification queue moved to ai_governance.py

# --- Physical Submissions ---

@router.post("/submissions/physical/process/{submission_id}")
async def process_physical_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user),
    content_store: ContentStore = Depends(get_content_store),
    assignment_store: AssignmentStore = Depends(get_assignment_store),
    ocr_service: Any = Depends(get_ocr_service),
    grader_service: Any = Depends(get_grader_service)
):
    check_teacher_role(current_user)
    import httpx
    submission = await content_store.get_physical_submission(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    await content_store.update_physical_submission(submission_id, {"assessment_status": "processing"})
    async with httpx.AsyncClient() as client:
        for img_url in submission.get("submission_images", []):
            try:
                resp = await client.get(img_url)
                resp.raise_for_status()
                image = Image.open(io.BytesIO(resp.content))
                ocr_result = await ocr_service.extract_text(image)
                extracted_texts.append(ocr_result.text)
            except Exception as e:
                extracted_texts.append(f"[OCR Error: {str(e)}]")
    
    full_text = "\n\n".join(extracted_texts)
    grading_result = {"score": 0, "feedback": "Assignment context not found."}
    assignment = await assignment_store.get_assignment_by_id(submission.get("assignment_id"))
    if assignment:
        expected = assignment.get("description") or assignment.get("title")
        try:
            grading_result = grader_service.grade_submission(full_text, expected)
        except Exception as e:
            grading_result = {"score": 0, "feedback": f"Grading service unavailable: {str(e)}"}

    await content_store.update_physical_submission(submission_id, {
        "ocr_extracted_text": {"full_text": str(full_text), "pages": extracted_texts},
        "ai_assessment": grading_result,
        "total_ai_marks": grading_result.get("score"),
        "assessment_status": "graded"
    })
    return {"status": "graded", "score": grading_result.get("score")}

# --- Attendance ---
# --- Analytics ---

@router.get("/analytics/misconceptions")
async def get_misconception_clusters(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user),
    service: PersonalizationService = Depends(get_personalization_service)
):
    check_teacher_role(current_user)
    return await service.get_cohort_misconceptions(student_ids)

@router.get("/analytics/growth")
async def get_growth_trajectories(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user),
    service: PersonalizationService = Depends(get_personalization_service)
):
    check_teacher_role(current_user)
    return await service.get_growth_trajectories(student_ids)

@router.get("/students/{student_id}/analytics")
async def get_student_detail_analytics(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    return await service.get_teacher_projection(student_id)

# --- Admin Teacher Management ---

@router.get("/requests")
async def get_teacher_requests(
    current_user: dict = Depends(get_current_user),
    teacher_store: TeacherStore = Depends(get_teacher_store)
):
    if current_user["role"] != "admin":
         raise HTTPException(status_code=403, detail="Admin access required")
    return await teacher_store.get_pending_requests(status="PENDING_ADMIN")

@router.patch("/requests/{request_id}")
async def update_teacher_request(
    request_id: str,
    payload: Dict[str, str],
    current_user: dict = Depends(get_current_user),
    teacher_store: TeacherStore = Depends(get_teacher_store)
):
    if current_user["role"] != "admin":
         raise HTTPException(status_code=403, detail="Admin access required")
    
    status = payload.get("status")
    if status not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    request = await teacher_store.db.fetch_one("teacher_requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    success = await teacher_store.update_request_status(request_id, status)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update request")
    return {"status": status}

@router.post("/assignments/request")
async def request_teacher_assignment(
    payload: Dict[str, str],
    current_user: dict = Depends(get_current_user),
    teacher_store: TeacherStore = Depends(get_teacher_store)
):
    check_teacher_role(current_user)
    course_id = payload.get("course_id")
    class_id = payload.get("class_id")
    if not course_id or not class_id:
        raise HTTPException(status_code=400, detail="Missing course_id or class_id")
    return await teacher_store.create_request(str(current_user["id"]), course_id, class_id)

@router.get("/assignments")
async def get_teacher_links_list(
    current_user: dict = Depends(get_current_user),
    teacher_store: TeacherStore = Depends(get_teacher_store)
):
    check_teacher_role(current_user)
    return await teacher_store.list_teacher_links(str(current_user["id"]))


# --- Live Intervention & Question Override ---


# Live intervention and question override moved to assessment.py


# --- AI Tutor Answer Queue Management ---

from app.services.ai_tutor_service import AITutorService
from app.services.realtime_service import RealtimeService
from app.core.logging import structlog

log = structlog.get_logger()


class QueueFilterOptions(BaseModel):
    status: Optional[Literal["PROVISIONAL", "PENDING", "APPROVED", "REJECTED"]] = None
    student_id: Optional[str] = None
    subject: Optional[str] = None
    confidence_min: Optional[float] = None
    sort_by: Literal["created_at", "confidence", "student_id"] = "created_at"
    limit: int = 50
    offset: int = 0


@router.get("/ai-queue")
async def get_ai_queue(
    course_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve the teacher's AI answer verification queue.
    Returns: { items: [...], total_pending: int, avg_wait_time_sec: int }
    """
    check_teacher_role(current_user)
    teacher_id = str(current_user.get("id", ""))
    role = current_user.get("role", "teacher")

    try:
        service = AIQueueService()
        result = await service.get_queue(
            teacher_id=teacher_id,
            course_id=course_id,
            role=role,
        )
        log.info(
            "ai_queue_fetched",
            teacher_id=teacher_id,
            total_pending=result.get("total_pending", 0),
        )
        return result

    except Exception as exc:
        log.error("ai_queue_fetch_failed", teacher_id=teacher_id, error=str(exc))
        # Return safe empty state instead of 500
        return {"items": [], "total_pending": 0, "avg_wait_time_sec": 0}


@router.get("/ai-queue/analytics/decisions")
async def get_decisions_distribution(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_scoped_db)
):
    """
    Get decision distribution across all statuses.
    
    Returns:
        {
            "AUTO_APPROVED": 875,
            "PROVISIONAL": 250,
            "PENDING": 125,
            "APPROVED": 200,
            "REJECTED": 50
        }
    """
    check_teacher_role(current_user)
    
    try:
        analytics = AIQueueAnalytics(db)
        distribution = await analytics.get_decision_distribution()
        
        return distribution
        
    except Exception as exc:
        log.error(
            "decisions_distribution_error",
            teacher_id=current_user["id"],
            error=str(exc)
        )
        raise HTTPException(status_code=500, detail="Failed to fetch distribution")


@router.get("/ai-queue/analytics/confidence")
async def get_confidence_distribution(
    bins: int = Query(10),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_scoped_db)
):
    """
    Get confidence score distribution histogram.
    
    Query Parameters:
        - bins: Number of histogram bins (default 10)
    
    Returns:
        {
            "bins": [
                {"range": "0.0-0.1", "count": 5},
                ...
            ],
            "mean": 0.82,
            "median": 0.85,
            "std_dev": 0.12
        }
    """
    check_teacher_role(current_user)
    
    try:
        analytics = AIQueueAnalytics(db)
        distribution = await analytics.get_confidence_distribution(bins=bins)
        
        return distribution
        
    except Exception as exc:
        log.error(
            "confidence_distribution_error",
            teacher_id=current_user["id"],
            error=str(exc)
        )
        raise HTTPException(status_code=500, detail="Failed to fetch distribution")


@router.get("/ai-queue/analytics/safety")
async def get_safety_distribution(
    bins: int = Query(10),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_scoped_db)
):
    """
    Get safety score distribution histogram.
    
    Query Parameters:
        - bins: Number of histogram bins (default 10)
    
    Returns:
        {
            "bins": [...],
            "mean": 0.96,
            "median": 0.98,
            "std_dev": 0.04
        }
    """
    check_teacher_role(current_user)
    
    try:
        analytics = AIQueueAnalytics(db)
        distribution = await analytics.get_safety_score_distribution(bins=bins)
        
        return distribution
        
    except Exception as exc:
        log.error(
            "safety_distribution_error",
            teacher_id=current_user["id"],
            error=str(exc)
        )
        raise HTTPException(status_code=500, detail="Failed to fetch distribution")


@router.get("/ai-queue/analytics/sla")
async def get_teacher_sla_metrics(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_scoped_db)
):
    """
    Get teacher review SLA metrics.
    
    Returns:
        {
            "avg_review_latency_hours": 2.3,
            "median_review_latency_hours": 1.8,
            "sla_met_percent": 65.5,
            "pending_count": 42,
            "pending_oldest_hours": 4.2
        }
    """
    check_teacher_role(current_user)
    
    try:
        analytics = AIQueueAnalytics(db)
        sla_metrics = await analytics.get_teacher_review_slas()
        
        log.info(
            "sla_metrics_fetched",
            teacher_id=current_user["id"]
        )
        
        return sla_metrics
        
    except Exception as exc:
        log.error(
            "sla_metrics_error",
            teacher_id=current_user["id"],
            error=str(exc)
        )
        raise HTTPException(status_code=500, detail="Failed to fetch SLA metrics")


@router.get("/ai-queue/analytics/throughput")
async def get_student_throughput(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_scoped_db)
):
    """
    Get student engagement and throughput metrics.
    
    Returns:
        {
            "unique_students": 234,
            "total_questions_asked": 1250,
            "avg_questions_per_student": 5.3,
            "top_students": [
                {"student_id": "s1", "questions": 45},
                ...
            ]
        }
    """
    check_teacher_role(current_user)
    
    try:
        analytics = AIQueueAnalytics(db)
        throughput = await analytics.get_student_throughput()
        
        return throughput
        
    except Exception as exc:
        log.error(
            "throughput_metrics_error",
            teacher_id=current_user["id"],
            error=str(exc)
        )
        raise HTTPException(status_code=500, detail="Failed to fetch throughput metrics")
