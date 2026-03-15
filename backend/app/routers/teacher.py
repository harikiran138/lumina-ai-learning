from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any

from app.services.personalization_service import get_personalization_service
from app.personalization.schemas import InterventionUpdateRequest, InterventionStatus, InterventionPriority
from .auth import get_current_user
from app.store.content_store import ContentStore
from app.store.course_store import CourseStore
from app.store.assignment_store import AssignmentStore
from app.services.ocr_service import ocr_service
from app.services.grader_service import grader_service

router = APIRouter()
content_store = ContentStore()
course_store = CourseStore()
assignment_store = AssignmentStore()

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

# --- V2.0 Content Pipeline Endpoints ---

@router.post("/content/upload")
async def log_content_upload(
    original_filename: str,
    storage_url: str,
    file_type: str,
    file_size_bytes: int,
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    upload = await content_store.create_content_upload(
        teacher_id=str(current_user["id"]),
        original_filename=original_filename,
        storage_url=storage_url,
        file_type=file_type,
        file_size_bytes=file_size_bytes
    )
    return upload

@router.get("/content/scaffold/{upload_id}")
async def get_uploaded_scaffold(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    upload = await content_store.get_content_upload(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return upload.get("scaffold_json") or {}

@router.post("/content/scaffold/approve/{upload_id}")
async def approve_scaffold(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    upload = await content_store.get_content_upload(upload_id)
    if not upload or not upload.get("scaffold_json"):
        raise HTTPException(status_code=400, detail="No scaffold found to approve")
    
    # Trigger course creation from scaffold
    scaffold = upload["scaffold_json"]
    course = await course_store.create_course_from_blueprint(
        scaffold, teacher_id=str(current_user["id"])
    )
    
    # Update upload status
    await content_store.update_content_upload(upload_id, {
        "processing_status": "completed",
        "scaffold_approved_at": datetime.utcnow().isoformat(),
        "course_id": course["id"]
    })
    
    return course

# --- V2.0 AI Answer Verification Queue ---

@router.get("/verification/queue")
async def get_verification_queue(
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    return await content_store.get_verification_queue(str(current_user["id"]))

@router.patch("/verification/queue/{item_id}")
async def update_verification_answer(
    item_id: str,
    status: str, # 'approved', 'rejected', 'edited'
    teacher_edited_answer: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    updated = await content_store.update_verification_status(
        item_id, status, teacher_edited_answer
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return updated

# --- V2.0 Physical Submission Endpoints ---

@router.post("/submissions/physical/process/{submission_id}")
async def process_physical_submission(
    submission_id: str,
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    submission = await content_store.get_physical_submission(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Update status to 'processing'
    await content_store.update_physical_submission(submission_id, {"assessment_status": "processing"})
    
    # Perform OCR on images
    extracted_texts = []
    for img_url in submission.get("submission_images", []):
        try:
            # Note: In a real app, we'd download the image from storage_url first.
            # For now, we assume ocr_service can handle the URL or we pass a placeholder.
            text = ocr_service.digitize_image(img_url)
            extracted_texts.append(text)
        except Exception as e:
            extracted_texts.append(f"[OCR Error: {str(e)}]")
    
    full_text = "\n\n".join(extracted_texts)

    # Grading (Context-aware)
    grading_result = {"score": 0, "feedback": "Assignment context not found."}
    assignment = await assignment_store.get_assignment_by_id(submission.get("assignment_id"))
    if assignment:
        expected = assignment.get("description") or assignment.get("title")
        grading_result = grader_service.grade_submission(full_text, expected)

    await content_store.update_physical_submission(submission_id, {
        "ocr_extracted_text": {"full_text": str(full_text), "pages": extracted_texts},
        "ai_assessment": grading_result,
        "total_ai_marks": grading_result.get("score"),
        "assessment_status": "graded"
    })
    
    return {"status": "graded", "score": grading_result.get("score"), "extracted_text_preview": str(full_text)[:200]}

    return submission

@router.get("/analytics/misconceptions")
async def get_misconception_clusters(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    return await service.get_cohort_misconceptions(student_ids)

@router.get("/analytics/growth")
async def get_growth_trajectories(
    student_ids: List[str] = Query(..., alias="student_id"),
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    return await service.get_growth_trajectories(student_ids)

@router.get("/analytics/ab-test")
async def get_ab_test_performance(
    cohort_a: List[str],
    cohort_b: List[str],
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    return await service.get_ab_test_performance(cohort_a, cohort_b)

@router.get("/alerts")
async def get_teacher_alerts(
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    # For now, alerts are derived from interventions
    interventions = await service.get_interventions(user_id=None)
    # Filter for critical or high priority ones
    alerts = [
        item.model_dump(mode="json") 
        for item in interventions 
        if item.priority in (InterventionPriority.CRITICAL, InterventionPriority.HIGH)
        and item.status != InterventionStatus.RESOLVED
    ]
    return alerts

@router.get("/students/{student_id}/analytics")
async def get_student_detail_analytics(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    check_teacher_role(current_user)
    service = get_personalization_service()
    return await service.get_teacher_projection(student_id)
