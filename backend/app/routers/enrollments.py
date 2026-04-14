from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import structlog

from app.api.deps import get_current_student as get_current_user
from app.store.student_store import StudentStore
from app.database.scoped_db import get_scoped_db

router = APIRouter()
log = structlog.get_logger(__name__)

class EnrollmentRequest(BaseModel):
    course_id: str

class LessonCompletionRequest(BaseModel):
    course_id: str
    lesson_id: str

@router.post("/enroll")
async def enroll_in_course(
    request: EnrollmentRequest,
    current_user: dict = Depends(get_current_user),
):
    """Enroll the current student in a course."""
    db = get_scoped_db(current_user)
    student_store = StudentStore(db=db)
    success = await student_store.enroll_in_course(current_user["id"], request.course_id)
    if not success:
        log.error("enrollment_failed", student_id=current_user.get("id"), course_id=request.course_id)
        raise HTTPException(status_code=400, detail="Enrollment failed or already enrolled")

    return {"status": "success", "message": "Enrolled successfully"}

@router.post("/complete-lesson")
async def complete_lesson(
    request: LessonCompletionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Mark a lesson as complete for the student."""
    db = get_scoped_db(current_user)
    student_store = StudentStore(db=db)
    result = await student_store.complete_lesson(current_user["id"], request.course_id, request.lesson_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to mark lesson as complete")

    return {"status": "success", "message": "Lesson completed"}
