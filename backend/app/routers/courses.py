from fastapi import APIRouter, HTTPException, Form, Depends
from app.store.course_store import CourseStore
from app.dependencies import get_course_store
from .auth import get_current_user
from app.core.cache import cached

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


@router.get("/list")
@cached(ttl=300, prefix="courses")  # Cache for 5 minutes
async def list_courses(store: CourseStore = Depends(get_course_store)):
    """
    List all available courses. Seeds default courses if empty.
    """
    courses = await store.list_courses()
    if not courses:
        # Seed defaults
        for c in DEFAULT_COURSES:
            await store.create_course(c["name"], c["code"], c["description"], c["teacher_id"])
        courses = await store.list_courses()
    return courses


@router.post("/create")
async def create_course(
    name: str = Form(...),
    code: str = Form(...),
    description: str = Form(""),
    current_user: dict = Depends(get_current_user),
    store: CourseStore = Depends(get_course_store),
):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create courses")

    try:
        if await store.get_course_by_code(code):
            raise HTTPException(status_code=400, detail="Course code already exists")

        course = await store.create_course(name, code, description, current_user["id"])

        # Invalidate cache when new course is created
        from app.core.cache import invalidate_cache

        await invalidate_cache("courses:*")

        return {"status": "success", "course": course}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
