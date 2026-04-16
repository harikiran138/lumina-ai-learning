from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import structlog
from app.api.deps import get_current_admin
from app.store.teacher_store import TeacherStore

router = APIRouter()
log = structlog.get_logger(__name__)
teacher_store = TeacherStore()

class TeacherAssignmentRequest(BaseModel):
    teacher_id: str
    course_id: str
    class_id: str
    subject_id: Optional[str] = None

@router.post("/assign-teacher")
async def assign_teacher(
    payload: TeacherAssignmentRequest,
    admin: dict = Depends(get_current_admin)
):
    """
    MANUAL FIX: Link a teacher to a specific course and class.
    Follows Academic Model: Teacher -> Assignment -> Class -> Course.
    """
    try:
        # Check if teacher exists
        # In a full refactor, we'd use a user_store check here
        
        assignment_data = {
            "teacher_id": payload.teacher_id,
            "course_id": payload.course_id,
            "class_id": payload.class_id,
            "is_primary": True,
        }
        
        # Using upsert to avoid duplicates
        await teacher_store.db.upsert(
            "teacher_assignments", 
            assignment_data, 
            on_conflict="teacher_id, course_id, class_id"
        )
        
        log.info("teacher_manually_assigned", admin_id=admin.get("id"), teacher_id=payload.teacher_id)
        return {"success": True, "message": "Teacher successfully assigned to class"}
        
    except Exception as e:
        log.error("assign_teacher_failed", error=str(e), teacher_id=payload.teacher_id)
        raise HTTPException(status_code=500, detail="Failed to create teacher assignment")

@router.get("/validate-assignment/{teacher_id}")
async def validate_assignment(
    teacher_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Admin tool to verify a teacher's assignments."""
    assignments = await teacher_store.get_teacher_assignments(teacher_id)
    return {
        "teacher_id": teacher_id,
        "assignments_count": len(assignments),
        "assignments": assignments
    }
