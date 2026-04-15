from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import get_current_hod, get_current_teacher
from app.database.scoped_db import ScopedSupabase, get_scoped_db


router = APIRouter()


class BatchCreateRequest(BaseModel):
    year: int = Field(ge=2000, le=2100)
    label: str = Field(min_length=2, max_length=120)
    sections: List[str] = Field(default_factory=list)
    current_semester: int = Field(default=1, ge=1, le=12)
    is_lateral: bool = False


def _ensure_department_access(current_user: Dict[str, Any], dept_id: str) -> None:
    role = str(current_user.get("role") or "").lower()
    resolved_dept = current_user.get("dept_id") or current_user.get("department_id") or current_user.get("resolved_department_id")
    if role in {"hod", "teacher"} and str(resolved_dept) != str(dept_id):
        raise HTTPException(status_code=403, detail="You do not have access to this department")


@router.get("/{dept_id}/batches")
async def list_batches(
    dept_id: str,
    current_user: Dict[str, Any] = Depends(get_current_teacher),
    db: ScopedSupabase = Depends(get_scoped_db),
):
    _ensure_department_access(current_user, dept_id)
    rows = await db.fetch_all("batches", {"dept_id": dept_id}, limit=200)
    return sorted(rows, key=lambda item: (item.get("year") or 0, item.get("label") or ""), reverse=True)


@router.post("/{dept_id}/batches")
async def create_batch(
    dept_id: str,
    payload: BatchCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_hod),
    db: ScopedSupabase = Depends(get_scoped_db),
):
    _ensure_department_access(current_user, dept_id)
    college_id = current_user.get("college_id") or current_user.get("institution_id")
    if not college_id and str(current_user.get("role") or "").lower() != "super_admin":
        raise HTTPException(status_code=400, detail="Unable to resolve institution for batch creation")

    normalized_sections = [
        section.strip().upper()
        for section in payload.sections
        if isinstance(section, str) and section.strip()
    ]
    data = {
        "dept_id": dept_id,
        "college_id": college_id,
        "year": payload.year,
        "label": payload.label.strip(),
        "sections": normalized_sections,
        "current_semester": payload.current_semester,
        "is_lateral": payload.is_lateral,
        "created_at": datetime.utcnow().isoformat(),
    }
    created = await db.insert("batches", data)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create batch")
    return created
