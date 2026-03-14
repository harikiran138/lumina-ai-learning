from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any

from app.services.personalization_service import get_personalization_service
from app.personalization.schemas import InterventionUpdateRequest, InterventionStatus
from .auth import get_current_user

router = APIRouter()

def check_teacher_role(user: dict):
    if user.get("role") not in {"teacher", "admin"}:
        raise HTTPException(status_code=403, detail="Teacher access required")

@router.get("/dashboard/summary")
async def get_teacher_dashboard_summary(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    return await service.get_cohort_summary(student_ids)

@router.get("/interventions/queue")
async def get_intervention_queue(
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    # Fetch all interventions across all students
    interventions = await service.get_interventions(user_id=None)
    # Filter for active ones (Open or Acknowledged)
    active = [
        item.model_dump(mode="json") 
        for item in interventions 
        if item.status in (InterventionStatus.OPEN, InterventionStatus.ACKNOWLEDGED)
    ]
    return active

@router.patch("/interventions/{intervention_id}")
async def update_intervention_status(
    intervention_id: str,
    update: InterventionUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    updated = await service.update_intervention(
        intervention_id=intervention_id,
        status=update.status,
        teacher_notes=update.teacher_notes,
        action_taken=update.action_taken
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Intervention not found")
    return updated.model_dump(mode="json")

@router.get("/heatmap/{course_id}")
async def get_course_heatmap(
    course_id: str,
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    return await service.get_concept_heatmap(user_ids=student_ids, course_id=course_id)
