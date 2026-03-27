from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
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

    data = {}
    profile = await supabase_db.fetch_one("user_data", {"user_id": user_id})
    if profile and profile.get("progress"):
        progress = profile.get("progress") or {}
        data = progress.get("onboarding", {}) or {}

    return {
        "step": step,
        "role": _normalize_role(current_user.get("role")),
        "isComplete": step >= 5,
        "data": data,
    }


@router.patch("/step")
async def update_onboarding_step(payload: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    requested_step = int(payload.get("step", 0))
    step_data = payload.get("data") or {}

    if requested_step < 0 or requested_step > 5:
        raise HTTPException(status_code=400, detail="Invalid step")

    current_step = int(current_user.get("onboarding_step", 0) or 0)
    next_step = max(current_step, requested_step)

    # Persist onboarding data inside user_data.progress
    existing = await supabase_db.fetch_one("user_data", {"user_id": user_id})
    progress = (existing or {}).get("progress") or {}
    onboarding = progress.get("onboarding", {}) or {}
    onboarding[str(requested_step)] = step_data
    progress["onboarding"] = onboarding

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

    await UserStore().update_user_fields(user_id, {"onboarding_step": next_step})

    return {"step": next_step, "data": onboarding}


@router.post("/complete")
async def complete_onboarding(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    await UserStore().update_user_fields(user_id, {"onboarding_step": 5})
    return {"step": 5, "complete": True}
