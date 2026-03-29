from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from datetime import datetime

from .auth import get_current_user
from app.database.supabase_manager import supabase_db
from app.store.user_store import UserStore

router = APIRouter()


def _normalize_role(role: str) -> str:
    if role == "admin":
        return "super_admin"
    if role == "teacher":
        return "faculty"
    return role


@router.get("/status")
async def get_onboarding_status(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    step = current_user.get("onboarding_step", 0) or 0
    existing = await supabase_db.fetch_one("user_data", {"user_id": user_id})
    progress = (existing or {}).get("progress") or {}

    return {
        "step": step,
        "role": _normalize_role(current_user.get("role")),
        "isComplete": step >= 5,
        "collegeId": current_user.get("college_id") or current_user.get("institution_id"),
        "deptId": current_user.get("dept_id") or current_user.get("department_id"),
        "batchId": current_user.get("batch_id"),
        "progress": progress,
    }


@router.patch("/step")
async def update_onboarding_step(payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    requested_step = int(payload.get("step", 0))
    step_data = payload.get("data") or {}
    role = _normalize_role(current_user.get("role"))

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
    elif role == "faculty":
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
                await supabase_db.insert(
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
    existing = await supabase_db.fetch_one("user_data", {"user_id": user_id})
    progress = (existing or {}).get("progress") or {}
    progress[f"step_{requested_step}"] = step_data
    progress["onboarding_step"] = requested_step

    if existing:
        await supabase_db.update(
            "user_data",
            {"progress": progress, "updated_at": datetime.utcnow().isoformat()},
            {"user_id": user_id},
        )
    else:
        await supabase_db.insert(
            "user_data",
            {"user_id": user_id, "progress": progress, "updated_at": datetime.utcnow().isoformat()},
        )

    # Optional: handle elective selections for students
    if step_data.get("selectedElectives"):
        electives = step_data.get("selectedElectives") or []
        await supabase_db.delete("student_subjects", {"student_id": user_id})
        for subject_id in electives:
            await supabase_db.insert(
                "student_subjects",
                {"student_id": user_id, "subject_id": subject_id},
            )

    return {"step": requested_step, "success": True}


@router.get("/subjects")
async def get_onboarding_subjects(current_user: dict = Depends(get_current_user)):
    if _normalize_role(current_user.get("role")) != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    dept_id = current_user.get("dept_id") or current_user.get("department_id")
    batch_id = current_user.get("batch_id")
    if not dept_id or not batch_id:
        return []
    batch = await supabase_db.fetch_one("batches", {"id": batch_id})
    semester = batch.get("current_semester") if batch else None
    if not semester:
        return []
    return await supabase_db.fetch_all(
        "courses",
        {"department_id": dept_id, "semester": semester},
    )


@router.post("/complete")
async def complete_onboarding(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    updated = await UserStore().update_user_fields(user_id, {"onboarding_step": 5})
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to finalize onboarding")
    role = _normalize_role(current_user.get("role"))

    if role in {"college_admin", "super_admin"}:
        college_id = current_user.get("college_id") or current_user.get("institution_id")
        if college_id:
            await supabase_db.update(
                "institutions",
                {
                    "onboarding_status": "ACTIVE",
                    "is_active": True,
                    "updated_at": datetime.utcnow().isoformat(),
                },
                {"id": college_id},
            )

    existing = await supabase_db.fetch_one("user_data", {"user_id": user_id})
    progress = (existing or {}).get("progress") or {}
    progress["onboarding_status"] = "COMPLETED"
    progress["onboarding_step"] = 5
    if existing:
        await supabase_db.update(
            "user_data",
            {"progress": progress, "updated_at": datetime.utcnow().isoformat()},
            {"user_id": user_id},
        )
    else:
        await supabase_db.insert(
            "user_data",
            {"user_id": user_id, "progress": progress, "updated_at": datetime.utcnow().isoformat()},
        )
    return {"step": 5, "complete": True}
