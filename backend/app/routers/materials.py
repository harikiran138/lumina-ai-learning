from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from datetime import datetime

from .auth import get_current_user
from app.database.scoped_db import get_scoped_db

router = APIRouter()


def _require_staff(user: dict):
    if user.get("role") not in {"teacher", "faculty", "hod", "admin", "college_admin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Staff access required")


async def _ensure_course_access(user: dict, course_id: str, db: Any):
    course = await db.fetch_one("courses", {"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    role = user.get("role")
    if role in {"super_admin", "admin", "college_admin"}:
        return course

    if role in {"teacher", "faculty", "hod"}:
        if user.get("department_id") and course.get("department_id") != user.get("department_id"):
            raise HTTPException(status_code=403, detail="Outside department scope")
    if role == "student":
        if user.get("department_id") and course.get("department_id") != user.get("department_id"):
            raise HTTPException(status_code=403, detail="Outside department scope")
    return course


@router.post("/materials")
async def create_material(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    _require_staff(current_user)
    db = get_scoped_db(current_user)
    
    course_id = payload.get("course_id")
    if not course_id:
        raise HTTPException(status_code=400, detail="Missing course_id")
    await _ensure_course_access(current_user, course_id, db)

    data = {
        "course_id": course_id,
        "teacher_id": current_user.get("id"),
        "title": payload.get("title"),
        "type": payload.get("type") or "notes",
        "file_url": payload.get("file_url"),
        "link_url": payload.get("link_url"),
        "created_at": datetime.utcnow().isoformat(),
    }
    if not data.get("title"):
        raise HTTPException(status_code=400, detail="Missing title")
    return await db.insert("course_materials", data)


@router.get("/materials/{course_id}")
async def list_materials(
    course_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_scoped_db(current_user)
    await _ensure_course_access(current_user, course_id, db)
    return await db.fetch_all("course_materials", {"course_id": course_id})
