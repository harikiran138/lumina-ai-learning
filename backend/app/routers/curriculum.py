from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime
import structlog

from app.api.deps import get_current_college_admin
from app.store.institution_store import InstitutionStore
from app.store.course_store import CourseStore
from app.database.scoped_db import get_scoped_db

router = APIRouter()
log = structlog.get_logger(__name__)

@router.get("/programs")
async def list_programs(inst_id: str, admin: dict = Depends(get_current_college_admin)):
    """List all academic programs (e.g., B.Tech, M.Tech) for an institution."""
    db = get_scoped_db(admin)
    try:
        res = db.table("programs").select("*").eq("institution_id", inst_id).execute()
        return res.data or []
    except Exception as e:
        log.error("list_programs_failed", error=str(e), institution_id=inst_id)
        return []

@router.post("/programs")
async def create_program(inst_id: str, data: dict, admin: dict = Depends(get_current_college_admin)):
    """Create a new academic program."""
    db = get_scoped_db(admin)
    data["institution_id"] = inst_id
    data["created_at"] = datetime.utcnow().isoformat()
    try:
        res = db.table("programs").insert(data).execute()
        return res.data[0]
    except Exception as e:
        log.error("create_program_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create program")

@router.get("/courses")
async def list_curriculum_courses(admin: dict = Depends(get_current_college_admin)):
    """List courses with curriculum mapping details."""
    db = get_scoped_db(admin)
    course_store = CourseStore(db=db)
    return await course_store.list_courses()
