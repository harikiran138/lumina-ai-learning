from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import uuid

from .auth import get_current_user
from app.database.supabase_manager import supabase_db
from app.store.institution_store import InstitutionStore
from app.store.user_store import UserStore
from app.core.security import get_password_hash, create_access_token

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


def _enforce_college_scope(user: dict, college_id: str):
    role = _normalize_role(user.get("role"))
    if role == "super_admin":
        return
    if _resolve_college_id(user) not in {college_id, None}:
        raise HTTPException(status_code=403, detail="Access outside your college scope")


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
    _enforce_college_scope(current_user, college_id)
    college = await InstitutionStore().get_institution(college_id)
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    return college


@router.patch("/colleges/{college_id}")
async def update_college(college_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin"})
    _enforce_college_scope(current_user, college_id)
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
    _require_roles(current_user, {"super_admin", "college_admin", "hod", "faculty"})
    _enforce_college_scope(current_user, college_id)
    return await InstitutionStore().list_departments(college_id)


@router.post("/colleges/{college_id}/departments")
async def create_department(college_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin"})
    _enforce_college_scope(current_user, college_id)
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
    _enforce_college_scope(current_user, college_id)
    filters = {"college_id": college_id}
    if role:
        filters["role"] = role
    return await supabase_db.fetch_all("users", filters)


@router.post("/colleges/{college_id}/invite")
async def invite_user(college_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    _require_roles(current_user, {"super_admin", "college_admin", "hod"})
    _enforce_college_scope(current_user, college_id)
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
                "full_name": email.split("@")[0],
                "role": role,
                "password_hash": get_password_hash(str(uuid.uuid4())),
                "is_active": False,
                "college_id": college_id,
                "dept_id": dept_id,
                "onboarding_step": 0,
                "created_at": datetime.utcnow().isoformat(),
            },
        )

    invite_token = create_access_token(
        subject=email,
        expires_delta=timedelta(hours=24),
        extra_claims={
            "type": "invite",
            "userId": user_id,
            "role": role,
            "collegeId": college_id,
            "deptId": dept_id,
        },
    )
    return {"inviteToken": invite_token, "userId": user_id}


@router.post("/batches/{batch_id}/enrollment-code")
async def create_enrollment_code(
    batch_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)
):
    _require_roles(current_user, {"super_admin", "college_admin", "hod"})
    batch = await supabase_db.fetch_one("batches", {"id": batch_id})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    section = payload.get("section")
    if section and section not in (batch.get("sections") or []):
        raise HTTPException(status_code=400, detail="Invalid section")

    code = payload.get("code") or uuid.uuid4().hex[:6].upper()
    expires_hours = payload.get("expires_hours") or 72
    data = {
        "code": code,
        "batch_id": batch_id,
        "section": section,
        "expires_at": (datetime.utcnow() + timedelta(hours=expires_hours)).isoformat(),
        "created_by": current_user.get("id"),
        "created_at": datetime.utcnow().isoformat(),
    }
    await supabase_db.insert("enrollment_codes", data)
    return {"code": code, "expiresAt": data["expires_at"], "batchId": batch_id, "section": section}


@router.post("/enroll")
async def enroll_with_code(payload: Dict[str, Any]):
    code = payload.get("code")
    roll_number = payload.get("rollNumber") or payload.get("roll_number")
    full_name = payload.get("fullName") or payload.get("full_name")
    email = payload.get("email")
    password = payload.get("password")
    phone = payload.get("phone")
    if not all([code, roll_number, full_name, email, password]):
        raise HTTPException(status_code=400, detail="Missing enrollment fields")

    record = await supabase_db.fetch_one("enrollment_codes", {"code": code})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid enrollment code")
    expires_at = datetime.fromisoformat(record["expires_at"].replace("Z", "+00:00"))
    if expires_at < datetime.now(expires_at.tzinfo):
        raise HTTPException(status_code=400, detail="Enrollment code expired")

    batch = await supabase_db.fetch_one("batches", {"id": record["batch_id"]})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    dept = await supabase_db.fetch_one("departments", {"id": batch.get("dept_id")})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    user_store = UserStore()
    existing = await user_store.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user_id = str(uuid.uuid4())
    await supabase_db.insert(
        "users",
        {
            "id": user_id,
            "email": email,
            "name": full_name,
            "full_name": full_name,
            "role": "student",
            "password_hash": get_password_hash(password),
            "is_active": True,
            "college_id": dept.get("institution_id"),
            "dept_id": dept.get("id"),
            "batch_id": batch.get("id"),
            "section": record.get("section"),
            "student_roll": roll_number,
            "onboarding_step": 0,
            "phone": phone or "N/A",
            "created_at": datetime.utcnow().isoformat(),
        },
    )

    return {"success": True, "userId": user_id}


@router.post("/colleges/{college_id}/enroll/bulk")
async def bulk_enroll_students(
    college_id: str, payload: Dict[str, Any], current_user: dict = Depends(get_current_user)
):
    _require_roles(current_user, {"super_admin", "college_admin", "hod"})
    _enforce_college_scope(current_user, college_id)
    batch_id = payload.get("batchId") or payload.get("batch_id")
    section = payload.get("section")
    students = payload.get("students") or []
    default_password = payload.get("defaultPassword")

    if not batch_id or not students:
        raise HTTPException(status_code=400, detail="Missing batch or students")

    batch = await supabase_db.fetch_one("batches", {"id": batch_id})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    dept = await supabase_db.fetch_one("departments", {"id": batch.get("dept_id")})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if dept.get("institution_id") != college_id:
        raise HTTPException(status_code=403, detail="Batch does not belong to this college")

    results = {"created": 0, "skipped": 0}
    for student in students:
        email = student.get("email")
        roll = student.get("rollNumber") or student.get("roll_number")
        full_name = student.get("fullName") or student.get("full_name")
        phone = student.get("phone")
        if not email or not roll or not full_name:
            results["skipped"] += 1
            continue
        existing = await supabase_db.fetch_one("users", {"email": email})
        if existing:
            results["skipped"] += 1
            continue

        batch_year = str(batch.get("year") or "")
        password = default_password or f"{roll}@{batch_year}" if batch_year else str(uuid.uuid4())

        await supabase_db.insert(
            "users",
            {
                "id": str(uuid.uuid4()),
                "email": email,
                "name": full_name,
                "full_name": full_name,
                "role": "student",
                "password_hash": get_password_hash(password),
                "is_active": True,
                "college_id": dept.get("institution_id"),
                "dept_id": dept.get("id"),
                "batch_id": batch.get("id"),
                "section": section,
                "student_roll": roll,
                "onboarding_step": 0,
                "phone": phone or "N/A",
                "created_at": datetime.utcnow().isoformat(),
                "must_change_password": True,
            },
        )
        results["created"] += 1

    return {"success": True, **results}
