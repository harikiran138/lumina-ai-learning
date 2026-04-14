from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.api.deps import get_current_active_user, get_current_teacher, get_current_hod
from app.database.supabase_manager import supabase_db
from app.dependencies import get_content_store
from app.database.scoped_db import get_scoped_db
from pydantic import BaseModel

router = APIRouter()

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
    offset: int = 0
):
    """
    Teacher/HOD can monitor real-time AI interactions.
    """
    client = supabase_db.get_client()
    
    # In a real system, we'd filter by department/institution for HOD
    # For now, we fetch latest interactions
    query = client.table("ai_answer_queue").select("*, users(full_name, email)").order("created_at", desc=True).limit(limit).execute()
    
    rows = query.data or []
    results = []
    for row in rows:
        student = row.get("users", {})
        # Simple rule-based flagging for the "Governance Flags" requirement
        flags = []
        answer = str(row.get("ai_generated_answer") or "").lower()
        question = str(row.get("student_question") or "").lower()
        
        if "i don't know" in answer or "i'm not sure" in answer or "unclear" in answer:
            flags.append("Confused")
        if any(word in question for word in ["solve this for me", "write my assignment", "cheat", "answer for my test"]):
            flags.append("Academic Integrity Risk")
        if row.get("request_mode") == "off_topic" or "sorry, i can only" in answer:
            flags.append("Off-topic")
            
        results.append({
            "id": row.get("id"),
            "student_name": student.get("full_name") or student.get("email") or "Student",
            "question": row.get("student_question"),
            "answer": row.get("teacher_edited_answer") or row.get("ai_generated_answer"),
            "topic": row.get("question_topic") or "General",
            "timestamp": row.get("created_at"),
            "flags": flags
        })
        
    return results

@router.get("/kpis")
async def get_institutional_ai_kpis(current_user: dict = Depends(get_current_hod)):
    """
    Aggregated KPIs for HOD/Admin.
    """
    client = supabase_db.get_client()
    
    # Mocking aggregated stats since we'd need heavy SQL/Views for real data
    # In production, these would come from StudentKPIProfile table or Analytics DB
    
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
    current_user: dict = Depends(get_current_teacher)
):
    """
    Allow teacher to 'take over' or correct an AI response retrospectively.
    """
    client = supabase_db.get_client()
    
    update_res = client.table("ai_answer_queue").update({
        "teacher_edited_answer": correction,
        "reviewed_by": current_user.get("id"),
        "status": "teacher_corrected",
        "verified_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", interaction_id).execute()
    
    if not update_res.data:
        raise HTTPException(status_code=404, detail="Interaction not found")
        
    return {"message": "Intervention recorded. Student will see the corrected answer."}

# ---------------------------------------------------------------------------
# Human-in-the-loop Verification
# ---------------------------------------------------------------------------

@router.get("/verification/queue")
async def get_verification_queue(
    current_user: dict = Depends(get_current_teacher),
    content_store: Any = Depends(get_content_store)
):
    """Get the queue of student questions requiring teacher verification."""
    return await content_store.get_verification_queue(str(current_user["id"]))

@router.patch("/verification/queue/{item_id}")
async def update_verification_answer(
    item_id: str,
    status: str,
    teacher_edited_answer: Optional[str] = None,
    current_user: dict = Depends(get_current_teacher),
    content_store: Any = Depends(get_content_store)
):
    """Approve or correct an AI-generated answer in the verification queue."""
    updated = await content_store.update_verification_status(item_id, status, teacher_edited_answer)
    if not updated:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return updated
