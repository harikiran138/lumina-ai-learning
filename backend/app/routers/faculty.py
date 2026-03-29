from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from .auth import get_current_user
from app.database.supabase_manager import supabase_db

router = APIRouter()


def _require_faculty(user: dict):
    if user.get("role") not in {"teacher", "faculty", "hod", "admin", "college_admin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Faculty access required")


@router.get("/faculty/subjects")
async def list_faculty_subjects(current_user: dict = Depends(get_current_user)):
    _require_faculty(current_user)
    assignments = await supabase_db.fetch_all(
        "teacher_assignments",
        {"teacher_id": current_user.get("id")},
    )
    if not assignments:
        return []
    course_ids = list({item.get("course_id") for item in assignments if item.get("course_id")})
    courses = (
        supabase_db.get_client().table("courses").select("*").in_("id", course_ids).execute().data or []
        if course_ids else []
    )
    course_lookup = {c["id"]: c for c in courses}

    results = []
    for assignment in assignments:
        course = course_lookup.get(assignment.get("course_id"))
        results.append({
            "assignment": assignment,
            "course": course,
        })
    return results


@router.get("/faculty/students/{batch_id}")
async def list_batch_students(
    batch_id: str,
    section: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    _require_faculty(current_user)
    filters = {"batch_id": batch_id, "role": "student"}
    if section:
        filters["section"] = section
    return await supabase_db.fetch_all("users", filters)
