from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from .auth import get_current_user
from app.store.academic_store import AcademicStore

router = APIRouter()
academic_store = AcademicStore()

def check_admin_role(user: dict):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

# --- Institutions ---
@router.get("/institutions")
async def get_institutions(
    current_user: dict = Depends(get_current_user)
):
    """List all institutions (used during onboarding)."""
    return await academic_store.get_institutions()

@router.get("/institutions/{inst_id}")
async def get_institution(
    inst_id: str,
    current_user: dict = Depends(get_current_user)
):
    inst = await academic_store.get_institution_by_id(inst_id)
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst

# --- Departments ---
@router.get("/departments")
async def get_departments(
    institution_id: str = Query(..., description="UUID of the institution"),
    current_user: dict = Depends(get_current_user)
):
    # All roles can list departments within an institution during onboarding/setup
    return await academic_store.get_departments(institution_id)

@router.post("/departments")
async def create_department(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    check_admin_role(current_user)
    return await academic_store.create_department(payload)

# --- Programs & Semesters ---
@router.get("/programs")
async def get_programs(
    institution_id: str = Query(..., description="UUID of the institution"),
    current_user: dict = Depends(get_current_user)
):
    return await academic_store.get_programs(institution_id)

@router.get("/programs/{program_id}/semesters")
async def get_semesters(
    program_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await academic_store.get_semesters(program_id)

# --- Classes ---
@router.get("/classes")
async def get_classes(
    program_id: Optional[str] = Query(None),
    semester_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    # Admins, teachers, and hod can list classes. 
    # Students can also see classes for their semester during onboarding.
    return await academic_store.get_classes(program_id, semester_id)

@router.post("/classes")
async def create_class(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    check_admin_role(current_user)
    return await academic_store.create_class(payload)

@router.patch("/departments/{dept_id}")
async def update_department(
    dept_id: str,
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    check_admin_role(current_user)
    return await academic_store.update_department(dept_id, payload)

@router.delete("/departments/{dept_id}")
async def delete_department(
    dept_id: str,
    current_user: dict = Depends(get_current_user)
):
    check_admin_role(current_user)
    success = await academic_store.delete_department(dept_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete department")
    return {"success": True}
