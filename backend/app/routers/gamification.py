from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.api.deps import get_current_user
from app.database.supabase_manager import supabase_db
from app.services.gamification import award_xp, get_dashboard, update_streak

router = APIRouter(tags=["gamification"])


class AwardXPRequest(BaseModel):
    event: str
    engagement_score: float = 0.0


def _check_student_access(current_user: dict, student_id: str):
    """Allow the student themselves or an admin."""
    if current_user.get("role") != "admin" and current_user.get("id") != student_id:
        raise HTTPException(status_code=403, detail="Forbidden: access denied")


@router.get("/student/{student_id}/dashboard")
async def get_gamification_dashboard(
    student_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Return streak, XP, level, and earned badges for a student."""
    _check_student_access(current_user, student_id)
    try:
        client = supabase_db.get_client()
        dashboard = await get_dashboard(client, student_id)
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load gamification dashboard: {str(e)}")


@router.post("/student/{student_id}/award-xp")
async def award_student_xp(
    student_id: str,
    body: AwardXPRequest,
    current_user: dict = Depends(get_current_user),
):
    """Award XP for a gamification event. Returns xp_awarded, total_xp, multiplier_applied."""
    _check_student_access(current_user, student_id)
    try:
        client = supabase_db.get_client()
        result = await award_xp(client, student_id, body.event, body.engagement_score)
        return {
            "xp_awarded": result.get("xp_awarded"),
            "total_xp": result.get("total_xp"),
            "multiplier_applied": result.get("multiplier_applied"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to award XP: {str(e)}")
