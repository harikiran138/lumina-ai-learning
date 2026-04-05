from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.deps import get_current_user
from app.database.supabase_manager import supabase_db
from app.services.exam_mode import get_exam_heatmap

router = APIRouter(tags=["exam-mode"])


def _check_student_access(current_user: dict, student_id: str):
    if current_user.get("role") != "admin" and current_user.get("id") != student_id:
        raise HTTPException(status_code=403, detail="Forbidden: access denied")


@router.get("/student/{student_id}/heatmap")
async def get_student_exam_heatmap(
    student_id: str,
    exam: str = Query(default="jee_main", description="Exam identifier, e.g. jee_main, neet, gate"),
    current_user: dict = Depends(get_current_user),
):
    """
    Return a heatmap of concept-level readiness for a target exam,
    mapped against the official syllabus weights.
    """
    _check_student_access(current_user, student_id)
    try:
        client = supabase_db.get_client()
        heatmap = await get_exam_heatmap(client, student_id=student_id, exam=exam)
        return heatmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load exam heatmap: {str(e)}")
