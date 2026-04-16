from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.api.deps import get_current_active_user, get_current_teacher, get_current_hod
from app.database.supabase_manager import supabase_db
from app.dependencies import get_content_store
from app.database.scoped_db import get_scoped_db
from pydantic import BaseModel

from app.services.ai_queue_service import AIQueueService

router = APIRouter()

def get_ai_queue_service(db=Depends(get_scoped_db)) -> AIQueueService:
    return AIQueueService(db=db)

class InteractionLogResponse(BaseModel):
    id: str
    student_name: str
    question: str
    answer: str
    topic: Optional[str]
    timestamp: str
    flags: List[str] = []

@router.get("/logs", response_model=List[Dict[str, Any]])
async def get_ai_interaction_logs(
    current_user: dict = Depends(get_current_teacher),
    limit: int = 50,
    ai_queue: AIQueueService = Depends(get_ai_queue_service)
):
    """
    Teacher/HOD can monitor real-time AI interactions.
    """
    # Use service to get all logs (admin view)
    rows = await ai_queue.get_all_for_admin() # Assuming teacher has broad view for their dept for now
    
    results = []
    for row in rows:
        # Simple rule-based flagging for the "Governance Flags" requirement
        flags = []
        answer = str(row.ai_generated_answer or "").lower()
        question = str(row.student_question or "").lower()
        
        if "i don't know" in answer or "i'm not sure" in answer or "unclear" in answer:
            flags.append("Confused")
        if any(word in question for word in ["solve this for me", "write my assignment", "cheat", "answer for my test"]):
            flags.append("Academic Integrity Risk")
        if row.status == "rejected":
            flags.append("Rejected")
            
        results.append({
            "id": row.id,
            "student_name": "Student", # Names enriched in service later if needed
            "question": row.student_question,
            "answer": row.teacher_edited_answer or row.ai_generated_answer,
            "topic": row.course_id or "General",
            "timestamp": row.created_at,
            "flags": flags
        })
        
    return results[:limit]

@router.get("/kpis")
async def get_institutional_ai_kpis(current_user: dict = Depends(get_current_hod)):
    """
    Aggregated KPIs for HOD/Admin.
    """
    return {
        "overall_mastery_gain": "+12.4%",
        "avg_ai_response_time": "1.2s",
        "accuracy_rate": "98.5%",
        "engagement_score": "8.7/10",
        "top_weak_topics": [
            {"topic": "Quantum Mechanics", "count": 45, "trend": "up"},
            {"topic": "Organic Chemistry", "count": 32, "trend": "down"},
            {"topic": "Linear Algebra", "count": 28, "trend": "stable"}
        ],
        "intervention_needed_count": 5
    }

@router.post("/intervene/{interaction_id}")
async def teacher_intervene(
    interaction_id: str,
    correction: str,
    current_user: dict = Depends(get_current_teacher),
    ai_queue: AIQueueService = Depends(get_ai_queue_service)
):
    """
    Allow teacher to 'take over' or correct an AI response retrospectively.
    """
    try:
        updated = await ai_queue.edit_approve_answer(
            question_id=interaction_id,
            teacher_id=str(current_user["id"]),
            final_answer=correction,
            teacher_note="Governance Intervention"
        )
        return {"message": "Intervention recorded. Student will see the corrected answer.", **updated}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# ---------------------------------------------------------------------------
# Human-in-the-loop Verification
# ---------------------------------------------------------------------------

@router.get("/verification/queue")
async def get_verification_queue(
    current_user: dict = Depends(get_current_teacher),
    ai_queue: AIQueueService = Depends(get_ai_queue_service),
    db: Any = Depends(get_scoped_db)
):
    """Get the queue of student questions requiring teacher verification."""
    # Use the centralized teacher queue logic
    return await ai_queue.get_pending_for_teacher(db, str(current_user["id"]), class_id=None)

@router.patch("/verification/queue/{item_id}")
async def update_verification_answer(
    item_id: str,
    status: str,
    teacher_edited_answer: Optional[str] = None,
    current_user: dict = Depends(get_current_teacher),
    ai_queue: AIQueueService = Depends(get_ai_queue_service)
):
    """Approve or correct an AI-generated answer in the verification queue."""
    if status == "approved":
        return await ai_queue.approve_answer(item_id, str(current_user["id"]))
    elif status in {"edited_approved", "rejected"}:
        if status == "rejected":
             return await ai_queue.reject_answer(item_id, str(current_user["id"]), teacher_note="Teacher Rejection")
        return await ai_queue.edit_approve_answer(item_id, str(current_user["id"]), teacher_edited_answer or "")
    
    raise HTTPException(status_code=400, detail="Invalid status")
