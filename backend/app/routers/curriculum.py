from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from app.routers.auth import get_current_user
from app.pathway.curriculum_policy import CurriculumPolicyEngine
from app.core.logging import structlog
from uuid import UUID

router = APIRouter(prefix="/curriculum", tags=["curriculum"])
log = structlog.get_logger()
policy_engine = CurriculumPolicyEngine()

@router.get("/scope")
async def get_curriculum_scope(current_user: dict = Depends(get_current_user)) -> Dict:
    """
    Returns the student's curriculum scope (current semester, allowed courses).
    """
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students have a curriculum scope.")
        
    student_id = UUID(current_user["id"])
    scope = await policy_engine.get_student_scope(student_id)
    
    if "error" in scope:
        raise HTTPException(status_code=500, detail=scope["error"])
        
    return scope

@router.get("/semesters/{program_id}")
async def get_semesters(program_id: str, current_user: dict = Depends(get_current_user)):
    """Fetch all semesters for a specific program."""
    from app.store.curriculum_store import CurriculumStore
    store = CurriculumStore()
    return await store.get_semesters(UUID(program_id))
