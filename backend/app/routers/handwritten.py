import os
import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form
from pydantic import BaseModel
from app.database.scoped_db import get_scoped_db
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
@router.get("/assignments/stats")
async def get_assignment_stats(current_user: dict = Depends(get_current_user)):
    """Teacher-only stats for all assignments."""
    if current_user.get("role") not in ["teacher", "faculty", "hod", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only teachers can view stats")
    
    db = get_scoped_db(current_user)
    assignments = await db.fetch_all("handwritten_assignments", {"teacher_id": current_user["id"]})
    
    stats = []
    for a in assignments:
        submissions = await db.fetch_all("handwritten_submissions", {"assignment_id": a["id"]})
        count = len(submissions)
        avg_score = sum(s.get("final_score") or 0 for s in submissions) / count if count > 0 else 0
        stats.append({
            "assignment_id": a["id"],
            "title": a["title"],
            "submission_count": count,
            "average_score": round(avg_score, 2)
        })
    return {"assignments": stats}


@router.post("/assignments", response_model=HandwrittenAssignment)
async def create_assignment(
    title: str = Form(...),
    description: str = Form(""),
    total_marks: int = Form(0),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") not in ["teacher", "faculty", "hod", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")
    
    db = get_scoped_db(current_user)
    assignment = HandwrittenAssignment(
        teacher_id=current_user["id"],
        title=title,
        description=description,
        total_marks=total_marks
    )
    await db.insert("handwritten_assignments", assignment.model_dump())
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

    db = get_scoped_db(current_user)
    question = HandwrittenQuestion(
        assignment_id=assignment_id,
        number=number,
        text=text,
        max_marks=max_marks,
        rubric=rubric
    )
    await db.insert("handwritten_questions", question.model_dump())
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
    
    db = get_scoped_db(current_user)
    
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
    await db.insert("handwritten_submissions", submission.model_dump())

    # 4. Trigger Background Processing
    background_tasks.add_task(process_handwritten_submission, submission.id)

    return submission


@router.get("/submissions/{submission_id}", response_model=HandwrittenSubmission)
async def get_submission(submission_id: str, current_user: dict = Depends(get_current_user)):
    db = get_scoped_db(current_user)
    sub = await db.fetch_one("handwritten_submissions", {"id": submission_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub


@router.get("/submissions/{submission_id}/export")
async def export_submission_results(submission_id: str, current_user: dict = Depends(get_current_user)):
    """Export results as a structured JSON object for further analysis."""
    db = get_scoped_db(current_user)
    sub = await db.fetch_one("handwritten_submissions", {"id": submission_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    questions = await db.fetch_all("handwritten_submission_questions", {"submission_id": submission_id})
    
    export_data = {
        "student_id": sub["student_id"],
        "assignment_id": sub["assignment_id"],
        "final_score": sub["final_score"],
        "status": sub["status"],
        "graded_at": sub.get("updated_at"),
        "questions": [
            {
                "question_id": q["question_id"],
                "score": q["final_score"],
                "feedback": q.get("teacher_feedback") or q.get("ai_feedback"),
                "status": q["status"]
            } for q in questions
        ]
    }
    return export_data


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
    
    db = get_scoped_db(current_user)
    now = datetime.now(timezone.utc).isoformat()
    update = {
        "status": "teacher_reviewed",
        "teacher_score": score,
        "teacher_feedback": feedback,
        "final_score": score,
        "overridden_at": now,
    }

    await db.update("handwritten_submission_questions", update, {
        "submission_id": submission_id,
        "question_id": question_id
    })

    # Recalculate total score
    all_q = await db.fetch_all("handwritten_submission_questions", {"submission_id": submission_id})
    total = sum(q.get("final_score") or 0 for q in all_q)

    await db.update("handwritten_submissions", {
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
    
    db = get_scoped_db(current_user)
    now = datetime.now(timezone.utc).isoformat()
    update = {
        "status": "teacher_reviewed",
        "teacher_score": body.teacher_score,
        "teacher_feedback": body.teacher_feedback,
        "final_score": body.teacher_score,
        "overridden_at": now,
    }
    await db.update("handwritten_submission_questions", update, {
        "submission_id": submission_id,
        "question_id": question_id
    })
    all_q = await db.fetch_all("handwritten_submission_questions", {"submission_id": submission_id})
    total = sum(q.get("final_score") or 0 for q in all_q)
    await db.update("handwritten_submissions", {
        "teacher_total_score": total,
        "final_score": total,
        "status": "teacher_reviewed"
    }, {"id": submission_id})
    return {"success": True, "total_score": total}
