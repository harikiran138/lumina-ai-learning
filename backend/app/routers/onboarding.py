import mimetypes
import os
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Literal
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field, EmailStr

from .auth import get_current_user
from app.database.supabase_manager import supabase_db
from app.database.scoped_db import get_scoped_db
from app.services.storage import storage_service
from app.services.adaptive_onboarding import AdaptiveOnboardingEngine
from app.services.onboarding_service import OnboardingService
from app.store.user_store import UserStore
from app.core.rbac import normalize_role

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_DIGIT_REGEX = re.compile(r"\D")


def default_onboarding_state(role: str = "student") -> Dict[str, Any]:
    normalized_role = normalize_role(role)
    is_super_admin = normalized_role == "super_admin"
    return {
        "status": "completed" if is_super_admin else "not_started",
        "step": 5 if is_super_admin else 0,
        "isComplete": is_super_admin,
        "progress": {},
        "role": normalized_role,
        "adaptiveOnboardingCompleted": normalized_role != "student",
        "adaptiveOnboardingStatus": "completed" if is_super_admin else "pending",
        "adaptiveSessionId": None,
    }


class StudentPersonalDetailsRequest(BaseModel):
    first_name: str = Field(min_length=2)
    last_name: str = Field(min_length=2)
    date_of_birth: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$") # YYYY-MM-DD
    gender: Optional[str] = None
    phone_number: str = Field(min_length=8, max_length=15)
    email: EmailStr


class StudentEnrollmentRequest(BaseModel):
    enrollment_code: str = Field(min_length=4)


class StudentSubjectsRequest(BaseModel):
    subject_ids: List[str]


class StudentPreferencesRequest(BaseModel):
    learning_styles: List[str] = Field(min_length=1)
    self_assessment: Literal["beginner", "intermediate", "advanced"]


class AdaptiveOnboardingStartRequest(BaseModel):
    role: Optional[str] = None
    force_restart: bool = False


class AdaptiveOnboardingAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: Any
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    time_taken_seconds: Optional[int] = Field(default=None, ge=0)


def _require_student(current_user: dict) -> str:
    if normalize_role(current_user.get("role")) != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unable to identify current user")
    return str(user_id)


def _validate_required_text(value: str, label: str, min_length: int = 2) -> str:
    normalized = (value or "").strip()
    if not normalized:
        raise HTTPException(status_code=400, detail=f"{label} is required")
    if len(normalized) < min_length:
        raise HTTPException(status_code=400, detail=f"{label} must be at least {min_length} characters")
    return normalized


def _validate_email(value: str, label: str = "Email") -> str:
    normalized = (value or "").strip().lower()
    if not normalized:
        raise HTTPException(status_code=400, detail=f"{label} is required")
    if not EMAIL_REGEX.match(normalized):
        raise HTTPException(status_code=400, detail=f"{label} is invalid")
    return normalized


def _validate_phone(value: str, label: str = "Phone number") -> str:
    normalized = (value or "").strip()
    digits_only = PHONE_DIGIT_REGEX.sub("", normalized)
    if not digits_only:
        raise HTTPException(status_code=400, detail=f"{label} is required")
    if len(digits_only) < 8 or len(digits_only) > 15:
        raise HTTPException(status_code=400, detail=f"{label} must be between 8 and 15 digits")
    return normalized


def _validate_date_of_birth(value: str) -> str:
    normalized = (value or "").strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="Date of birth is required")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Date of birth must be a valid ISO date") from exc
    if parsed.date() >= datetime.utcnow().date():
        raise HTTPException(status_code=400, detail="Date of birth must be in the past")
    return parsed.date().isoformat()


async def _get_user_record(user_id: str, db: Any) -> Dict[str, Any]:
    record = await db.fetch_one("users", {"id": user_id})
    if not record:
        raise HTTPException(status_code=404, detail="User record not found")
    return record


async def _get_progress_record(user_id: str, db: Any) -> Dict[str, Any]:
    existing = await db.fetch_one("user_data", {"user_id": user_id})
    return (existing or {}).get("progress") or {}


async def _persist_progress(
    user_id: str,
    target_step: int,
    step_data: Dict[str, Any],
    db: Any,
    user_updates: Optional[Dict[str, Any]] = None,
    completed: bool = False,
) -> Dict[str, Any]:
    user_record = await _get_user_record(user_id, db)
    current_step = int(user_record.get("onboarding_step") or 0)
    next_step = 5 if completed else max(current_step, target_step)

    updates = {**(user_updates or {}), "onboarding_step": next_step}
    updated = await UserStore(db=db).update_user_fields(user_id, updates)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to persist onboarding user fields")

    existing_record = await db.fetch_one("user_data", {"user_id": user_id})
    progress = (existing_record or {}).get("progress") or {}
    progress[f"step_{target_step}"] = step_data
    progress["onboarding_step"] = next_step
    if completed:
        progress["onboarding_status"] = "COMPLETED"

    payload = {"progress": progress, "updated_at": datetime.utcnow().isoformat()}
    if existing_record:
        await db.update("user_data", payload, {"user_id": user_id})
    else:
        await db.insert("user_data", {"user_id": user_id, **payload})
    return progress


async def _require_step_access(user_id: str, target_step: int, db: Any) -> Dict[str, Any]:
    user_record = await _get_user_record(user_id, db)
    current_step = int(user_record.get("onboarding_step") or 0)
    if current_step < target_step - 1:
        raise HTTPException(
            status_code=409,
            detail=f"Complete step {target_step - 1} before continuing to step {target_step}",
        )
    return user_record


async def _validate_enrollment_code_for_user(code: str, user_id: str, db: Any) -> Dict[str, Any]:
    normalized_code = (code or "").strip().upper()
    if not normalized_code:
        raise HTTPException(status_code=400, detail="Enrollment code is required")

    record = await db.fetch_one("enrollment_codes", {"code": normalized_code})
    if not record:
        raise HTTPException(status_code=400, detail="Enrollment code is invalid")

    used_by = record.get("used_by")
    if used_by and str(used_by) != str(user_id):
        raise HTTPException(status_code=400, detail="Enrollment code has already been used")

    expires_at = record.get("expires_at")
    if expires_at:
        expires = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
        if expires < datetime.now(expires.tzinfo):
            raise HTTPException(status_code=400, detail="Enrollment code has expired")

    batch = await db.fetch_one("batches", {"id": record.get("batch_id")})
    if not batch:
        raise HTTPException(status_code=404, detail="Linked batch could not be found")

    dept_id = batch.get("dept_id") or batch.get("department_id")
    department = await db.fetch_one("departments", {"id": dept_id}) if dept_id else None
    if not department:
        raise HTTPException(status_code=404, detail="Linked department could not be found")

    semester = batch.get("current_semester")
    return {
        "code": normalized_code,
        "record": record,
        "batch": batch,
        "department": department,
        "semester": semester,
        "section": record.get("section"),
    }


async def _get_subject_rows_for_batch(batch_id: str, db: Any) -> List[Dict[str, Any]]:
    batch = await db.fetch_one("batches", {"id": batch_id})
    if not batch:
        logger.error(f"batch_not_found_for_subjects: {batch_id}")
        raise HTTPException(
            status_code=404, 
            detail=f"Enrollment details not found for batch ID {batch_id}. Please restart onboarding."
        )

    dept_id = batch.get("dept_id") or batch.get("department_id")
    semester = batch.get("current_semester")
    if not dept_id or semester is None:
        raise HTTPException(status_code=400, detail="Batch is missing department or semester mapping")

    subjects = await db.fetch_all("courses", {"department_id": dept_id, "semester": semester})
    return subjects or []


def _self_assessment_score(level: str) -> float:
    lookup = {
        "beginner": 0.35,
        "intermediate": 0.65,
        "advanced": 0.85,
    }
    return lookup.get(level, 0.35)


async def _pick_default_class(batch_id: Optional[str], section: Optional[str], db: Any) -> Optional[Dict[str, Any]]:
    if not batch_id:
        return None

    class_rows = await db.fetch_all("classes", {"batch_id": batch_id})
    if not class_rows:
        return None

    normalized_section = str(section or "").strip().lower()
    if normalized_section:
        for row in class_rows:
            row_section = str(row.get("section") or row.get("section_name") or "").strip().lower()
            if row_section == normalized_section:
                return row
    if len(class_rows) == 1:
        return class_rows[0]
    return None


# Local role normalization is deprecated in favor of app.core.rbac.normalize_role


@router.post("/personal")
async def save_student_personal_details(
    payload: StudentPersonalDetailsRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = _require_student(current_user)
    db = get_scoped_db(current_user)
    await _require_step_access(user_id, 1, db)

    first_name = _validate_required_text(payload.first_name, "First name")
    last_name = _validate_required_text(payload.last_name, "Last name")
    phone_number = _validate_phone(payload.phone_number)
    date_of_birth = _validate_date_of_birth(payload.date_of_birth)
    email = _validate_email(payload.email)

    current_email = _validate_email(current_user.get("email") or "", "Account email")
    if email != current_email:
        raise HTTPException(status_code=400, detail="Submitted email does not match the signed-in account")

    gender = (payload.gender or "").strip().lower() or None
    if gender and gender not in {"male", "female", "non_binary", "prefer_not_to_say", "other"}:
        raise HTTPException(status_code=400, detail="Gender selection is invalid")

    full_name = f"{first_name} {last_name}".strip()
    step_data = {
        "firstName": first_name,
        "lastName": last_name,
        "dob": date_of_birth,
        "gender": gender,
        "phone": phone_number,
        "email": email,
    }
    await _persist_progress(
        user_id,
        1,
        step_data,
        db,
        {
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "name": full_name,
            "phone": phone_number,
            "dob": date_of_birth,
            "gender": gender,
        },
    )
    return {"step": 1, "success": True, "profile": step_data}


@router.post("/enrollment")
async def save_student_enrollment(
    payload: StudentEnrollmentRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = _require_student(current_user)
    db = get_scoped_db(current_user)
    await _require_step_access(user_id, 2, db)

    enrollment = await _validate_enrollment_code_for_user(payload.enrollment_code, user_id, db)
    batch = enrollment["batch"]
    department = enrollment["department"]
    section = enrollment["section"]
    department_id = department.get("id")
    institution_id = department.get("institution_id")

    await db.update(
        "enrollment_codes",
        {"used_by": user_id, "updated_at": datetime.utcnow().isoformat()},
        {"id": enrollment["record"].get("id")},
    )

    step_data = {
        "enrollmentCode": enrollment["code"],
        "departmentId": department_id,
        "departmentName": department.get("department_name") or department.get("name"),
        "batchId": batch.get("id"),
        "batchLabel": batch.get("label") or batch.get("name"),
        "semester": batch.get("current_semester"),
        "section": section,
    }
    await _persist_progress(
        user_id,
        2,
        step_data,
        db,
        {
            "college_id": institution_id,
            "dept_id": department_id,
            "batch_id": batch.get("id"),
            "section": section,
            "student_roll": current_user.get("student_roll"),
        },
    )

    return {
        "step": 2,
        "success": True,
        "enrollment": {
            "department": {
                "id": department_id,
                "name": department.get("department_name") or department.get("name"),
                "code": department.get("abbreviation") or department.get("code"),
            },
            "batch": {
                "id": batch.get("id"),
                "label": batch.get("label") or batch.get("name"),
            },
            "semester": batch.get("current_semester"),
            "section": section,
        },
    }


@router.get("/student-subjects")
async def list_student_onboarding_subjects(
    batch_id: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    user_id = _require_student(current_user)
    db = get_scoped_db(current_user)
    await _require_step_access(user_id, 3, db)

    resolved_batch_id = batch_id or current_user.get("batch_id")
    if not resolved_batch_id:
        raise HTTPException(status_code=400, detail="Batch must be linked before loading subjects")

    subjects = await _get_subject_rows_for_batch(str(resolved_batch_id), db)
    return [
        {
            "id": row.get("id"),
            "name": row.get("course_name") or row.get("name") or row.get("title"),
            "code": row.get("course_code") or row.get("code"),
            "description": row.get("description"),
            "credits": row.get("credits"),
            "semester": row.get("semester"),
            "type": row.get("type") or row.get("category"),
        }
        for row in subjects
    ]


@router.post("/subjects")
async def save_student_subjects(
    payload: StudentSubjectsRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = _require_student(current_user)
    db = get_scoped_db(current_user)
    user_record = await _require_step_access(user_id, 3, db)

    batch_id = user_record.get("batch_id") or current_user.get("batch_id")
    if not batch_id:
        raise HTTPException(status_code=400, detail="Batch must be linked before selecting subjects")

    available_subjects = await _get_subject_rows_for_batch(str(batch_id), db)
    available_subject_ids = {str(row.get("id")) for row in available_subjects if row.get("id")}
    selected_subject_ids = [str(subject_id) for subject_id in (payload.subject_ids or []) if str(subject_id).strip()]

    if len(selected_subject_ids) < 1:
        raise HTTPException(status_code=400, detail="Select at least one subject")

    invalid_ids = sorted(set(selected_subject_ids) - available_subject_ids)
    if invalid_ids:
        raise HTTPException(status_code=400, detail="One or more selected subjects are not available for your batch")

    await db.delete("student_subjects", {"student_id": user_id})
    for subject_id in selected_subject_ids:
        await db.insert("student_subjects", {"student_id": user_id, "subject_id": subject_id})

    selected_subjects = [
        {
            "id": row.get("id"),
            "name": row.get("course_name") or row.get("name") or row.get("title"),
            "code": row.get("course_code") or row.get("code"),
        }
        for row in available_subjects
        if str(row.get("id")) in set(selected_subject_ids)
    ]
    await _persist_progress(user_id, 3, {"subjectIds": selected_subject_ids, "subjects": selected_subjects}, db)
    return {"step": 3, "success": True, "subjects": selected_subjects}


@router.post("/profile")
async def save_student_profile_details(
    emergency_contact: str = Form(...),
    parent_email: Optional[str] = Form(default=None),
    profile_photo: Optional[UploadFile] = File(default=None),
    current_user: dict = Depends(get_current_user),
):
    user_id = _require_student(current_user)
    db = get_scoped_db(current_user)
    user_record = await _require_step_access(user_id, 4, db)

    validated_emergency_contact = _validate_phone(emergency_contact, "Emergency contact")
    validated_parent_email = None
    if parent_email and parent_email.strip():
        validated_parent_email = _validate_email(parent_email, "Parent email")

    existing_photo_url = user_record.get("profile_photo_url")
    uploaded_photo_url = existing_photo_url

    if profile_photo is not None:
        content_type = profile_photo.content_type or mimetypes.guess_type(profile_photo.filename or "")[0]
        if content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(status_code=400, detail="Profile photo must be a JPG, PNG, or WEBP image")

        extension = os.path.splitext(profile_photo.filename or "")[1] or mimetypes.guess_extension(content_type or "") or ".jpg"
        file_name = f"profile-photos/{user_id}/{uuid.uuid4().hex}{extension}"
        uploaded_photo_url = storage_service.upload_file(profile_photo, file_name)

    if not uploaded_photo_url:
        # Fall back to a generated avatar so the step is not blocked
        display_name = (
            user_record.get("full_name")
            or user_record.get("name")
            or current_user.get("email", "User")
        )
        uploaded_photo_url = (
            f"https://ui-avatars.com/api/?name={display_name.replace(' ', '+')}"
            "&background=111827&color=F9FAFB&size=128"
        )

    step_data = {
        "emergencyContact": validated_emergency_contact,
        "parentEmail": validated_parent_email,
        "profilePhotoUrl": uploaded_photo_url,
    }
    await _persist_progress(
        user_id,
        4,
        step_data,
        db,
        {
            "emergency_contact": validated_emergency_contact,
            "parent_email": validated_parent_email,
            "profile_photo_url": uploaded_photo_url,
        },
    )
    return {"step": 4, "success": True, "profile": step_data}


@router.post("/preferences")
async def save_student_preferences(
    payload: StudentPreferencesRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = _require_student(current_user)
    db = get_scoped_db(current_user)
    user_record = await _require_step_access(user_id, 5, db)

    learning_styles = [str(item).strip() for item in (payload.learning_styles or []) if str(item).strip()]
    if len(learning_styles) < 1:
        raise HTTPException(status_code=400, detail="Select at least one learning preference")

    self_assessment = (payload.self_assessment or "").strip().lower()
    if self_assessment not in {"beginner", "intermediate", "advanced"}:
        raise HTTPException(status_code=400, detail="Self assessment must be Beginner, Intermediate, or Advanced")

    progress = await _get_progress_record(user_id, db)
    step_three = progress.get("step_3") or {}
    subject_ids = [str(subject_id) for subject_id in (step_three.get("subjectIds") or []) if str(subject_id).strip()]
    if not subject_ids:
        raise HTTPException(status_code=409, detail="Complete subject selection before saving preferences")

    batch_id = user_record.get("batch_id")
    dept_id = user_record.get("dept_id") or user_record.get("department_id")
    section = user_record.get("section")
    if not batch_id or not dept_id:
        raise HTTPException(status_code=400, detail="Enrollment details are incomplete")

    batch = await db.fetch_one("batches", {"id": batch_id})
    if not batch:
        raise HTTPException(status_code=400, detail="Batch details could not be found")

    course_lookup: Dict[str, Dict[str, Any]] = {}
    for subject_id in subject_ids:
        course = await db.fetch_one("courses", {"id": subject_id})
        if not course:
            raise HTTPException(status_code=400, detail="Selected subjects are no longer available")
        course_lookup[subject_id] = course

    selected_class = await _pick_default_class(str(batch_id), section, db)
    enrollment_record = await db.fetch_one("student_enrollments", {"student_id": user_id})

    program_id = (
        (selected_class or {}).get("program_id")
        or (enrollment_record or {}).get("program_id")
        or next((course.get("program_id") for course in course_lookup.values() if course.get("program_id")), None)
    )
    current_semester_id = (
        (selected_class or {}).get("semester_id")
        or (enrollment_record or {}).get("current_semester_id")
        or next((course.get("semester_id") for course in course_lookup.values() if course.get("semester_id")), None)
    )

    if not program_id and dept_id:
        program_rows = await db.fetch_all("programs", {"department_id": dept_id})
        active_programs = [row for row in program_rows if (row.get("status") or "active") == "active"]
        fallback_programs = active_programs or program_rows
        if len(fallback_programs) == 1:
            program_id = fallback_programs[0].get("id")
        elif fallback_programs:
            batch_label = str(batch.get("label") or "").lower()
            program_id = next(
                (
                    row.get("id")
                    for row in fallback_programs
                    if batch_label and batch_label in str(row.get("program_name") or "").lower()
                ),
                fallback_programs[0].get("id"),
            )

    if not current_semester_id and program_id and batch.get("current_semester"):
        semester_match = await db.fetch_one(
            "semesters",
            {"program_id": program_id, "semester_number": batch.get("current_semester")},
        )
        current_semester_id = semester_match.get("id") if semester_match else None

    year_of_study = max(1, ((int(batch.get("current_semester") or 1) + 1) // 2))
    now = datetime.utcnow().isoformat()

    if program_id:
        enrollment_upsert = await db.upsert(
            "student_enrollments",
            {
                "student_id": user_id,
                "program_id": program_id,
                "current_semester_id": current_semester_id,
                "class_id": (selected_class or {}).get("id") or (enrollment_record or {}).get("class_id"),
                "year_of_study": year_of_study,
                "status": "active",
                "updated_at": now,
            },
            on_conflict="student_id, program_id",
        )
        if not enrollment_upsert:
            raise HTTPException(status_code=500, detail="Failed to update student enrollment")

    score = _self_assessment_score(self_assessment)
    await db.delete("student_subjects", {"student_id": user_id})
    for subject_id in subject_ids:
        await db.insert("student_subjects", {"student_id": user_id, "subject_id": subject_id})
        await db.delete(
            "skill_mastery",
            {"user_id": user_id, "course_id": subject_id, "skill_name": "initial_self_assessment"},
        )
        await db.insert(
            "skill_mastery",
            {
                "user_id": user_id,
                "course_id": subject_id,
                "skill_name": "initial_self_assessment",
                "mastery_score": score,
                "confidence": 0.65,
                "bkt_p_l0": score,
                "assessment_count": 1,
                "last_assessed": now,
                "updated_at": now,
            },
        )
        await db.upsert(
            "enrollments",
            {
                "student_id": user_id,
                "course_id": subject_id,
                "status": "active",
                "enrolled_at": now,
                "progress": {
                    "percentage": 0,
                    "mastery": round(score * 100, 2),
                    "onboardingSource": "student_onboarding_v2",
                },
                "updated_at": now,
            },
            on_conflict="student_id, course_id",
        )

    learner_profile = await db.upsert(
        "learner_profiles",
        {
            "user_id": user_id,
            "role": "student",
            "goals": ["complete_onboarding"],
            "learning_style": learning_styles[0],
            "preferences": {
                "learning_styles": learning_styles,
                "self_assessment": self_assessment,
            },
            "metadata": {
                "onboarding_version": "student_v2",
                "selected_subject_ids": subject_ids,
            },
            "updated_at": now,
        },
        on_conflict="user_id",
    )
    if not learner_profile:
        raise HTTPException(status_code=500, detail="Failed to initialize learner profile")

    step_data = {
        "learningStyles": learning_styles,
        "selfAssessment": self_assessment,
        "selectedSubjectIds": subject_ids,
    }
    await _persist_progress(
        user_id,
        5,
        step_data,
        db,
        {
            "section": (selected_class or {}).get("section")
            or (selected_class or {}).get("section_name")
            or section,
        },
        completed=True,
    )
    return {
        "step": 5,
        "success": True,
        "complete": True,
        "programLinked": bool(program_id),
        "subjectCount": len(subject_ids),
    }


@router.get("/status")
async def get_onboarding_status(
    current_user: dict = Depends(get_current_user),
):
    try:
        user_id = current_user.get("id")
        db = get_scoped_db(current_user)
        # Check if they have existing data
        existing = await db.fetch_one("user_data", {"user_id": user_id})
        role = normalize_role(current_user.get("role"))
        step = current_user.get("onboarding_step", 0) or 0
        if not existing and not step:
            return default_onboarding_state(role)
        adaptive_profile = None
        adaptive_session = None
        adaptive_completed = role != "student"

        if role == "super_admin":
            return {
                "step": 5,
                "role": role,
                "isComplete": True,
                "progress": (existing or {}).get("progress") or {},
                "status": "completed",
                "adaptiveOnboardingCompleted": True,
                "adaptiveOnboardingStatus": "completed",
                "adaptiveSessionId": None,
            }

        if role == "student":
            adaptive_profile = await db.fetch_one("learner_profiles", {"user_id": user_id})
            adaptive_session = await db.fetch_one(
                "assessment_sessions",
                {"user_id": user_id, "status": "in_progress"},
            )
            adaptive_completed = str((adaptive_profile or {}).get("status") or "").lower() in {"completed", "active"}

        status = "not_started"
        if step > 0:
            status = "in_progress"
        if step >= 5 and adaptive_completed:
            status = "completed"

        progress = {}
        if existing and "progress" in existing:
            progress = existing["progress"]

        return {
            "step": step,
            "role": role,
            "isComplete": step >= 5 and adaptive_completed,
            "progress": progress,
            "status": status,
            "adaptiveOnboardingCompleted": adaptive_completed,
            "adaptiveOnboardingStatus": (
                "completed"
                if adaptive_completed
                else (adaptive_session or {}).get("status") or (adaptive_profile or {}).get("status") or "pending"
            ),
            "adaptiveSessionId": (adaptive_session or {}).get("id") or (adaptive_profile or {}).get("latest_session_id"),
        }
    except Exception as e:
        logger.error(f"error_fetching_onboarding_status: {e}", exc_info=True)
        # Fail-safe: Always include the role even in errors to prevent 'undefined' UI states
        role = normalize_role(current_user.get("role")) if current_user else "student"
        return default_onboarding_state(role)


@router.patch("/step")
async def update_onboarding_step(payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    requested_step = int(payload.get("step", 0))
    step_data = payload.get("data") or {}
    role = normalize_role(current_user.get("role"))
    db = get_scoped_db(current_user)

    def require_fields(fields: list[str]):
        missing = [f for f in fields if not step_data.get(f)]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")

    if role in {"college_admin", "super_admin"}:
        if requested_step == 1:
            require_fields(["collegeName", "collegeCode"])
        if requested_step == 2:
            depts = step_data.get("departments") or []
            if not depts:
                raise HTTPException(status_code=400, detail="At least one department required")
            for dept in depts:
                if not dept.get("name") or not dept.get("abbreviation"):
                    raise HTTPException(status_code=400, detail="Department name and abbreviation required")
        if requested_step == 3:
            require_fields(["academicYear"])
        if requested_step == 5:
            if step_data.get("activateCollege") is not True:
                raise HTTPException(status_code=400, detail="College activation required")
    elif role == "hod":
        if requested_step == 1:
            require_fields(["name", "abbreviation"])
        if requested_step == 2:
            subjects = step_data.get("subjects") or []
            if not subjects:
                raise HTTPException(status_code=400, detail="At least one subject required")
            for subject in subjects:
                if not subject.get("name") or not subject.get("code") or not subject.get("credits") or not subject.get("semester"):
                    raise HTTPException(status_code=400, detail="Subject name, code, credits, semester required")
        if requested_step == 3:
            batches = step_data.get("batches") or []
            if not batches:
                raise HTTPException(status_code=400, detail="At least one batch required")
            for batch in batches:
                if not batch.get("year") or not batch.get("label") or not batch.get("sections"):
                    raise HTTPException(status_code=400, detail="Batch year, label, sections required")
    elif role == "teacher":
        if requested_step == 1:
            require_fields(["fullName", "employeeId"])
        if requested_step == 2:
            confirmed = step_data.get("confirmedAssignmentIds")
            if isinstance(confirmed, list) and confirmed:
                pass
            elif step_data.get("confirmedAssignments") is True:
                pass
            else:
                raise HTTPException(status_code=400, detail="Assignment confirmation required")
        if requested_step == 4:
            require_fields(["gradingScale"])
    elif role == "student":
        if requested_step == 1:
            require_fields(["fullName", "registerNumber", "dob"])
            if current_user.get("student_roll") and step_data.get("registerNumber") != current_user.get("student_roll"):
                raise HTTPException(status_code=400, detail="Register number does not match enrollment records")
        if requested_step == 2:
            if step_data.get("confirmBatch") is not True:
                # log a correction request, still allow progression
                await db.insert(
                    "correction_requests",
                    {
                        "student_id": user_id,
                        "type": "batch_correction",
                        "message": step_data.get("correctionMessage") or "Student raised batch assignment issue",
                        "status": "pending",
                        "created_at": datetime.utcnow().isoformat(),
                    },
                )
        if requested_step == 4:
            if not step_data.get("photoUrl") and not step_data.get("profilePhotoUrl"):
                raise HTTPException(status_code=400, detail="Profile photo required")

    # Update user fields if provided in step data
    updates = {}
    if "collegeId" in step_data: updates["college_id"] = step_data["collegeId"]
    if "deptId" in step_data: updates["dept_id"] = step_data["deptId"]
    if "batchId" in step_data: updates["batch_id"] = step_data["batchId"]
    if "section" in step_data: updates["section"] = step_data["section"]
    if "fullName" in step_data: updates["full_name"] = step_data["fullName"]
    if "employeeId" in step_data: updates["employee_id"] = step_data["employeeId"]
    if "studentRoll" in step_data: updates["student_roll"] = step_data["studentRoll"]
    if "registerNumber" in step_data: updates["student_roll"] = step_data["registerNumber"]
    if "phone" in step_data: updates["phone"] = step_data["phone"]
    if "profilePhotoUrl" in step_data: updates["profile_photo_url"] = step_data["profilePhotoUrl"]
    
    updates["onboarding_step"] = requested_step

    updated = await UserStore().update_user_fields(user_id, updates)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to persist onboarding user fields")

    # Persist step data inside user_data.progress
    existing = await db.fetch_one("user_data", {"user_id": user_id})
    progress = (existing or {}).get("progress") or {}
    progress[f"step_{requested_step}"] = step_data
    progress["onboarding_step"] = requested_step

    if existing:
        await db.update(
            "user_data",
            {"progress": progress, "updated_at": datetime.utcnow().isoformat()},
            {"user_id": user_id},
        )
    else:
        await db.insert(
            "user_data",
            {"user_id": user_id, "progress": progress, "updated_at": datetime.utcnow().isoformat()},
        )

    # Optional: handle elective selections for students
    if step_data.get("selectedElectives"):
        electives = step_data.get("selectedElectives") or []
        await db.delete("student_subjects", {"student_id": user_id})
        for subject_id in electives:
            await db.insert(
                "student_subjects",
                {"student_id": user_id, "subject_id": subject_id},
            )

    return {"step": requested_step, "success": True}


@router.get("/subjects")
async def get_onboarding_subjects(current_user: dict = Depends(get_current_user)):
    if normalize_role(current_user.get("role")) != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    dept_id = current_user.get("dept_id") or current_user.get("department_id")
    batch_id = current_user.get("batch_id")
    if not dept_id or not batch_id:
        return []
    db = get_scoped_db(current_user)
    batch = await db.fetch_one("batches", {"id": batch_id})
    semester = batch.get("current_semester") if batch else None
    if not semester:
        return []
    return await db.fetch_all(
        "courses",
        {"department_id": dept_id, "semester": semester},
    )


@router.post("/complete")
async def complete_onboarding(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    role = current_user.get("role")
    
    onboarding_service = OnboardingService(db=supabase_db)
    return await onboarding_service.complete_onboarding(
        user_id=user_id,
        role=role,
        current_user=current_user
    )


@router.post("/start")
async def start_adaptive_onboarding(
    payload: AdaptiveOnboardingStartRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_scoped_db(current_user)
    engine = AdaptiveOnboardingEngine(db)
    try:
        return await engine.start_session(
            current_user=current_user,
            requested_role=payload.role,
            force_restart=payload.force_restart,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/answer")
async def answer_adaptive_onboarding(
    payload: AdaptiveOnboardingAnswerRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_scoped_db(current_user)
    engine = AdaptiveOnboardingEngine(db)
    try:
        return await engine.submit_answer(
            current_user=current_user,
            session_id=payload.session_id,
            question_id=payload.question_id,
            answer=payload.answer,
            confidence=payload.confidence,
            time_taken_seconds=payload.time_taken_seconds,
        )
    except ValueError as exc:
        message = str(exc)
        status_code = 404 if "not found" in message.lower() else 400
        raise HTTPException(status_code=status_code, detail=message) from exc


@router.get("/result")
async def get_adaptive_onboarding_result(
    session_id: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    db = get_scoped_db(current_user)
    engine = AdaptiveOnboardingEngine(db)
    try:
        return await engine.get_result(current_user=current_user, session_id=session_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
