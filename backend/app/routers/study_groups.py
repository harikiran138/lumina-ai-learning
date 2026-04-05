from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.api.deps import get_current_user
from app.database.supabase_manager import supabase_db
from app.services.peer_matcher import find_mentor_match, find_peer_match, create_group, get_group

router = APIRouter(tags=["study-groups"])


class MatchRequest(BaseModel):
    student_id: str
    match_type: str          # "peer" | "mentor"
    subject_filter: Optional[str] = None


@router.post("/match")
async def match_study_group(
    body: MatchRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Find a suitable peer or mentor match for a student and create (or join) a study group.
    match_type='mentor' uses mentorship matching; anything else uses peer matching.
    """
    try:
        client = supabase_db.get_client()

        if body.match_type == "mentor":
            match_result = await find_mentor_match(
                client,
                student_id=body.student_id,
                subject_filter=body.subject_filter,
            )
        else:
            match_result = await find_peer_match(
                client,
                student_id=body.student_id,
                subject_filter=body.subject_filter,
            )

        group = await create_group(client, student_id=body.student_id, match_result=match_result)
        return group
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to match study group: {str(e)}")


@router.get("/{group_id}")
async def get_study_group(
    group_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Fetch details of a study group including its members."""
    try:
        client = supabase_db.get_client()
        group = await get_group(client, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Study group not found")
        return group
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch study group: {str(e)}")
