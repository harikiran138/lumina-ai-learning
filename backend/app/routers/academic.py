from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from .auth import get_current_user
from app.store.academic_store import AcademicStore

router = APIRouter()
academic_store = AcademicStore()

def check_admin_role(user: dict):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

@router.get("/classes")
async def get_classes(
    program_id: Optional[str] = Query(None),
    semester_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    # Admins and teachers can list classes
    if current_user["role"] not in {"admin", "teacher"}:
         raise HTTPException(status_code=403, detail="Unauthorized")
    return await academic_store.get_classes(program_id, semester_id)

@router.post("/classes")
async def create_class(
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    check_admin_role(current_user)
    return await academic_store.create_class(payload)

@router.get("/classes/{class_id}")
async def get_class(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    cls = await academic_store.get_class_by_id(class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    return cls
