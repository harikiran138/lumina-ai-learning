from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import structlog

from app.api.deps import get_current_teacher as get_current_user
from app.store.teacher_store import TeacherStore
from app.database.scoped_db import get_scoped_db

router = APIRouter()
log = structlog.get_logger(__name__)
teacher_store = TeacherStore()

@router.get("/assignments")
async def get_teacher_assignments(
    current_user: dict = Depends(get_current_user)
):
    """Get all courses and classes assigned to the current teacher."""
    db = get_scoped_db(current_user)
    return await teacher_store.get_teacher_assignments(str(current_user["id"]))

@router.post("/assignments/request")
async def request_teacher_assignment(
    payload: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """Request assignment to a new course/class."""
    db = get_scoped_db(current_user)
    course_id = payload.get("course_id")
    class_id = payload.get("class_id")
    if not course_id or not class_id:
        raise HTTPException(status_code=400, detail="Missing course_id or class_id")
    return await teacher_store.create_request(str(current_user["id"]), course_id, class_id)

@router.get("/requests")
async def get_pending_faculty_requests(
    current_user: dict = Depends(get_current_user)
):
    """Admin only: list pending faculty assignment requests."""
    if current_user["role"] != "admin":
         raise HTTPException(status_code=403, detail="Admin access required")
    return await teacher_store.get_pending_requests(status="PENDING_ADMIN")
