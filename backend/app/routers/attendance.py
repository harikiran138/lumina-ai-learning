from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime
import structlog

from app.api.deps import get_current_teacher as get_current_user
from app.database.scoped_db import get_scoped_db

router = APIRouter()
log = structlog.get_logger(__name__)

@router.post("/mark")
async def mark_attendance(
    records: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    """Mark attendance for a batch/section."""
    db = get_scoped_db(current_user)
    if not records:
        raise HTTPException(status_code=400, detail="No attendance records provided")
    
    first = records[0]
    course_id = first.get("course_id")
    batch_id = first.get("batch_id")
    section = first.get("section")
    class_date = first.get("class_date", datetime.utcnow().strftime("%Y-%m-%d"))

    if not all([course_id, batch_id, section]):
        raise HTTPException(status_code=400, detail="Missing required session fields")

    session_data = {
        "course_id": course_id,
        "teacher_id": str(current_user["id"]),
        "batch_id": batch_id,
        "section": section,
        "class_date": class_date,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    session_res = db.table("attendance_sessions").upsert(
        session_data, 
        on_conflict="course_id,batch_id,section,class_date"
    ).execute()
    
    if not session_res.data:
        raise HTTPException(status_code=500, detail="Failed to create attendance session")
    
    session_id = session_res.data[0]["id"]
    normalized_records = [{
        "session_id": session_id,
        "student_id": r.get("student_id"),
        "is_present": bool(r.get("is_present", False)),
        "created_at": datetime.utcnow().isoformat(),
    } for r in records]

    response = db.table("attendance_records").upsert(
        normalized_records, 
        on_conflict="session_id,student_id"
    ).execute()
    
    return {"created": len(response.data or []), "session_id": session_id}
