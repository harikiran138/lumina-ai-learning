from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from datetime import datetime

from .auth import get_current_user
from app.database.scoped_db import get_scoped_db

router = APIRouter()


def _require_staff(user: dict):
    if user.get("role") not in {"teacher", "faculty", "hod", "admin", "college_admin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Staff access required")


async def _ensure_assignment(user: dict, course_id: str, batch_id: str, section: str, db: Any):
    if user.get("role") in {"hod", "admin", "college_admin", "super_admin"}:
        return
    assignment = await db.fetch_one(
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
    db = get_scoped_db(current_user)
    
    data_records: List[Dict[str, Any]] = payload.get("records") if isinstance(payload, dict) else payload
    if not data_records:
        raise HTTPException(status_code=400, detail="No attendance records provided")

    # Assuming all records in one batch belong to the same session
    first = data_records[0]
    course_id = first.get("course_id") or first.get("subject_id")
    batch_id = first.get("batch_id")
    section = first.get("section")
    class_date = first.get("class_date")

    if not all([course_id, batch_id, section, class_date]):
        raise HTTPException(status_code=400, detail="Missing required session fields")

    await _ensure_assignment(current_user, course_id, batch_id, section, db)

    # 1. Create or get session
    session_data = {
        "course_id": course_id,
        "teacher_id": current_user.get("id"),
        "batch_id": batch_id,
        "section": section,
        "class_date": class_date,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    session_res = db.table("attendance_sessions").upsert(
        session_data, on_conflict="course_id,batch_id,section,class_date"
    ).execute()
    
    if not session_res.data:
        raise HTTPException(status_code=500, detail="Failed to create attendance session")
    
    session_id = session_res.data[0]["id"]

    # 2. Prepare and upsert records
    normalized_records = []
    for record in data_records:
        normalized_records.append({
            "session_id": session_id,
            "student_id": record.get("student_id"),
            "is_present": bool(record.get("is_present", False)),
            "remark": record.get("remark"),
            "created_at": datetime.utcnow().isoformat(),
        })

    response = db.table("attendance_records").upsert(
        normalized_records, on_conflict="session_id,student_id"
    ).execute()
    
    return {"success": True, "count": len(response.data or []), "session_id": session_id}


@router.get("/attendance/{course_id}")
async def get_course_attendance(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    batch_id: str = None,
    section: str = None,
):
    _require_staff(current_user)
    db = get_scoped_db(current_user)
    
    query = db.table("attendance_sessions").select("*, attendance_records(*)").eq("course_id", course_id)
    if batch_id:
        query = query.eq("batch_id", batch_id)
    if section:
        query = query.eq("section", section)
        
    data = query.execute()
    return data.data or []
