"""
Database models for the Handwritten Assignment System.
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, JSON, Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


# ── Enums ─────────────────────────────────────────────────────────────────────

class SubmissionStatus(str, enum.Enum):
    PENDING        = "pending"        # uploaded, not yet processed
    PROCESSING     = "processing"     # OCR / segmentation running
    NEEDS_RESCAN   = "needs_rescan"   # image quality too low
    AI_EVALUATED   = "ai_evaluated"   # AI draft ready
    TEACHER_REVIEW = "teacher_review" # teacher is reviewing
    FINALIZED      = "finalized"      # teacher accepted / overrode
    PUBLISHED      = "published"      # visible to student


class QuestionStatus(str, enum.Enum):
    PENDING    = "pending"
    OCR_DONE   = "ocr_done"
    AI_GRADED  = "ai_graded"
    ACCEPTED   = "accepted"    # teacher accepted AI score
    OVERRIDDEN = "overridden"  # teacher changed score
    FLAGGED    = "flagged"     # low confidence, needs manual


# ── Models ────────────────────────────────────────────────────────────────────

class Assignment(Base):
    """Teacher creates this — defines the questions and rubric."""
    __tablename__ = "assignments"

    id:          Mapped[str]      = mapped_column(String, primary_key=True, default=gen_uuid)
    teacher_id:  Mapped[str]      = mapped_column(String, nullable=False, index=True)
    title:       Mapped[str]      = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    total_marks: Mapped[int]      = mapped_column(Integer, default=100)
    created_at:  Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    due_date:    Mapped[Optional[datetime]] = mapped_column(DateTime)
    is_active:   Mapped[bool]     = mapped_column(Boolean, default=True)

    questions:    Mapped[list["Question"]]   = relationship("Question",    back_populates="assignment", cascade="all, delete")
    submissions:  Mapped[list["Submission"]] = relationship("Submission",  back_populates="assignment", cascade="all, delete")


class Question(Base):
    """One question within an assignment, with its rubric."""
    __tablename__ = "questions"

    id:            Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    assignment_id: Mapped[str] = mapped_column(String, ForeignKey("assignments.id"), nullable=False)
    number:        Mapped[int] = mapped_column(Integer, nullable=False)   # Q1, Q2 …
    text:          Mapped[str] = mapped_column(Text, nullable=False)      # question wording
    max_marks:     Mapped[int] = mapped_column(Integer, nullable=False)
    rubric:        Mapped[dict] = mapped_column(JSON, default=dict)
    # rubric schema: { "criteria": [{"label": "...", "marks": N, "description": "..."}],
    #                  "keywords": ["..."], "sample_answer": "..." }

    assignment: Mapped["Assignment"] = relationship("Assignment", back_populates="questions")
    answers:    Mapped[list["SubmissionQuestion"]] = relationship("SubmissionQuestion", back_populates="question")


class Submission(Base):
    """A student's submission for an assignment."""
    __tablename__ = "submissions"

    id:            Mapped[str]             = mapped_column(String, primary_key=True, default=gen_uuid)
    assignment_id: Mapped[str]             = mapped_column(String, ForeignKey("assignments.id"), nullable=False)
    student_id:    Mapped[str]             = mapped_column(String, nullable=False, index=True)
    status:        Mapped[SubmissionStatus] = mapped_column(SAEnum(SubmissionStatus), default=SubmissionStatus.PENDING)

    # File storage
    original_file_path: Mapped[str]           = mapped_column(String, nullable=False)
    file_type:          Mapped[str]           = mapped_column(String(10))   # "pdf" | "image"
    page_count:         Mapped[int]           = mapped_column(Integer, default=1)

    # Scores
    ai_total_score:       Mapped[Optional[float]] = mapped_column(Float)
    teacher_total_score:  Mapped[Optional[float]] = mapped_column(Float)
    final_score:          Mapped[Optional[float]] = mapped_column(Float)

    # Metadata
    submitted_at:  Mapped[datetime]        = mapped_column(DateTime, default=datetime.utcnow)
    finalized_at:  Mapped[Optional[datetime]] = mapped_column(DateTime)
    teacher_note:  Mapped[Optional[str]]   = mapped_column(Text)
    processing_log: Mapped[list]           = mapped_column(JSON, default=list)

    assignment: Mapped["Assignment"]              = relationship("Assignment", back_populates="submissions")
    sq_items:   Mapped[list["SubmissionQuestion"]] = relationship("SubmissionQuestion", back_populates="submission", cascade="all, delete")


class SubmissionQuestion(Base):
    """Per-question result for a submission."""
    __tablename__ = "submission_questions"

    id:            Mapped[str]           = mapped_column(String, primary_key=True, default=gen_uuid)
    submission_id: Mapped[str]           = mapped_column(String, ForeignKey("submissions.id"), nullable=False)
    question_id:   Mapped[str]           = mapped_column(String, ForeignKey("questions.id"), nullable=False)
    status:        Mapped[QuestionStatus] = mapped_column(SAEnum(QuestionStatus), default=QuestionStatus.PENDING)

    # Image segment
    segment_image_path: Mapped[Optional[str]] = mapped_column(String)
    segment_bbox:       Mapped[Optional[dict]] = mapped_column(JSON)   # {x, y, w, h}

    # OCR output
    ocr_raw_text:    Mapped[Optional[str]]   = mapped_column(Text)
    ocr_confidence:  Mapped[Optional[float]] = mapped_column(Float)
    ocr_is_flagged:  Mapped[bool]            = mapped_column(Boolean, default=False)

    # AI evaluation
    ai_score:     Mapped[Optional[float]] = mapped_column(Float)
    ai_reasoning: Mapped[Optional[str]]   = mapped_column(Text)
    ai_feedback:  Mapped[Optional[str]]   = mapped_column(Text)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float)

    # Teacher decision
    teacher_score:    Mapped[Optional[float]] = mapped_column(Float)
    teacher_feedback: Mapped[Optional[str]]   = mapped_column(Text)
    teacher_override_reason: Mapped[Optional[str]] = mapped_column(Text)
    overridden_at:    Mapped[Optional[datetime]]   = mapped_column(DateTime)

    # Final (teacher_score if overridden, else ai_score)
    final_score: Mapped[Optional[float]] = mapped_column(Float)

    submission: Mapped["Submission"] = relationship("Submission", back_populates="sq_items")
    question:   Mapped["Question"]   = relationship("Question",   back_populates="answers")
