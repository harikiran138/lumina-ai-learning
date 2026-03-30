from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.routers.auth import get_current_user
from app.store.course_store import CourseStore
from app.database.supabase_manager import supabase_db

router = APIRouter(prefix="/content-designer", tags=["Content Designer"])

def require_reviewer_role(user: dict):
    if user.get("role") not in ["content_creator", "admin", "hod"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Must be a reviewer")

class RejectRequest(BaseModel):
    feedback: str

@router.get("/queue", response_model=List[Dict[str, Any]])
async def get_review_queue(user: dict = Depends(get_current_user)):
    require_reviewer_role(user)
    
    client = supabase_db.get_client()
    try:
        response = client.table("courses").select("*").eq("review_status", "in_review").order("created_at", desc=True).execute()
        
        # normalize
        store = CourseStore()
        return [store._normalize_course(c) for c in getattr(response, "data", [])]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/courses/{course_id}/approve")
async def approve_course(course_id: str, user: dict = Depends(get_current_user)):
    require_reviewer_role(user)
    
    store = CourseStore()
    success = await store.approve_and_publish(course_id, admin_id=user["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Failed to approve and publish course")
    
    return {"status": "success", "message": "Course approved and published."}

@router.post("/courses/{course_id}/reject")
async def reject_course(course_id: str, req: RejectRequest, user: dict = Depends(get_current_user)):
    require_reviewer_role(user)
    
    store = CourseStore()
    success = await store.reject_course(course_id, feedback=req.feedback)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reject course")
        
    return {"status": "success", "message": "Course rejected with feedback."}

@router.get("/courses/{course_id}/versions")
async def course_versions(course_id: str, user: dict = Depends(get_current_user)):
    require_reviewer_role(user)
    store = CourseStore()
    versions = await store.get_course_versions(course_id)
    return versions

@router.post("/courses/{course_id}/submit")
async def submit_for_review(course_id: str, user: dict = Depends(get_current_user)):
    store = CourseStore()
    
    course = await store.get_course_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if course.get("teacher_id") != user.get("id"):
        raise HTTPException(status_code=403, detail="Not the course owner")
        
    success = await store.submit_for_review(course_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to submit course for review")
        
    return {"status": "success", "message": "Submitted for review"}
