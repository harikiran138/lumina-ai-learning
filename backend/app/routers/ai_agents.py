from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncio
import structlog

from app.api.deps import get_current_student as get_current_student
from app.database.scoped_db import get_scoped_db
from app.services.ai_queue_service import AIQueueService

router = APIRouter()
log = structlog.get_logger(__name__)

def get_ai_queue_service(db=Depends(get_scoped_db)) -> AIQueueService:
    return AIQueueService(db=db)

class AgentQueryRequest(BaseModel):
    query: str
    course_id: Optional[str] = None
    class_id: Optional[str] = None # Optional; will be resolved from student enrollment if missing
    context: Optional[Dict[str, Any]] = None

@router.post("/tutor/ask")
async def ask_tutor_agent(
    request: AgentQueryRequest,
    current_user: dict = Depends(get_current_student),
    ai_queue: AIQueueService = Depends(get_ai_queue_service)
):
    """Query the AI Tutor agent. Logic uses AIQueueService to track verification."""
    db = get_scoped_db(current_user)
    academic_store = AcademicStore(db=db)
    
    # 1. Resolve Class ID and Teacher ID
    class_id = request.class_id
    if not class_id:
        enrollment = await academic_store.get_student_enrollment(current_user["id"])
        class_id = enrollment.get("class_id") if enrollment else None
    
    if not class_id:
        raise HTTPException(status_code=400, detail="Student is not enrolled in any class")

    teacher_id = None
    if request.course_id:
        try:
            assignment = await academic_store.get_teacher_assignment(request.course_id)
            teacher_id = (assignment or {}).get("teacher_id")
        except: pass
    
    if not teacher_id:
         # Fallback to HOD or Admin
         department_id = current_user.get("department_id")
         if department_id:
             dept = await academic_store.get_department_by_id(department_id)
             teacher_id = dept.get("hod_id")
    
    if not teacher_id:
        # Final fallback to self (system placeholder)
        teacher_id = current_user["id"]
    
    data = {
        "student_id": current_user["id"],
        "teacher_id": teacher_id,
        "course_id": request.course_id,
        "class_id": class_id,
        "student_question": request.query,
        "status": "pending",
    }
    
    try:
        res = await ai_queue.create_queue_item(data)
        if not res:
            raise ValueError("Failed to create queue item")
            
        return {"success": True, "id": str(res["id"]), "status": "pending"}
    except Exception as e:
        log.error("ai_tutor_ask_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to queue AI query")

@router.get("/tutor/status/{answer_id}")
async def get_tutor_status(
    answer_id: str,
    current_user: dict = Depends(get_current_student),
    ai_queue: AIQueueService = Depends(get_ai_queue_service)
):
    """Get the completion status of an AI Tutor query."""
    try:
        job = await ai_queue.get_item_details(answer_id)
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
