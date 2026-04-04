"""
AI Queue Router — Faculty verification of AI-generated answers.

DB schema (actual):
  ai_answer_queue:
    id UUID PK
    student_id UUID NOT NULL  → submitting student
    teacher_id UUID NOT NULL  → course teacher
    course_id  UUID           → course reference
    student_question TEXT     → student's original question
    ai_generated_answer TEXT  → AI draft answer
    teacher_edited_answer TEXT → approved / edited answer
    status TEXT DEFAULT 'pending'
    created_at TIMESTAMPTZ
    verified_at TIMESTAMPTZ
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime, timezone

from .auth import get_current_user
from app.api.deps import get_current_teacher
from app.database.supabase_manager import supabase_db
from app.core.audit import audit_logger

router = APIRouter()


# ── Request models ─────────────────────────────────────────────────────────────

class AskQuestionRequest(BaseModel):
    question_text: str
    context_lecture_id: Optional[str] = None


class EditApproveRequest(BaseModel):
    final_answer: str
    faculty_note: Optional[str] = None


class RejectRequest(BaseModel):
    faculty_note: str


class EscalateRequest(BaseModel):
    reason: Optional[str] = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _client():
    return supabase_db.get_client()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_course_teacher(client: Any, course_id: str, fallback_id: str) -> str:
    """Look up the teacher_id for a course; fall back to fallback_id if not found."""
    try:
        res = client.table("courses").select("teacher_id").eq("id", course_id).limit(1).execute()
        if res.data:
            return res.data[0].get("teacher_id") or fallback_id
    except Exception:
        pass
    return fallback_id


def _ensure_verified_answer_entry(
    client: Any,
    queue_id: str,
    question_text: str,
    answer: str,
    course_id: Optional[str],
    reviewer_id: str,
):
    try:
        existing = (
            client.table("verified_answers_bank")
            .select("id")
            .eq("source_queue_id", queue_id)
            .limit(1)
            .execute()
        )
        if existing.data:
            return existing.data[0]

        result = client.table("verified_answers_bank").insert({
            "question":       question_text,
            "answer":         answer,
            "course_id":      course_id,
            "source_queue_id": queue_id,
            "created_by":     reviewer_id,
            "verified_by":    reviewer_id,
            "answer_type":    "text",
            "is_active":      True,
            "difficulty":     "medium",
        }).execute()
        return (result.data or [None])[0]
    except Exception:
        # verified_answers_bank may not exist; silently skip
        return None


# ── Student endpoint: ask a question ──────────────────────────────────────────

@router.post("/courses/{course_id}/questions")
async def ask_question(
    course_id: str,
    body: AskQuestionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Student submits a question for a course."""
    student_id = current_user.get("id")
    if not student_id:
        raise HTTPException(status_code=401, detail="Could not identify student")

    try:
        client = _client()

        # Resolve course teacher for teacher_id (required NOT NULL)
        teacher_id = _get_course_teacher(client, course_id, student_id)

        # Insert directly into ai_answer_queue (the real schema)
        res = client.table("ai_answer_queue").insert({
            "student_id":          student_id,
            "teacher_id":          teacher_id,
            "course_id":           course_id,
            "student_question":    body.question_text,
            "ai_generated_answer": "Processing...",
            "status":              "pending",
            "created_at":          _now_iso(),
        }).execute()

        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to save question")

        queue_id = res.data[0]["id"]
        return {
            "question_id": queue_id,
            "status":      "pending_review",
            "message":     "Your question has been submitted for teacher review",
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── List questions for a course ────────────────────────────────────────────────

@router.get("/courses/{course_id}/questions")
async def list_course_questions(
    course_id: str,
    current_user: dict = Depends(get_current_user),
):
    """List Q&As for a course. Students see only approved answers; faculty see all."""
    is_faculty = current_user.get("role") in {
        "teacher", "faculty", "hod", "college_admin", "admin", "super_admin"
    }
    try:
        client = _client()

        aq_res = (
            client.table("ai_answer_queue")
            .select("*")
            .eq("course_id", course_id)
            .order("created_at", desc=True)
            .execute()
        )

        results = []
        for row in aq_res.data or []:
            q_status = row.get("status", "pending")

            # Students only see approved answers
            if not is_faculty and q_status not in ("approved", "edited_approved"):
                continue

            answer = None
            if q_status in ("approved", "edited_approved"):
                answer = {
                    "final_answer": (
                        row.get("teacher_edited_answer") or row.get("ai_generated_answer")
                    ),
                    "verified_at": row.get("verified_at"),
                    "status": q_status,
                }

            results.append({
                "question_id":   row["id"],
                "question_text": row.get("student_question", ""),
                "created_at":    row.get("created_at"),
                "answer":        answer,
                "queue_status":  q_status,
            })

        return results
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Student: poll question status ─────────────────────────────────────────────

@router.get("/student/questions/{question_id}/status")
async def question_status(
    question_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Student polls their own question's review status."""
    try:
        client = _client()

        res = (
            client.table("ai_answer_queue")
            .select("*")
            .eq("id", question_id)
            .limit(1)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Question not found")

        row = res.data[0]
        student_id = current_user.get("id")
        if student_id and str(row.get("student_id")) != str(student_id):
            raise HTTPException(status_code=403, detail="Not your question")

        approved_answer = None
        if row.get("status") in ("approved", "edited_approved"):
            approved_answer = (
                row.get("teacher_edited_answer") or row.get("ai_generated_answer")
            )

        return {
            "status":      row.get("status", "pending"),
            "final_answer": approved_answer,
            "answered_at": row.get("verified_at"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Faculty: list pending queue items ─────────────────────────────────────────

@router.get("/faculty/ai-queue")
async def faculty_queue(current_user: dict = Depends(get_current_teacher)):
    """Return all pending queue items."""
    try:
        client = _client()

        aq_query = (
            client.table("ai_answer_queue")
            .select("*")
        )
        role = current_user.get("role")
        if role == "teacher":
            aq_query = aq_query.eq("status", "pending")
        elif role == "faculty":
            aq_query = aq_query.eq("status", "escalated_to_faculty")
        elif role == "hod":
            aq_query = aq_query.eq("status", "escalated_to_hod")

        aq_res = aq_query.order("created_at", desc=True).execute()

        items: List[Any] = []
        for row in aq_res.data or []:
            items.append({
                "id":                row["id"],
                "question_id":       row["id"],      # same row — no separate table
                "question_text":     row.get("student_question", ""),
                "student_name":      row.get("student_name", "Student"),
                "student_identifier": "",
                "course_name":       f"Course {row.get('course_id', '')}",
                "lecture_context":   "",
                "ai_draft":          row.get("ai_generated_answer", ""),
                "ai_confidence":     None,
                "ai_sources":        [],
                "status":            row.get("status", "pending"),
                "created_at":        row.get("created_at"),
            })

        total_pending = sum(
            1 for i in items
            if i["status"] in ("pending", "escalated_to_faculty", "escalated_to_hod")
        )
        return {"items": items, "total_pending": total_pending}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Faculty: approve ──────────────────────────────────────────────────────────

@router.post("/faculty/ai-queue/{queue_id}/approve")
async def approve_queue_item(
    queue_id: str,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        client = _client()

        existing = (
            client.table("ai_answer_queue")
            .select("id, ai_generated_answer, course_id, student_question")
            .eq("id", queue_id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Queue item not found")

        q_item     = existing.data[0]
        ai_draft   = q_item.get("ai_generated_answer", "")
        question   = q_item.get("student_question", "Unknown Question")

        if not ai_draft or ai_draft.lower().startswith("processing"):
            # Allow approval anyway; teacher can edit the answer field
            ai_draft = ai_draft or "(No AI answer available)"

        client.table("ai_answer_queue").update({
            "status":                "approved",
            "teacher_edited_answer": ai_draft,
            "verified_at":           _now_iso(),
        }).eq("id", queue_id).execute()

        _ensure_verified_answer_entry(
            client=client,
            queue_id=queue_id,
            question_text=question,
            answer=ai_draft,
            course_id=q_item.get("course_id"),
            reviewer_id=current_user["id"],
        )

        audit_logger.log(
            action="ai_answer_approved",
            user_id=str(current_user["id"]),
            resource_id=str(queue_id),
            metadata={"course_id": q_item.get("course_id"), "approval_type": "direct"},
        )

        return {"success": True, "status": "approved"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Faculty: edit + approve ───────────────────────────────────────────────────

@router.post("/faculty/ai-queue/{queue_id}/edit-approve")
async def edit_approve_queue_item(
    queue_id: str,
    body: EditApproveRequest,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        client = _client()

        existing = (
            client.table("ai_answer_queue")
            .select("id, course_id, student_question")
            .eq("id", queue_id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Queue item not found")

        q_item = existing.data[0]

        client.table("ai_answer_queue").update({
            "status":                "edited_approved",
            "teacher_edited_answer": body.final_answer,
            "verified_at":           _now_iso(),
        }).eq("id", queue_id).execute()

        _ensure_verified_answer_entry(
            client=client,
            queue_id=queue_id,
            question_text=q_item.get("student_question", ""),
            answer=body.final_answer,
            course_id=q_item.get("course_id"),
            reviewer_id=current_user["id"],
        )

        audit_logger.log(
            action="ai_answer_approved",
            user_id=str(current_user["id"]),
            resource_id=str(queue_id),
            metadata={"course_id": q_item.get("course_id"), "approval_type": "edited"},
        )

        return {"success": True, "status": "edited_approved"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Faculty: reject ───────────────────────────────────────────────────────────

@router.post("/faculty/ai-queue/{queue_id}/reject")
async def reject_queue_item(
    queue_id: str,
    body: RejectRequest,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        client = _client()

        existing = (
            client.table("ai_answer_queue").select("id").eq("id", queue_id).execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Queue item not found")

        client.table("ai_answer_queue").update({
            "status":     "rejected",
            "verified_at": _now_iso(),
        }).eq("id", queue_id).execute()

        audit_logger.log(
            action="ai_answer_rejected",
            user_id=str(current_user["id"]),
            resource_id=str(queue_id),
            metadata={"reason": body.faculty_note},
        )

        return {"success": True, "status": "rejected"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Faculty: escalate ─────────────────────────────────────────────────────────

@router.post("/faculty/ai-queue/{queue_id}/escalate")
async def escalate_queue_item(
    queue_id: str,
    body: EscalateRequest,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        client = _client()
        existing = (
            client.table("ai_answer_queue")
            .select("id, status")
            .eq("id", queue_id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Queue item not found")

        role = current_user.get("role", "teacher")
        new_status = (
            "escalated_to_faculty" if role == "teacher"
            else "escalated_to_hod"
        )

        client.table("ai_answer_queue").update({
            "status": new_status,
        }).eq("id", queue_id).execute()

        return {"success": True, "status": new_status}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
