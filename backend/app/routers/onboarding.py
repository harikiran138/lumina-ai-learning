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

    return {
        "step": step,
        "role": _normalize_role(current_user.get("role")),
        "isComplete": step >= 5,
        "collegeId": current_user.get("college_id") or current_user.get("institution_id"),
        "deptId": current_user.get("dept_id") or current_user.get("department_id"),
        "batchId": current_user.get("batch_id"),
    }


@router.patch("/step")
async def update_onboarding_step(payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    requested_step = int(payload.get("step", 0))
    step_data = payload.get("data") or {}

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

    await UserStore().update_user_fields(user_id, updates)

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


@router.post("/complete")
async def complete_onboarding(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    await UserStore().update_user_fields(user_id, {"onboarding_step": 5})
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
