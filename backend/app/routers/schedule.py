from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.api.deps import get_current_college_admin, get_current_user
from app.database.scoped_db import get_scoped_db
import structlog

router = APIRouter()
log = structlog.get_logger(__name__)

@router.get("/academic-years")
async def get_academic_years(
    institution_id: str = Query(..., description="UUID of the institution"),
    current_user: dict = Depends(get_current_user)
):
    """List all configured academic years (e.g., 2024-25)."""
    db = get_scoped_db(current_user)
    try:
        res = db.table("academic_years").select("*").eq("institution_id", institution_id).execute()
        return res.data or []
    except Exception as e:
        log.error("get_academic_years_failed", error=str(e))
        return []

@router.post("/academic-years")
async def create_academic_year(
    payload: Dict[str, Any],
    admin: dict = Depends(get_current_college_admin)
):
    """Create a new academic year entry."""
    db = get_scoped_db(admin)
    try:
        res = db.table("academic_years").insert(payload).execute()
        return res.data[0]
    except Exception as e:
        log.error("create_academic_year_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create academic year")

@router.get("/batches/{batch_id}/sections")
async def get_sections(
    batch_id: str,
    current_user: dict = Depends(get_current_user)
):
    """List sections (A, B, C) for a given degree batch."""
    db = get_scoped_db(current_user)
    try:
        res = db.table("sections").select("*").eq("batch_id", batch_id).execute()
        return res.data or []
    except Exception as e:
        log.error("get_sections_failed", error=str(e))
        return []

@router.post("/sections")
async def create_section(
    payload: Dict[str, Any],
    admin: dict = Depends(get_current_college_admin)
):
    """Define a new section within a batch."""
    db = get_scoped_db(admin)
    try:
        res = db.table("sections").insert(payload).execute()
        return res.data[0]
    except Exception as e:
        log.error("create_section_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create section")
