from fastapi import APIRouter, HTTPException, Form, Depends
from typing import List
from store.course_store import CourseStore
from .auth import get_current_user

router = APIRouter()
store = CourseStore()

DEFAULT_COURSES = [
    {"name": "Introduction to Calculus", "code": "math101", "description": "Basic derivatives and integrals", "teacher_id": "teacher1"},
    {"name": "Mechanics", "code": "phy101", "description": "Newton's laws and motion", "teacher_id": "teacher1"},
    {"name": "Intro to Programming", "code": "cs101", "description": "Python basics", "teacher_id": "teacher1"},
    {"name": "Neural Networks", "code": "ai202", "description": "Deep learning fundamentals", "teacher_id": "teacher1"},
]

@router.get("/list")
async def list_courses():
    """
    List all available courses. Seeds default courses if empty.
    """
    courses = store.list_courses()
    if not courses:
        # Seed defaults
        for c in DEFAULT_COURSES:
            store.create_course(c["name"], c["code"], c["description"], c["teacher_id"])
        courses = store.list_courses()
    return courses

@router.post("/create")
async def create_course(
    name: str = Form(...),
    code: str = Form(...),
    description: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create courses")
        
    try:
        if store.get_course_by_code(code):
            raise HTTPException(status_code=400, detail="Course code already exists")
        
        course = store.create_course(name, code, description, current_user["id"])
        return {"status": "success", "course": course}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
