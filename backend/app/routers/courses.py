from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
import structlog

from app.api.deps import get_current_college_admin
from app.store.course_store import CourseStore
from app.store.institution_store import InstitutionStore
from app.database.scoped_db import get_scoped_db

router = APIRouter()
log = structlog.get_logger(__name__)

def is_admin(current_user: dict = Depends(get_current_college_admin)):
    if not current_user.get("two_factor_enabled"):
        log.warning("admin_access_without_2fa", user_id=current_user.get("id"))
    return current_user

@router.get("/")
async def get_all_courses(admin: dict = Depends(is_admin)):
    """List courses scoped to the institution."""
    db = get_scoped_db(admin)
    course_store = CourseStore(db=db)
    return await course_store.list_courses()

@router.get("/{course_id}")
async def get_course_details(course_id: str, admin: dict = Depends(is_admin)):
    """Get details for a specific course."""
    db = get_scoped_db(admin)
    course_store = CourseStore(db=db)
    course = await course_store.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
