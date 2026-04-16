from datetime import datetime
from typing import Any, Dict, List, Optional

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


class SubjectCreateRequest(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=255)
    credits: int = Field(default=4, ge=0, le=20)
    type: str = Field(default="Theory", min_length=2, max_length=50)
    batch_id: Optional[str] = None
    faculty_id: Optional[str] = None


def _ensure_department_access(current_user: Dict[str, Any], department_id: str) -> None:
    role = str(current_user.get("role") or "").lower()
    resolved_dept = current_user.get("department_id") or current_user.get("department_id") or current_user.get("resolved_department_id")
    if role in {"hod", "teacher"} and str(resolved_dept) != str(department_id):
        raise HTTPException(status_code=403, detail="You do not have access to this department")


def _normalize_subject(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        **row,
        "name": row.get("course_name") or row.get("name") or row.get("title") or "Untitled Subject",
        "code": row.get("course_code") or row.get("code") or "",
        "credits": row.get("credits") or 0,
        "type": row.get("type") or row.get("subject_type") or "Theory",
        "batch_id": row.get("batch_id"),
        "faculty_id": row.get("teacher_id") or row.get("faculty_id"),
    }


@router.get("/{department_id}/batches")
async def list_batches(
    department_id: str,
    current_user: Dict[str, Any] = Depends(get_current_teacher),
    db: ScopedSupabase = Depends(get_scoped_db),
):
    _ensure_department_access(current_user, department_id)
    rows = await db.fetch_all("batches", {"department_id": department_id}, limit=200)
    return sorted(rows, key=lambda item: (item.get("year") or 0, item.get("label") or ""), reverse=True)


@router.post("/{department_id}/batches")
async def create_batch(
    department_id: str,
    payload: BatchCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_hod),
    db: ScopedSupabase = Depends(get_scoped_db),
):
    _ensure_department_access(current_user, department_id)
    institution_id = current_user.get("institution_id") or current_user.get("institution_id")
    if not institution_id and str(current_user.get("role") or "").lower() != "super_admin":
        raise HTTPException(status_code=400, detail="Unable to resolve institution for batch creation")

    normalized_sections = [
        section.strip().upper()
        for section in payload.sections
        if isinstance(section, str) and section.strip()
    ]
    data = {
        "department_id": department_id,
        "institution_id": institution_id,
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


@router.get("/{department_id}/subjects")
async def list_subjects(
    department_id: str,
    current_user: Dict[str, Any] = Depends(get_current_teacher),
    db: ScopedSupabase = Depends(get_scoped_db),
):
    _ensure_department_access(current_user, department_id)
    rows = await db.fetch_all("courses", {"department_id": department_id}, limit=200)
    if not rows:
        rows = await db.fetch_all("courses", {"department_id": department_id}, limit=200)
    normalized = [_normalize_subject(row) for row in rows]
    return sorted(normalized, key=lambda item: ((item.get("name") or "").lower(), item.get("code") or ""))


@router.post("/{department_id}/subjects")
async def create_subject(
    department_id: str,
    payload: SubjectCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_hod),
    db: ScopedSupabase = Depends(get_scoped_db),
):
    _ensure_department_access(current_user, department_id)
    institution_id = current_user.get("institution_id") or current_user.get("institution_id")

    data = {
        "name": payload.name.strip(),
        "title": payload.name.strip(),
        "course_name": payload.name.strip(),
        "code": payload.code.strip().upper(),
        "course_code": payload.code.strip().upper(),
        "department_id": department_id,
        "department_id": department_id,
        "teacher_id": payload.faculty_id,
        "faculty_id": payload.faculty_id,
        "batch_id": payload.batch_id,
        "credits": payload.credits,
        "type": payload.type.strip(),
        "subject_type": payload.type.strip(),
        "institution_id": institution_id,
        "institution_id": institution_id,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    try:
        client = db.get_client()
        sample_res = await client.table("courses").select("*").limit(1).async_execute()
        if sample_res.data:
            valid_cols = set(sample_res.data[0].keys())
            data = {key: value for key, value in data.items() if key in valid_cols and value is not None}
    except Exception:
        data = {key: value for key, value in data.items() if value is not None}

    created = await db.insert("courses", data)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create subject")
    return _normalize_subject(created)


@router.post("/{batch_id}/enrollment-code")
async def generate_batch_enrollment_code(
    batch_id: str,
    payload: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_hod),
    db: ScopedSupabase = Depends(get_scoped_db),
):
    """Generate a 6-digit enrollment code for a batch."""
    import uuid
    from datetime import datetime, timedelta
    
    _ensure_department_access(current_user, current_user.get("department_id"))
    
    code = uuid.uuid4().hex[:6].upper()
    expires_at = (datetime.utcnow() + timedelta(hours=72)).isoformat()
    
    data = {
        "code": code,
        "batch_id": batch_id,
        "section": payload.get("section") or "A",
        "expires_at": expires_at,
        "created_by": str(current_user["id"]),
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        # Use underlying client to insert into enrollment_codes table
        client = db.get_client()
        await client.table("enrollment_codes").insert(data).async_execute()
        return {"code": code, "expires_at": expires_at}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create enrollment code: {str(e)}")
