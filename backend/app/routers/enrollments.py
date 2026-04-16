from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import structlog

from app.api.deps import get_current_student as get_current_student
from app.services import enrollment_service
from app.database.scoped_db import get_scoped_db

router = APIRouter()
log = structlog.get_logger(__name__)

class EnrollmentRequest(BaseModel):
    class_id: str
    semester_id: Optional[str] = None

class LessonCompletionRequest(BaseModel):
    course_id: str
    lesson_id: str

@router.post("/enroll")
async def enroll_in_course(
    request: EnrollmentRequest,
    current_user: dict = Depends(get_current_student),
):
    """Enroll the current student in a class."""
    db = get_scoped_db(current_user)
    try:
        await enrollment_service.enroll_student_in_class(
            db,
            student_id=current_user["id"],
            class_id=request.class_id,
            semester_id=request.semester_id,
        )
    except ValueError as exc:
        log.error("enrollment_failed", student_id=current_user.get("id"), class_id=request.class_id, error=str(exc))
        raise HTTPException(status_code=400, detail=str(exc))

    return {"status": "success", "message": "Enrolled successfully"}

@router.post("/complete-lesson")
async def complete_lesson(
    request: LessonCompletionRequest,
    current_user: dict = Depends(get_current_student),
):
    """Mark a lesson as complete for the student."""
    db = get_scoped_db(current_user)
    result = await enrollment_service.complete_lesson(db, current_user["id"], request.course_id, request.lesson_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to mark lesson as complete")

    return {"status": "success", "message": "Lesson completed"}
