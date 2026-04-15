"""
ai_queue_schema.py — Canonical AI queue DTOs.

All three roles (student, teacher, admin) must use these schemas.
No other queue representation is permitted in routers or services.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class AIQueueStatus(str, Enum):
    pending = "pending"
    ai_answered = "ai_answered"
    provisional = "provisional"
    approved = "approved"
    edited_approved = "edited_approved"
    rejected = "rejected"
    escalated_to_faculty = "escalated_to_faculty"
    escalated_to_hod = "escalated_to_hod"


class AIQueueItem(BaseModel):
    """
    Canonical AI queue item. Internal full representation used by the service layer.
    All three roles (student, teacher, admin) are derived from this base.
    """
    id: str
    student_id: str
    teacher_id: Optional[str] = None
    course_id: Optional[str] = None
    student_question: str
    ai_generated_answer: Optional[str] = None
    teacher_edited_answer: Optional[str] = None
    status: AIQueueStatus = AIQueueStatus.pending
    teacher_note: Optional[str] = None
    ai_confidence: Optional[float] = None
    released_to_student: bool = False
    created_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

    class Config:
        extra = "ignore"  # tolerate unknown columns from DB


class AIQueueStudentView(BaseModel):
    """
    Student-facing view of a queue item.
    Student sees their own question + final approved answer only.
    Teacher notes and draft answers are never exposed.
    """
    id: str
    question: str
    status: AIQueueStatus
    final_answer: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        extra = "ignore"

    @classmethod
    def from_item(cls, item: dict) -> "AIQueueStudentView":
        return cls(
            id=item["id"],
            question=item.get("student_question", ""),
            status=item.get("status", AIQueueStatus.pending),
            final_answer=item.get("teacher_edited_answer") or item.get("ai_generated_answer"),
            created_at=item.get("created_at"),
        )


class AIQueueTeacherView(BaseModel):
    """
    Teacher-facing view of a queue item.
    Teacher sees the AI draft, student question, and all decision fields.
    """
    id: str
    student_id: str
    course_id: Optional[str] = None
    question_text: str
    ai_draft: Optional[str] = None
    ai_confidence: Optional[float] = None
    status: AIQueueStatus
    teacher_note: Optional[str] = None
    created_at: Optional[datetime] = None
    time_pending_sec: int = 0
    released_to_student: bool = False
    request_mode: Optional[str] = None

    class Config:
        extra = "ignore"

    @classmethod
    def from_item(cls, item: dict, time_pending_sec: int = 0) -> "AIQueueTeacherView":
        return cls(
            id=item["id"],
            student_id=item.get("student_id", ""),
            course_id=item.get("course_id"),
            question_text=item.get("student_question", ""),
            ai_draft=item.get("ai_generated_answer"),
            ai_confidence=item.get("ai_confidence"),
            status=item.get("status", AIQueueStatus.pending),
            teacher_note=item.get("teacher_note"),
            created_at=item.get("created_at"),
            time_pending_sec=time_pending_sec,
            released_to_student=bool(item.get("released_to_student", False)),
            request_mode=item.get("request_mode"),
        )


class AIQueueAdminView(BaseModel):
    """
    Admin-facing view — sees everything.
    Extends the teacher view with the teacher identity and review metadata.
    """
    id: str
    student_id: str
    teacher_id: Optional[str] = None
    course_id: Optional[str] = None
    question_text: str
    ai_draft: Optional[str] = None
    ai_confidence: Optional[float] = None
    status: AIQueueStatus
    teacher_note: Optional[str] = None
    teacher_edited_answer: Optional[str] = None
    released_to_student: bool = False
    created_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

    class Config:
        extra = "ignore"

    @classmethod
    def from_item(cls, item: dict) -> "AIQueueAdminView":
        return cls(
            id=item["id"],
            student_id=item.get("student_id", ""),
            teacher_id=item.get("teacher_id") or item.get("reviewed_by"),
            course_id=item.get("course_id"),
            question_text=item.get("student_question", ""),
            ai_draft=item.get("ai_generated_answer"),
            ai_confidence=item.get("ai_confidence"),
            status=item.get("status", AIQueueStatus.pending),
            teacher_note=item.get("teacher_note"),
            teacher_edited_answer=item.get("teacher_edited_answer"),
            released_to_student=bool(item.get("released_to_student", False)),
            created_at=item.get("created_at"),
            verified_at=item.get("verified_at"),
        )
