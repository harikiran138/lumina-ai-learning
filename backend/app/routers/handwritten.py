import os
import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form
from pydantic import BaseModel
from app.database.supabase_manager import supabase_db
from app.database.models import (
    HandwrittenAssignment, HandwrittenQuestion, HandwrittenSubmission,
    SubmissionStatus, QuestionStatus, Rubric
)
from app.routers.auth import get_current_user
from app.core.config import settings
from app.core.logging import structlog
from app.services.handwritten_pipeline import process_handwritten_submission

log = structlog.get_logger()
router = APIRouter()

# ── Assignments ───────────────────────────────────────────────────────────────

@router.post("/assignments", response_model=HandwrittenAssignment)
async def create_assignment(
    title: str = Form(...),
    description: str = Form(""),
    total_marks: int = Form(0),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ["teacher", "faculty", "hod", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")
    
    assignment = HandwrittenAssignment(
        teacher_id=current_user["id"],
        title=title,
        description=description,
        total_marks=total_marks
    )
    await supabase_db.insert("handwritten_assignments", assignment.model_dump())
    return assignment


@router.post("/assignments/{assignment_id}/questions", response_model=HandwrittenQuestion)
async def add_question(
    assignment_id: str,
    number: int = Form(...),
    text: str = Form(...),
    max_marks: int = Form(...),
    rubric_json: str = Form(...), # Expecting JSON string for complexity
    current_user: dict = Depends(get_current_user)
):
    import json
    try:
        rubric_data = json.loads(rubric_json)
        rubric = Rubric(**rubric_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid rubric JSON")

    question = HandwrittenQuestion(
        assignment_id=assignment_id,
        number=number,
        text=text,
        max_marks=max_marks,
        rubric=rubric
    )
    await supabase_db.insert("handwritten_questions", question.model_dump())
    return question


# ── Submissions ───────────────────────────────────────────────────────────────

@router.post("/submissions", response_model=HandwrittenSubmission)
async def upload_submission(
    background_tasks: BackgroundTasks,
    assignment_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # 1. Validation
    if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only PDF or Image files allowed")
    
    # 2. Save file locally (Vercel/Serverless compatible)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{file_ext}")
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # 3. Create Submission Record
    submission = HandwrittenSubmission(
        assignment_id=assignment_id,
        student_id=current_user["id"],
        original_file_path=file_path,
        file_type="pdf" if "pdf" in file.content_type else "image"
    )
    await supabase_db.insert("handwritten_submissions", submission.model_dump())

    # 4. Trigger Background Processing
    background_tasks.add_task(process_handwritten_submission, submission.id)

    return submission


@router.get("/submissions/{submission_id}", response_model=HandwrittenSubmission)
async def get_submission(submission_id: str, current_user: dict = Depends(get_current_user)):
    sub = await supabase_db.fetch_one("handwritten_submissions", {"id": submission_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub


@router.get("/submissions/{submission_id}/results")
async def get_submission_results(submission_id: str, current_user: dict = Depends(get_current_user)):
    questions = await supabase_db.fetch_all("handwritten_submission_questions", {"submission_id": submission_id})
    return questions


# ── Teacher Review ────────────────────────────────────────────────────────────

@router.post("/submissions/{submission_id}/questions/{question_id}/override")
async def override_grade(
    submission_id: str,
    question_id: str,
    score: float = Form(...),
    feedback: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ["teacher", "faculty", "hod", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only teachers can override grades")
    
    now = datetime.now(timezone.utc).isoformat()
    update = {
        "status": "teacher_reviewed",
        "teacher_score": score,
        "teacher_feedback": feedback,
        "final_score": score,
        "overridden_at": now,
    }

    await supabase_db.update("handwritten_submission_questions", update, {
        "submission_id": submission_id,
        "question_id": question_id
    })

    # Recalculate total score
    all_q = await supabase_db.fetch_all("handwritten_submission_questions", {"submission_id": submission_id})
    total = sum(q.get("final_score") or 0 for q in all_q)

    await supabase_db.update("handwritten_submissions", {
        "teacher_total_score": total,
        "final_score": total,
        "status": "teacher_reviewed"
    }, {"id": submission_id})

    return {"success": True, "total_score": total}


class GradeBody(BaseModel):
    teacher_score: float
    teacher_feedback: str = ""


@router.put("/submissions/{submission_id}/questions/{question_id}/grade")
async def grade_question(
    submission_id: str,
    question_id: str,
    body: GradeBody,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ["teacher", "faculty", "hod", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only teachers can grade")
    now = datetime.now(timezone.utc).isoformat()
    update = {
        "status": "teacher_reviewed",
        "teacher_score": body.teacher_score,
        "teacher_feedback": body.teacher_feedback,
        "final_score": body.teacher_score,
        "overridden_at": now,
    }
    await supabase_db.update("handwritten_submission_questions", update, {
        "submission_id": submission_id,
        "question_id": question_id
    })
    all_q = await supabase_db.fetch_all("handwritten_submission_questions", {"submission_id": submission_id})
    total = sum(q.get("final_score") or 0 for q in all_q)
    await supabase_db.update("handwritten_submissions", {
        "teacher_total_score": total,
        "final_score": total,
        "status": "teacher_reviewed"
    }, {"id": submission_id})
    return {"success": True, "total_score": total}
