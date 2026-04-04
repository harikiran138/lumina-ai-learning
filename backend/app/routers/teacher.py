from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.services.personalization_service import get_personalization_service
from app.services.onboarding_service import OnboardingService
from app.personalization.schemas import InterventionUpdateRequest, InterventionStatus, InterventionPriority
from app.api.deps import get_current_teacher as get_current_user
from app.store.content_store import ContentStore
from app.store.course_store import CourseStore
from app.store.assignment_store import AssignmentStore
from app.store.teacher_store import TeacherStore
from app.services.ocr_service import ocr_service
from app.services.grader_service import grader_service
from app.database.scoped_db import get_scoped_db

router = APIRouter()
content_store = ContentStore()
course_store = CourseStore()
assignment_store = AssignmentStore()
teacher_store = TeacherStore()

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
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    db = get_scoped_db(current_user)
    teacher_id = str(current_user.get("id"))

    # Assignments / courses the teacher owns
    assignments = await db.fetch_all("teacher_assignments", {"teacher_id": teacher_id})
    course_ids = list({item.get("course_id") for item in assignments if item.get("course_id")})
    class_ids  = list({item.get("class_id")  for item in assignments if item.get("class_id")})

    courses_data: List[Dict[str, Any]] = []
    if course_ids:
        courses_data = db.table("courses").select("*").in_("id", course_ids).execute().data or []

    # Student headcount
    total_students = 0
    if class_ids:
        for class_id in class_ids:
            rows = await db.fetch_all("student_enrollments", {"class_id": class_id})
            total_students += len(rows or [])

    # Pending submissions
    pending_submissions = await db.fetch_all("assignment_submissions", {"status": "submitted"}) or []
    pending_count = len(pending_submissions)

    # At-risk interventions
    active_alerts: List[Dict[str, Any]] = []
    try:
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
    except Exception:
        active_alerts = []

    published = sum(1 for c in courses_data if c.get("status") != "draft")
    draft     = len(courses_data) - published

    course_cards = [
        {
            "id":          str(c.get("id")),
            "title":       c.get("course_name") or c.get("name") or c.get("title") or "Untitled Course",
            "code":        c.get("course_code") or c.get("code") or "",
            "description": c.get("description") or "",
            "status":      c.get("status") or "active",
            "students":    0,
        }
        for c in courses_data
    ]

    return {
        "summary": {
            "totalStudents":        total_students,
            "activeCourses":        published,
            "avgMastery":           0,
            "pendingGrading":       pending_count,
            "atRiskStudents":       len(active_alerts),
            "upcomingDeadlines":    0,
            "pendingAIVerifications": 0,
        },
        "courses": course_cards,
        "weeklySnapshot": {
            "publishedCourses":    published,
            "draftCourses":        draft,
            "assignmentsCreated":  0,
            "submissionsReceived": pending_count,
        },
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
async def get_teacher_onboarding_options(current_user: dict = Depends(get_current_user)):
    check_teacher_role(current_user)

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
async def complete_teacher_onboarding(
    payload: TeacherOnboardingCompleteRequest,
    current_user: dict = Depends(get_current_user),
):
    check_teacher_role(current_user)

    required_consents = ("teacherVerifiedAi", "academicIntegrity", "dataPolicy")
    if not all(payload.consents.get(key) is True for key in required_consents):
        raise HTTPException(status_code=400, detail="All mandatory teacher consents must be accepted")
    if not payload.teaching_styles:
        raise HTTPException(status_code=400, detail="Select at least one teaching preference")

    teacher_id = str(current_user.get("id"))
    employee_id = current_user.get("employee_id")
    db = get_scoped_db(current_user)
    
    assignments = await db.fetch_all("teacher_assignments", {"teacher_id": teacher_id})
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

    courses = db.table("courses").select("*").in_("id", course_ids).execute().data or [] if course_ids else []
    classes = db.table("classes").select("*").in_("id", class_ids).execute().data or [] if class_ids else []
    batches = db.table("batches").select("*").in_("id", batch_ids).execute().data or [] if batch_ids else []

    program_ids = list({item.get("program_id") for item in [*courses, *classes] if item.get("program_id")})
    programs = db.table("programs").select("*").in_("id", program_ids).execute().data or [] if program_ids else []

    assignment_views = _build_assignment_views(confirmed_assignments, courses, classes, batches, programs)
    existing_user_data = await db.fetch_one("user_data", {"user_id": teacher_id})
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

    onboarding_service = OnboardingService(db=db)
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
async def list_teacher_subjects(current_user: dict = Depends(get_current_user)):
    check_teacher_role(current_user)
    db = get_scoped_db(current_user)
    assignments = await db.fetch_all("teacher_assignments", {"teacher_id": current_user.get("id")})
    if not assignments:
        return []
    course_ids = list({item.get("course_id") for item in assignments if item.get("course_id")})
    courses = db.table("courses").select("*").in_("id", course_ids).execute().data or [] if course_ids else []
    course_lookup = {c["id"]: c for c in courses}
    return [{"assignment": a, "course": course_lookup.get(a.get("course_id"))} for a in assignments]

@router.get("/students/{batch_id}")
async def list_batch_students(
    batch_id: str,
    section: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    check_teacher_role(current_user)
    db = get_scoped_db(current_user)
    filters = {"batch_id": batch_id, "role": "student"}
    if section:
        filters["section"] = section
    students = await db.fetch_all("users", filters)
    enriched = []
    for student in students:
        enrollments = await db.fetch_all("student_enrollments", {"student_id": student.get("id")})
        enriched.append({**student, "enrollments": enrollments or []})
    return enriched

# --- Interventions ---

@router.get("/interventions/queue")
async def get_intervention_queue(
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
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
    check_teacher_role(current_user)
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

@router.get("/heatmap/{course_id}")
async def get_course_heatmap(
    course_id: str,
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    return await service.get_concept_heatmap(user_ids=student_ids, course_id=course_id)

# --- Content Pipeline ---

@router.post("/content/upload")
async def log_content_upload(
    original_filename: str,
    storage_url: str,
    file_type: str,
    file_size_bytes: int,
    current_user: dict = Depends(get_current_user)
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
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    upload = await content_store.get_content_upload(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return upload.get("scaffold_json") or {}

@router.post("/content/scaffold/approve/{upload_id}")
async def approve_scaffold(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
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
    return await content_store.get_verification_queue(str(current_user["id"]))

@router.patch("/verification/queue/{item_id}")
async def update_verification_answer(
    item_id: str,
    status: str,
    teacher_edited_answer: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    updated = await content_store.update_verification_status(item_id, status, teacher_edited_answer)
    if not updated:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return updated

# --- Physical Submissions ---

@router.post("/submissions/physical/process/{submission_id}")
async def process_physical_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    submission = await content_store.get_physical_submission(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    await content_store.update_physical_submission(submission_id, {"assessment_status": "processing"})
    extracted_texts = []
    for img_url in submission.get("submission_images", []):
        try:
            text = ocr_service.digitize_image(img_url)
            extracted_texts.append(text)
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

@router.post("/attendance/mark")
async def mark_attendance(
    records: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    db = get_scoped_db(current_user)
    if not records:
        raise HTTPException(status_code=400, detail="No attendance records provided")
    
    first = records[0]
    course_id = first.get("course_id")
    batch_id = first.get("batch_id")
    section = first.get("section")
    class_date = first.get("class_date", datetime.utcnow().strftime("%Y-%m-%d"))

    if not all([course_id, batch_id, section]):
        raise HTTPException(status_code=400, detail="Missing required session fields")

    session_data = {
        "course_id": course_id,
        "teacher_id": str(current_user["id"]),
        "batch_id": batch_id,
        "section": section,
        "class_date": class_date,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    session_res = db.table("attendance_sessions").upsert(session_data, on_conflict="course_id,batch_id,section,class_date").execute()
    if not session_res.data:
        raise HTTPException(status_code=500, detail="Failed to create attendance session")
    
    session_id = session_res.data[0]["id"]
    normalized_records = [{
        "session_id": session_id,
        "student_id": r.get("student_id"),
        "is_present": bool(r.get("is_present", False)),
        "created_at": datetime.utcnow().isoformat(),
    } for r in records]

    response = db.table("attendance_records").upsert(normalized_records, on_conflict="session_id,student_id").execute()
    return {"created": len(response.data or []), "session_id": session_id}

# --- Analytics ---

@router.get("/analytics/misconceptions")
async def get_misconception_clusters(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    return await service.get_cohort_misconceptions(student_ids)

@router.get("/analytics/growth")
async def get_growth_trajectories(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
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
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
         raise HTTPException(status_code=403, detail="Admin access required")
    return await teacher_store.get_pending_requests(status="PENDING_ADMIN")

@router.patch("/requests/{request_id}")
async def update_teacher_request(
    request_id: str,
    payload: Dict[str, str],
    current_user: dict = Depends(get_current_user)
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
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    course_id = payload.get("course_id")
    class_id = payload.get("class_id")
    if not course_id or not class_id:
        raise HTTPException(status_code=400, detail="Missing course_id or class_id")
    return await teacher_store.create_request(str(current_user["id"]), course_id, class_id)

@router.get("/assignments")
async def get_teacher_assignments(
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    return await teacher_store.get_teacher_assignments(str(current_user["id"]))
