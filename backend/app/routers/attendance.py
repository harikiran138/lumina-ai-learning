from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from datetime import datetime

from .auth import get_current_user
from app.database.supabase_manager import supabase_db

router = APIRouter()


def _require_staff(user: dict):
    if user.get("role") not in {"teacher", "faculty", "hod", "admin", "college_admin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Staff access required")


async def _ensure_assignment(user: dict, course_id: str, batch_id: str, section: str):
    if user.get("role") in {"hod", "admin", "college_admin", "super_admin"}:
        return
    assignment = await supabase_db.fetch_one(
        "teacher_assignments",
        {"teacher_id": user.get("id"), "course_id": course_id, "batch_id": batch_id},
    )
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this batch/course")
    if assignment.get("section") and section and assignment.get("section") != section:
        raise HTTPException(status_code=403, detail="Not assigned to this section")


@router.post("/attendance")
async def mark_attendance(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
):
    _require_staff(current_user)
    records: List[Dict[str, Any]] = payload.get("records") if isinstance(payload, dict) else payload
    if not records:
        raise HTTPException(status_code=400, detail="No attendance records provided")

    normalized = []
    for record in records:
        course_id = record.get("course_id") or record.get("subject_id")
        student_id = record.get("student_id")
        batch_id = record.get("batch_id")
        section = record.get("section")
        class_date = record.get("class_date")
        is_present = record.get("is_present", False)

        if not all([course_id, student_id, batch_id, section, class_date]):
            raise HTTPException(status_code=400, detail="Missing attendance fields")

        await _ensure_assignment(current_user, course_id, batch_id, section)

        normalized.append({
            "course_id": course_id,
            "teacher_id": current_user.get("id"),
            "student_id": student_id,
            "batch_id": batch_id,
            "section": section,
            "class_date": class_date,
            "is_present": bool(is_present),
            "created_at": datetime.utcnow().isoformat(),
        })

    client = supabase_db.get_client()
    response = client.table("attendance").upsert(
        normalized, on_conflict="course_id,student_id,class_date"
    ).execute()
    return {"success": True, "count": len(response.data or [])}


@router.get("/attendance/{course_id}")
async def get_course_attendance(
    course_id: str,
    current_user: dict = Depends(get_current_user),
):
    _require_staff(current_user)
    client = supabase_db.get_client()
    data = client.table("attendance").select("*").eq("course_id", course_id).execute()
    return data.data or []
