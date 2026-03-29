"""
API Routes — Assignments & Submissions.
"""
import shutil
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import get_db
from app.models.models import (
    Assignment, Question, Submission, SubmissionQuestion,
    SubmissionStatus, QuestionStatus
)
from app.services.pipeline_service import process_submission

settings = get_settings()
router   = APIRouter()

DB = Annotated[AsyncSession, Depends(get_db)]


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CriterionIn(BaseModel):
    label: str
    marks: int
    description: str = ""


class RubricIn(BaseModel):
    criteria: list[CriterionIn] = []
    keywords: list[str] = []
    sample_answer: str = ""


class QuestionIn(BaseModel):
    number: int
    text: str
    max_marks: int = Field(..., gt=0)
    rubric: RubricIn = RubricIn()


class AssignmentIn(BaseModel):
    title: str
    description: str = ""
    teacher_id: str
    questions: list[QuestionIn]


class TeacherOverrideIn(BaseModel):
    teacher_score: float = Field(..., ge=0)
    teacher_feedback: str = ""
    override_reason: str = ""


# ── Assignment CRUD ───────────────────────────────────────────────────────────

@router.post("/assignments", status_code=status.HTTP_201_CREATED)
async def create_assignment(body: AssignmentIn, db: DB):
    total = sum(q.max_marks for q in body.questions)
    asgn = Assignment(
        teacher_id=body.teacher_id,
        title=body.title,
        description=body.description,
        total_marks=total,
    )
    db.add(asgn)
    await db.flush()

    for q in body.questions:
        db.add(Question(
            assignment_id=asgn.id,
            number=q.number,
            text=q.text,
            max_marks=q.max_marks,
            rubric=q.rubric.model_dump(),
        ))

    await db.commit()
    return {"id": asgn.id, "title": asgn.title, "total_marks": total}


@router.get("/assignments/{assignment_id}")
async def get_assignment(assignment_id: str, db: DB):
    asgn = await db.get(Assignment, assignment_id)
    if not asgn:
        raise HTTPException(404, "Assignment not found")
    qs = await db.execute(select(Question).where(Question.assignment_id == assignment_id).order_by(Question.number))
    questions = qs.scalars().all()
    return {
        "id": asgn.id,
        "title": asgn.title,
        "description": asgn.description,
        "total_marks": asgn.total_marks,
        "questions": [
            {"id": q.id, "number": q.number, "text": q.text, "max_marks": q.max_marks, "rubric": q.rubric}
            for q in questions
        ],
    }


# ── Submission upload ─────────────────────────────────────────────────────────

@router.post("/submissions/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_submission(
    assignment_id: str,
    student_id: str,
    file: UploadFile,
    background_tasks: BackgroundTasks,
    db: DB,
):
    # Validate file type
    allowed = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed:
        raise HTTPException(400, f"File type not allowed. Use: {', '.join(allowed)}")

    # Validate size
    content = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(400, f"File too large. Max {settings.max_file_size_mb}MB.")

    # Save file
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    import uuid
    filename = f"{uuid.uuid4()}{suffix}"
    file_path = settings.upload_dir / filename
    file_path.write_bytes(content)

    # Create submission record
    sub = Submission(
        assignment_id=assignment_id,
        student_id=student_id,
        original_file_path=str(file_path),
        file_type="pdf" if suffix == ".pdf" else "image",
    )
    db.add(sub)
    await db.commit()

    # Kick off async pipeline
    background_tasks.add_task(process_submission, sub.id)

    return {
        "submission_id": sub.id,
        "status": sub.status,
        "message": "Submission received. Processing started.",
    }


# ── Teacher dashboard data ────────────────────────────────────────────────────

@router.get("/submissions/{submission_id}/review")
async def get_review_data(submission_id: str, db: DB):
    """
    Full review payload for teacher dashboard.
    Returns per-question: scan crop, OCR text, AI score + reasoning.
    """
    sub = await db.get(Submission, submission_id)
    if not sub:
        raise HTTPException(404, "Submission not found")

    sq_result = await db.execute(
        select(SubmissionQuestion, Question)
        .join(Question, SubmissionQuestion.question_id == Question.id)
        .where(SubmissionQuestion.submission_id == submission_id)
        .order_by(Question.number)
    )
    rows = sq_result.all()

    questions_out = []
    for sq, q in rows:
        questions_out.append({
            "sq_id":          sq.id,
            "question_number": q.number,
            "question_text":   q.text,
            "max_marks":       q.max_marks,
            "rubric":          q.rubric,
            "status":          sq.status,
            # OCR
            "ocr_text":       sq.ocr_raw_text,
            "ocr_confidence": sq.ocr_confidence,
            "ocr_is_flagged": sq.ocr_is_flagged,
            # AI result
            "ai_score":       sq.ai_score,
            "ai_reasoning":   sq.ai_reasoning,
            "ai_feedback":    sq.ai_feedback,
            "ai_confidence":  sq.ai_confidence,
            # Teacher decision
            "teacher_score":   sq.teacher_score,
            "teacher_feedback": sq.teacher_feedback,
            "override_reason": sq.teacher_override_reason,
            # Final
            "final_score": sq.final_score,
            "segment_image_url": f"/api/submissions/{submission_id}/segment/{sq.id}" if sq.segment_image_path else None,
        })

    return {
        "submission_id":   sub.id,
        "student_id":      sub.student_id,
        "assignment_id":   sub.assignment_id,
        "status":          sub.status,
        "ai_total_score":  sub.ai_total_score,
        "teacher_total_score": sub.teacher_total_score,
        "final_score":     sub.final_score,
        "processing_log":  sub.processing_log,
        "questions":       questions_out,
    }


@router.get("/submissions/{submission_id}/segment/{sq_id}")
async def get_segment_image(submission_id: str, sq_id: str, db: DB):
    """Serve the cropped segment image for a specific question."""
    sq = await db.get(SubmissionQuestion, sq_id)
    if not sq or sq.submission_id != submission_id:
        raise HTTPException(404)
    if not sq.segment_image_path or not Path(sq.segment_image_path).exists():
        raise HTTPException(404, "Segment image not found")
    return FileResponse(sq.segment_image_path, media_type="image/png")


# ── Teacher override ──────────────────────────────────────────────────────────

@router.patch("/submissions/{submission_id}/questions/{sq_id}/override")
async def override_question(submission_id: str, sq_id: str, body: TeacherOverrideIn, db: DB):
    """Teacher overrides the AI score for one question."""
    sq = await db.get(SubmissionQuestion, sq_id)
    if not sq or sq.submission_id != submission_id:
        raise HTTPException(404)

    sq.teacher_score    = body.teacher_score
    sq.teacher_feedback = body.teacher_feedback
    sq.teacher_override_reason = body.override_reason
    sq.status           = QuestionStatus.OVERRIDDEN
    sq.final_score      = body.teacher_score

    from datetime import datetime
    sq.overridden_at = datetime.utcnow()
    await db.commit()

    return {"sq_id": sq.id, "final_score": sq.final_score, "status": sq.status}


@router.patch("/submissions/{submission_id}/questions/{sq_id}/accept")
async def accept_question(submission_id: str, sq_id: str, db: DB):
    """Teacher accepts AI score as-is."""
    sq = await db.get(SubmissionQuestion, sq_id)
    if not sq or sq.submission_id != submission_id:
        raise HTTPException(404)

    sq.status      = QuestionStatus.ACCEPTED
    sq.final_score = sq.ai_score
    await db.commit()

    return {"sq_id": sq.id, "final_score": sq.final_score, "status": sq.status}


@router.post("/submissions/{submission_id}/finalize")
async def finalize_submission(submission_id: str, db: DB):
    """
    Teacher finalizes the submission.
    Computes total from per-question finals and marks as published.
    """
    sub = await db.get(Submission, submission_id)
    if not sub:
        raise HTTPException(404)

    sq_result = await db.execute(
        select(SubmissionQuestion).where(SubmissionQuestion.submission_id == submission_id)
    )
    sq_items = sq_result.scalars().all()

    # Check all questions have a final score
    unresolved = [sq for sq in sq_items if sq.final_score is None]
    if unresolved:
        raise HTTPException(400, f"{len(unresolved)} question(s) still need teacher review.")

    total = sum(sq.final_score for sq in sq_items)
    sub.final_score  = total
    sub.teacher_total_score = total
    sub.status       = SubmissionStatus.PUBLISHED
    sub.finalized_at = __import__("datetime").datetime.utcnow()
    await db.commit()

    return {
        "submission_id": sub.id,
        "final_score":   sub.final_score,
        "status":        sub.status,
        "message":       "Grade published to student.",
    }


@router.get("/submissions/{submission_id}/status")
async def get_status(submission_id: str, db: DB):
    sub = await db.get(Submission, submission_id)
    if not sub:
        raise HTTPException(404)
    return {"status": sub.status, "processing_log": sub.processing_log[-5:]}
