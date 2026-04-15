from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any
from app.api.deps import get_current_college_admin, get_current_user
from app.database.scoped_db import get_scoped_db
from app.services import schedule_service
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
        result = await schedule_service.create_academic_year_record(db, payload)
        return result
    except Exception as e:
        log.error("create_academic_year_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create academic year")


@router.get("/batches/{batch_id}/classes")
async def get_classes_for_batch(
    batch_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List canonical classes for a given degree batch.
    Replaces the legacy /batches/{batch_id}/sections endpoint.
    """
    db = get_scoped_db(current_user)
    try:
        return await schedule_service.get_classes_for_batch(db, batch_id)
    except Exception as e:
        log.error("get_classes_failed", error=str(e))
        return []


@router.get("/batches/{batch_id}/sections")
async def get_sections_compat(
    batch_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Legacy compatibility endpoint — returns classes shaped as sections.
    Clients should migrate to /batches/{batch_id}/classes.
    """
    db = get_scoped_db(current_user)
    try:
        return await schedule_service.get_classes_for_batch(db, batch_id)
    except Exception as e:
        log.error("get_sections_compat_failed", error=str(e))
        return []


@router.post("/classes")
async def create_class(
    payload: Dict[str, Any],
    admin: dict = Depends(get_current_college_admin)
):
    """Define a new class within a batch (canonical replacement for POST /sections)."""
    db = get_scoped_db(admin)
    try:
        result = await schedule_service.create_class_record(db, payload)
        return result
    except Exception as e:
        log.error("create_class_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create class")


@router.post("/sections")
async def create_section_compat(
    payload: Dict[str, Any],
    admin: dict = Depends(get_current_college_admin)
):
    """
    Legacy compatibility endpoint — creates a class record.
    Clients should migrate to POST /classes.
    """
    db = get_scoped_db(admin)
    try:
        result = await schedule_service.create_class_record(db, payload)
        return result
    except Exception as e:
        log.error("create_section_compat_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create class")


@router.get("/student/{student_id}/schedule")
async def get_student_schedule(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Return all classes a student is enrolled in, with their teachers and courses."""
    db = get_scoped_db(current_user)
    try:
        return await schedule_service.get_student_schedule(db, student_id)
    except Exception as e:
        log.error("get_student_schedule_failed", student_id=student_id, error=str(e))
        return []


@router.get("/class/{class_id}")
async def get_class_schedule(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Return the full schedule for a class including teacher assignments."""
    db = get_scoped_db(current_user)
    try:
        result = await schedule_service.get_class_schedule(db, class_id)
        if not result:
            raise HTTPException(status_code=404, detail="Class not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        log.error("get_class_schedule_failed", class_id=class_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch class schedule")
