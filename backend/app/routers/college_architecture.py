from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import uuid

from .auth import get_current_user
from app.database.supabase_manager import supabase_db
from app.store.institution_store import InstitutionStore
from app.store.user_store import UserStore
from app.core.security import get_password_hash

router = APIRouter()


def _normalize_role(role: str) -> str:
    if role == "admin":
        return "super_admin"
    if role == "teacher":
        return "faculty"
    return role


def _require_roles(user: dict, allowed: set):
    role = _normalize_role(user.get("role"))
    if role not in allowed:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return role


def _resolve_college_id(user: dict) -> Optional[str]:
    return user.get("college_id") or None


def _resolve_dept_id(user: dict) -> Optional[str]:
    return user.get("dept_id") or user.get("department_id")


@router.get("/colleges")
async def list_colleges(current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin"})
    return await InstitutionStore().list_institutions()


@router.post("/colleges")
async def create_college(payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin"})
    data = {
        "institution_name": payload.get("name") or payload.get("institution_name"),
        "email": payload.get("email"),
        "code": payload.get("code"),
        "city": payload.get("city"),
        "state": payload.get("state"),
        "logo_url": payload.get("logo_url") or payload.get("logoUrl"),
        "academic_year": payload.get("academic_year") or payload.get("academicYear"),
        "login_policy": payload.get("login_policy") or payload.get("loginPolicy") or "email_only",
        "is_active": payload.get("is_active") if payload.get("is_active") is not None else True,
    }
    if not data.get("institution_name"):
        raise HTTPException(status_code=400, detail="Missing college name")
    return await InstitutionStore().create_institution(data)


@router.get("/colleges/{college_id}")
async def get_college(college_id: str, current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin"})
    college = await InstitutionStore().get_institution(college_id)
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    return college


@router.patch("/colleges/{college_id}")
async def update_college(college_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin"})
    allowed = {
        "institution_name",
        "code",
        "city",
        "state",
        "logo_url",
        "academic_year",
        "login_policy",
        "is_active",
    }
    data = {k: v for k, v in payload.items() if k in allowed}
    if not data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    data["updated_at"] = datetime.utcnow().isoformat()
    result = await supabase_db.update("institutions", data, {"id": college_id})
    if not result:
        raise HTTPException(status_code=404, detail="College not found")
    return result[0]


@router.delete("/colleges/{college_id}")
async def delete_college(college_id: str, current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin"})
    deleted = await supabase_db.delete("institutions", {"id": college_id})
    return {"deleted": bool(deleted)}


@router.get("/colleges/{college_id}/departments")
async def list_departments(college_id: str, current_user: dict = Depends(get_current_user)):
    role = _require_roles(current_user, {"super_admin", "college_admin", "hod", "faculty"})
    if role != "super_admin" and _resolve_college_id(current_user) not in {college_id, None}:
        raise HTTPException(status_code=403, detail="Access outside your college scope")
    return await InstitutionStore().list_departments(college_id)


@router.post("/colleges/{college_id}/departments")
async def create_department(college_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin"})
    data = {
        "institution_id": college_id,
        "department_name": payload.get("name") or payload.get("department_name"),
        "abbreviation": payload.get("abbreviation"),
        "intake_strength": payload.get("intake_strength"),
        "established_year": payload.get("established_year"),
        "description": payload.get("description"),
    }
    if not data.get("department_name"):
        raise HTTPException(status_code=400, detail="Missing department name")
    return await InstitutionStore().create_department(data)


@router.patch("/departments/{dept_id}")
async def update_department(dept_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin", "hod"})
    allowed = {
        "department_name",
        "abbreviation",
        "intake_strength",
        "established_year",
        "hod_id",
        "description",
    }
    data = {k: v for k, v in payload.items() if k in allowed}
    if not data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    data["updated_at"] = datetime.utcnow().isoformat()
    result = await supabase_db.update("departments", data, {"id": dept_id})
    if not result:
        raise HTTPException(status_code=404, detail="Department not found")
    return result[0]


@router.get("/departments/{dept_id}/batches")
async def list_batches(dept_id: str, current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin", "hod", "faculty"})
    return await supabase_db.fetch_all("batches", {"dept_id": dept_id})


@router.post("/departments/{dept_id}/batches")
async def create_batch(dept_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin", "hod"})
    dept = await supabase_db.fetch_one("departments", {"id": dept_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    data = {
        "college_id": dept.get("institution_id"),
        "dept_id": dept_id,
        "year": payload.get("year"),
        "label": payload.get("label"),
        "sections": payload.get("sections") or [],
        "current_semester": payload.get("current_semester", 1),
        "is_lateral": payload.get("is_lateral", False),
    }
    if not data.get("year") or not data.get("label"):
        raise HTTPException(status_code=400, detail="Missing batch year/label")
    return await supabase_db.insert("batches", data)


@router.get("/departments/{dept_id}/subjects")
async def list_subjects(dept_id: str, current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin", "hod", "faculty", "student"})
    return await supabase_db.fetch_all("courses", {"department_id": dept_id})


@router.post("/departments/{dept_id}/subjects")
async def create_subject(dept_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin", "hod"})
    dept = await supabase_db.fetch_one("departments", {"id": dept_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    data = {
        "department_id": dept_id,
        "college_id": dept.get("institution_id"),
        "course_name": payload.get("name") or payload.get("course_name"),
        "course_code": payload.get("code") or payload.get("course_code"),
        "credits": payload.get("credits"),
        "semester": payload.get("semester"),
        "type": payload.get("type"),
    }
    if not data.get("course_name") or not data.get("course_code"):
        raise HTTPException(status_code=400, detail="Missing subject name/code")
    return await supabase_db.insert("courses", data)


@router.post("/subjects/{subject_id}/assign")
async def assign_subject(subject_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin", "hod"})
    data = {
        "course_id": subject_id,
        "teacher_id": payload.get("faculty_id"),
        "batch_id": payload.get("batch_id"),
        "section": payload.get("section"),
        "is_co_teacher": payload.get("is_co_teacher", False),
        "academic_year": payload.get("academic_year"),
        "created_at": datetime.utcnow().isoformat(),
    }
    if not data.get("teacher_id") or not data.get("batch_id"):
        raise HTTPException(status_code=400, detail="Missing faculty or batch assignment")
    return await supabase_db.insert("teacher_assignments", data)


@router.get("/colleges/{college_id}/users")
async def list_users(college_id: str, role: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin", "hod"})
    filters = {"college_id": college_id}
    if role:
        filters["role"] = role
    return await supabase_db.fetch_all("users", filters)


@router.post("/colleges/{college_id}/invite")
async def invite_user(college_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin", "hod"})
    email = payload.get("email")
    role = payload.get("role")
    dept_id = payload.get("deptId") or payload.get("dept_id")

    if not email or not role:
        raise HTTPException(status_code=400, detail="Missing email or role")

    user_store = UserStore()
    existing = await user_store.get_user_by_email(email)
    if existing:
        user_id = existing["id"]
    else:
        user_id = str(uuid.uuid4())
        await supabase_db.insert(
            "users",
            {
                "id": user_id,
                "email": email,
                "name": email.split("@")[0],
                "role": role,
                "password_hash": get_password_hash(str(uuid.uuid4())),
                "is_active": False,
                "college_id": college_id,
                "dept_id": dept_id,
                "onboarding_step": 0,
                "created_at": datetime.utcnow().isoformat(),
            },
        )

    token = str(uuid.uuid4())
    await supabase_db.insert(
        "invite_tokens",
        {
            "user_id": user_id,
            "token": token,
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            "created_at": datetime.utcnow().isoformat(),
        },
    )
    return {"inviteToken": token, "userId": user_id}
