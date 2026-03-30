import uuid
from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import Optional, List, Any
from app.store.course_store import CourseStore
from app.store.analytics_store import AnalyticsStore
from app.services.personalization_service import get_personalization_service
from app.personalization.schemas import InterventionStatus
from app.dependencies import get_course_store, get_analytics_store
from app.core.cache import cached
from .auth import get_current_user

router = APIRouter()

DEFAULT_COURSES = [
    {
        "name": "Introduction to Calculus",
        "code": "math101",
        "description": "Basic derivatives and integrals",
        "teacher_id": "teacher1",
    },
    {
        "name": "Mechanics",
        "code": "phy101",
        "description": "Newton's laws and motion",
        "teacher_id": "teacher1",
    },
    {
        "name": "Intro to Programming",
        "code": "cs101",
        "description": "Python basics",
        "teacher_id": "teacher1",
    },
    {
        "name": "Neural Networks",
        "code": "ai202",
        "description": "Deep learning fundamentals",
        "teacher_id": "teacher1",
    },
]


class CreateCourseBody(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    code: str
    description: str = ""
    level: Optional[str] = None
    image: Optional[str] = None
    thumbnail: Optional[str] = None
    program_id: Optional[str] = None


class UpdateCourseBody(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    is_published: Optional[bool] = None


class ModuleBody(BaseModel):
    title: str
    description: str = ""


class LessonBody(BaseModel):
    title: str
    content: str = ""
    type: str = "text"


class ModulesUpdateBody(BaseModel):
    modules: List[Any]


class InviteStudentBody(BaseModel):
    email: str


async def _seed_default_courses(store: CourseStore):
    for c in DEFAULT_COURSES:
        await store.create_course(c["name"], c["code"], c["description"], c["teacher_id"])


# ─── Public / General Course Endpoints ─────────────────────────────────────

@router.get("/list")
@cached(ttl=300, prefix="courses")
async def list_courses(store: CourseStore = Depends(get_course_store)):
    """List all available courses. Seeds defaults if empty."""
    courses = await store.list_courses()
    if not courses:
        await _seed_default_courses(store)
        courses = await store.list_courses()
    return courses


@router.get("/")
async def list_courses_root(store: CourseStore = Depends(get_course_store)):
    """Alias: list all available courses."""
    courses = await store.list_courses()
    if not courses:
        await _seed_default_courses(store)
        courses = await store.list_courses()
    return courses


@router.get("/{course_id}")
async def get_course(course_id: str, store: CourseStore = Depends(get_course_store)):
    """Get a specific course by ID."""
    course = await store.get_course_by_id(course_id)
    if not course:
        course = await store.get_course_by_code(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# ─── Teacher-Specific Endpoints ─────────────────────────────────────────────

@router.get("/teacher/dashboard")
async def teacher_dashboard(
    current_user: dict = Depends(get_current_user),
    analytics: AnalyticsStore = Depends(get_analytics_store),
):
    """Teacher dashboard stats with role check"""
    if current_user.get("role") not in ["teacher", "faculty", "admin", "hod"]:
        raise HTTPException(status_code=403, detail="Teacher access required")
    overview = await analytics.get_teacher_dashboard_overview(current_user["id"])
    stats = await analytics.get_teacher_dashboard_stats(current_user["id"])
    personalization = get_personalization_service()

    student_momentum = overview.get("studentMomentum", [])
    student_ids = [item.get("id") for item in student_momentum if item.get("id")]
    profiles = {}
    for student_id in student_ids:
        try:
            profiles[student_id] = await personalization.get_profile(student_id)
        except Exception:
            continue

    for student in student_momentum:
        profile = profiles.get(student.get("id"))
        if not profile:
            continue
        risk_level = profile.risk_summary.risk_level
        student["riskLevel"] = risk_level
        student["riskScore"] = profile.risk_summary.risk_score
        student["weakTopics"] = profile.weak_topics
        misconceptions = profile.misconception_summary.get("labels", {}) if profile.misconception_summary else {}
        sorted_misconceptions = sorted(misconceptions.items(), key=lambda item: item[1], reverse=True)
        student["misconceptions"] = [label for label, _count in sorted_misconceptions[:3]]
        if profile.weak_topics:
            student["focusArea"] = profile.weak_topics[0]
        if risk_level in {"high", "critical"}:
            student["status"] = "needs-attention"
        elif risk_level == "medium":
            student["status"] = "watch"
        else:
            student["status"] = "on-track"

    interventions = await personalization.get_interventions(user_id=None)
    active = [
        item
        for item in interventions
        if item.status in (InterventionStatus.OPEN, InterventionStatus.ACKNOWLEDGED)
        and item.user_id in student_ids
    ]
    student_name_lookup = {item.get("id"): item.get("name") for item in student_momentum}
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    intervention_queue = []
    for item in active:
        profile = profiles.get(item.user_id)
        priority_value = item.priority.value if hasattr(item.priority, "value") else str(item.priority)
        intervention_queue.append(
            {
                "id": item.id,
                "studentId": item.user_id,
                "studentName": student_name_lookup.get(item.user_id, "Student"),
                "riskLevel": profile.risk_summary.risk_level if profile else "medium",
                "topicId": item.topic_id,
                "priority": priority_value,
                "status": item.status.value if hasattr(item.status, "value") else str(item.status),
                "recommendedAction": item.recommended_action,
                "reason": item.reason,
                "confidence": item.confidence,
                "evidence": item.evidence,
                "suggestedMessage": (
                    f"Hi {student_name_lookup.get(item.user_id, 'student')}, "
                    f"let's review {item.topic_id or 'this topic'} together."
                ),
                "misconceptions": profile.misconception_summary.get("recent", []) if profile else [],
                "weakTopics": profile.weak_topics if profile else [],
                "createdAt": item.created_at.isoformat() if hasattr(item.created_at, "isoformat") else item.created_at,
            }
        )

    intervention_queue.sort(
        key=lambda item: (priority_order.get(item["priority"], 99), -(item.get("confidence") or 0))
    )

    heatmap = []
    if student_ids:
        try:
            heatmap = await personalization.get_concept_heatmap(user_ids=student_ids)
        except Exception:
            heatmap = []

    topic_groups = {}
    for student_id, profile in profiles.items():
        for topic in profile.weak_topics[:2]:
            topic_groups.setdefault(topic, []).append(student_id)
    clusters = []
    for topic, group_ids in topic_groups.items():
        if len(group_ids) < 2:
            continue
        clusters.append(
            {
                "topic": topic,
                "students": [
                    {
                        "id": sid,
                        "name": student_name_lookup.get(sid, "Student"),
                    }
                    for sid in group_ids
                ],
                "riskCount": sum(
                    1
                    for sid in group_ids
                    if profiles.get(sid)
                    and profiles[sid].risk_summary.risk_level in {"high", "critical"}
                ),
                "recommendedAction": f"Run a focused small-group session on {topic}.",
            }
        )

    if profiles:
        overview["summary"]["atRiskStudents"] = sum(
            1
            for profile in profiles.values()
            if profile.risk_summary.risk_level in {"high", "critical"}
        )

    return {
        **stats,
        **overview,
        "interventionQueue": intervention_queue,
        "conceptHeatmap": heatmap,
        "supportClusters": clusters,
        "courseCount": overview["summary"]["activeCourses"],
    }


@router.get("/teacher/list")
async def teacher_courses(
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """List courses created by the authenticated teacher."""
    if current_user["role"] not in ("teacher", "faculty", "admin", "hod"):
        raise HTTPException(status_code=403, detail="Teacher access required")
    return await store.get_courses_by_teacher(current_user["id"])


@router.get("/teacher/students")
async def teacher_students(
    current_user: dict = Depends(get_current_user),
    analytics: AnalyticsStore = Depends(get_analytics_store),
):
    """Get students enrolled in the teacher's courses."""
    if current_user["role"] not in ("teacher", "faculty", "admin", "hod"):
        raise HTTPException(status_code=403, detail="Teacher access required")
    snapshot = await analytics.get_teacher_students_snapshot(current_user["id"])
    personalization = get_personalization_service()
    student_ids = [item.get("id") for item in snapshot if item.get("id")]
    profiles = {}
    for student_id in student_ids:
        try:
            profiles[student_id] = await personalization.get_profile(student_id)
        except Exception:
            continue
    for student in snapshot:
        profile = profiles.get(student.get("id"))
        if not profile:
            continue
        student["riskLevel"] = profile.risk_summary.risk_level
        student["riskScore"] = profile.risk_summary.risk_score
        student["weakTopics"] = profile.weak_topics
        misconceptions = profile.misconception_summary.get("labels", {}) if profile.misconception_summary else {}
        sorted_misconceptions = sorted(misconceptions.items(), key=lambda item: item[1], reverse=True)
        student["misconceptions"] = [label for label, _count in sorted_misconceptions[:3]]
    return snapshot


# ─── Course Creation ─────────────────────────────────────────────────────────

@router.post("/create")
async def create_course_form(
    name: str,
    code: str,
    description: str = "",
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Create a course (form-data variant)."""
    if current_user["role"] not in ("super_admin", "hod", "teacher", "faculty"):
        raise HTTPException(status_code=403, detail="Only Faculty, HOD or Admin can create courses")
    if await store.get_course_by_code(code):
        raise HTTPException(status_code=400, detail="Course code already exists")
    course = await store.create_course(
        name=name,
        code=code,
        description=description,
        teacher_id=current_user["id"],
    )
    from app.core.cache import invalidate_cache
    await invalidate_cache("courses:*")
    return {"status": "success", "course": course}


@router.post("/")
async def create_course_json(
    body: CreateCourseBody,
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Create a course (JSON body)."""
    if current_user["role"] not in ("super_admin", "faculty", "hod"):
        raise HTTPException(status_code=403, detail="Only Faculty, HOD or Admin can create courses")
    if await store.get_course_by_code(body.code):
        raise HTTPException(status_code=400, detail="Course code already exists")
    course_name = body.name or body.title
    if not course_name:
        raise HTTPException(status_code=400, detail="Course name is required")

    course = await store.create_course(
        name=course_name,
        code=body.code,
        description=body.description,
        teacher_id=current_user.get("id"),
        difficulty_level=body.level,
        thumbnail_url=body.thumbnail or body.image,
        program_id=body.program_id,
    )
    
    if not course:
        # Fallback if return data is missing due to RLS but insert succeeded
        course = await store.get_course_by_code(body.code)
        
    if not course:
        raise HTTPException(status_code=500, detail="Failed to create course record")

    from app.core.cache import invalidate_cache
    await invalidate_cache("courses:*")
    return course


# ─── Course CRUD ─────────────────────────────────────────────────────────────

@router.patch("/{course_id}")
async def update_course(
    course_id: str,
    body: UpdateCourseBody,
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Update course details."""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    success = await store.update_course(course_id, updates)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"success": True}


@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Delete a course."""
    if current_user["role"] not in ("super_admin", "hod"):
        raise HTTPException(status_code=403, detail="Only HOD or Admin can delete courses")
    success = await store.delete_course(course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"success": True}


@router.post("/{course_id}/publish")
async def publish_course(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Mark a course as published."""
    success = await store.update_course(course_id, {"is_published": True})
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"success": True, "message": "Course published"}


@router.post("/{course_id}/invite")
async def invite_student(
    course_id: str,
    email: Optional[str] = None,
    body: Optional[InviteStudentBody] = Body(default=None),
    current_user: dict = Depends(get_current_user),
):
    """Invite a student to a course by email."""
    if current_user["role"] not in ("teacher", "admin", "hod"):
        raise HTTPException(status_code=403, detail="Only teachers can invite students")

    invite_email = email or (body.email if body else None)
    if not invite_email:
        raise HTTPException(status_code=400, detail="Student email is required")
    
    # Mock Email Sending
    import structlog
    log = structlog.get_logger()
    
    try:
        # In a real app, integrate SES, SendGrid, or simple smtplib here
        log.info("email_sent_successfully", to_email=invite_email, subject=f"Invitation to join course {course_id}", body="Click here to join!")
    except Exception as e:
        log.error("email_send_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to send invitation email")

    return {"success": True, "message": f"Invitation sent to {invite_email}"}


# ─── Module & Lesson Management ──────────────────────────────────────────────

@router.post("/{course_id}/modules")
async def add_module(
    course_id: str,
    body: ModuleBody,
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Add a new module to a course."""
    module = {"id": str(uuid.uuid4()), "title": body.title, "description": body.description, "lessons": []}
    success = await store.add_module(course_id, module)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"success": True, "module": module}


@router.put("/{course_id}/modules")
async def update_modules(
    course_id: str,
    body: ModulesUpdateBody,
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Replace all modules of a course."""
    success = await store.update_modules(course_id, body.modules)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"success": True}


@router.post("/{course_id}/modules/{module_id}/lessons")
async def add_lesson(
    course_id: str,
    module_id: str,
    body: LessonBody,
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Add a lesson to a specific module."""
    course = await store.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    modules = course.get("modules", [])
    lesson = {"id": str(uuid.uuid4()), "title": body.title, "content": body.content, "type": body.type}
    updated = False
    for mod in modules:
        if mod.get("id") == module_id:
            mod.setdefault("lessons", []).append(lesson)
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Module not found")

    await store.update_modules(course_id, modules)
    return {"success": True, "lesson": lesson}


@router.delete("/{course_id}/modules/{module_id}")
async def delete_module(
    course_id: str,
    module_id: str,
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Delete a module from a course."""
    course = await store.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    modules = [m for m in course.get("modules", []) if m.get("id") != module_id]
    await store.update_modules(course_id, modules)
    return {"success": True}


@router.delete("/{course_id}/modules/{module_id}/lessons/{lesson_id}")
async def delete_lesson(
    course_id: str,
    module_id: str,
    lesson_id: str,
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    """Delete a lesson from a module."""
    course = await store.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    modules = course.get("modules", [])
    for mod in modules:
        if mod.get("id") == module_id:
            mod["lessons"] = [l for l in mod.get("lessons", []) if l.get("id") != lesson_id]
            break
    await store.update_modules(course_id, modules)
    return {"success": True}
