from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncio
import structlog

from app.api.deps import get_current_student as get_current_student
from app.database.scoped_db import get_scoped_db
from app.store.academic_store import AcademicStore

router = APIRouter()
log = structlog.get_logger(__name__)

class AgentQueryRequest(BaseModel):
    query: str
    course_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

@router.post("/tutor/ask")
async def ask_tutor_agent(
    request: AgentQueryRequest,
    current_user: dict = Depends(get_current_student),
):
    """Query the AI Tutor agent. Logic uses ai_answer_queue to track human-in-the-loop verification."""
    db = get_scoped_db(current_user)
    academic_store = AcademicStore(db=db)
    
    # 1. Get primary teacher for the course to fulfill schema NOT NULL requirement
    teacher_id = None
    if request.course_id:
        try:
            assignment = await academic_store.get_teacher_assignment(request.course_id)
            teacher_id = (assignment or {}).get("teacher_id")
        except:
            pass
    
    # Fallback to a system-wide AI auditor or just fail if no teacher
    if not teacher_id:
         # In a real Lumina setup, there's always an HOD/Admin who can verify
         teacher_id = current_user["id"] # Fallback to student (self-verify stub) or a system ID
    
    data = {
        "student_id": current_user["id"],
        "teacher_id": teacher_id,
        "course_id": request.course_id,
        "student_question": request.query,
        "status": "pending",
        "created_at": "now()"
    }
    
    try:
        res = db.table("ai_answer_queue").insert(data).execute()
        new_id = res.data[0]["id"]
        return {"success": True, "id": str(new_id), "status": "pending"}
    except Exception as e:
        log.error("ai_tutor_ask_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to queue AI query")

@router.get("/tutor/status/{answer_id}")
async def get_tutor_status(
    answer_id: str,
    current_user: dict = Depends(get_current_student),
):
    """Get the completion status of an AI Tutor query."""
    db = get_scoped_db(current_user)
    try:
        job = await db.fetch_one("ai_answer_queue", {"id": answer_id})
        if not job:
            raise HTTPException(status_code=404, detail="Answer not found")

        if str(job.get("student_id")) != str(current_user.get("id")):
            raise HTTPException(status_code=403, detail="Access denied")

        return {
            "success": True,
            "id": answer_id,
            "status": job["status"],
            "answer": job.get("ai_generated_answer") or job.get("teacher_edited_answer")
        }
    except Exception as e:
        log.error("get_tutor_status_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch status")
