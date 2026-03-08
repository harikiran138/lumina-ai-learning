import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Any
from app.store.course_store import CourseStore
from app.store.analytics_store import AnalyticsStore
from app.dependencies import get_course_store
from .auth import get_current_user
from app.core.cache import cached
from app.database.manager import db

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
    name: str
    code: str
    description: str = ""


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
async def teacher_dashboard(current_user: dict = Depends(get_current_user)):
    """Get teacher dashboard stats."""
    if current_user["role"] not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Teacher access required")
    analytics = AnalyticsStore()
    stats = await analytics.get_teacher_dashboard_stats()
    store = CourseStore()
    courses = await store.get_courses_by_teacher(current_user["id"])
    return {
        **stats,
        "courseCount": len(courses),
        "courses": courses,
    }


@router.get("/teacher/list")
async def teacher_courses(current_user: dict = Depends(get_current_user)):
    """List courses created by the authenticated teacher."""
    if current_user["role"] not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Teacher access required")
    store = CourseStore()
    return await store.get_courses_by_teacher(current_user["id"])


@router.get("/teacher/students")
async def teacher_students(current_user: dict = Depends(get_current_user)):
    """Get students enrolled in the teacher's courses."""
    if current_user["role"] not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Teacher access required")
    store = CourseStore()
    courses = await store.get_courses_by_teacher(current_user["id"])
    course_ids = [c.get("id") or c.get("code") for c in courses]

    progress_col = db.get_collection("progress")
    if progress_col is None or not course_ids:
        return []

    cursor = progress_col.find({"courseId": {"$in": course_ids}})
    entries = await cursor.to_list(length=500)

    users_col = db.get_collection("users")
    student_ids = list({e["userId"] for e in entries if "userId" in e})
    students = []
    for sid in student_ids:
        user = await users_col.find_one({"_id": sid})
        if user:
            user["id"] = str(user.pop("_id"))
            user.pop("hashed_password", None)
            students.append(user)
    return students


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
    if current_user["role"] not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can create courses")
    if await store.get_course_by_code(code):
        raise HTTPException(status_code=400, detail="Course code already exists")
    course = await store.create_course(name, code, description, current_user["id"])
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
    if current_user["role"] not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can create courses")
    if await store.get_course_by_code(body.code):
        raise HTTPException(status_code=400, detail="Course code already exists")
    course = await store.create_course(body.name, body.code, body.description, current_user["id"])
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
    if current_user["role"] not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers or admins can delete courses")
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
    email: str,
    current_user: dict = Depends(get_current_user),
):
    """Invite a student to a course by email."""
    if current_user["role"] not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can invite students")
    # Placeholder: real implementation would send email or add enrollment record
    return {"success": True, "message": f"Invitation sent to {email}"}


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
