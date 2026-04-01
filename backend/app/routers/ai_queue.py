from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime, timezone

from .auth import get_current_user
from app.api.deps import get_current_teacher
from app.database.supabase_manager import supabase_db

router = APIRouter()




# ── Request models ─────────────────────────────────────────────────────────────

class AskQuestionRequest(BaseModel):
    question_text: str
    context_lecture_id: Optional[int] = None


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


# ── Student endpoints ──────────────────────────────────────────────────────────

@router.post("/courses/{course_id}/questions")
async def ask_question(
    course_id: int,
    body: AskQuestionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Student submits a question for a course."""
    try:
        client = _client()

        # Insert question
        q_res = client.table("course_questions").insert({
            "course_id": course_id,
            "student_id": current_user["id"],
            "question_text": body.question_text,
            "context_lecture_id": body.context_lecture_id,
            "created_at": _now_iso(),
        }).execute()

        if not q_res.data:
            raise HTTPException(status_code=500, detail="Failed to save question")

        question_id = q_res.data[0]["id"]

        # Insert AI queue placeholder
        client.table("ai_answer_queue").insert({
            "question_id": question_id,
            "course_id": course_id,
            "ai_draft": "Processing...",
            "ai_confidence": None,
            "ai_sources": None,
            "status": "pending",
            "created_at": _now_iso(),
        }).execute()

        return {
            "question_id": question_id,
            "status": "pending_review",
            "message": "Your question has been submitted for teacher review",
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/courses/{course_id}/questions")
async def list_course_questions(
    course_id: int,
    current_user: dict = Depends(get_current_user),
):
    """List Q&As for a course. Students see only approved answers; faculty see all."""
    is_faculty = current_user.get("role") in {"teacher", "faculty", "hod", "college_admin", "admin", "super_admin"}
    try:
        client = _client()

        # Fetch questions for this course
        q_res = client.table("course_questions").select("*").eq("course_id", course_id).execute()
        questions = q_res.data or []

        # Fetch all queue entries for this course
        aq_res = client.table("ai_answer_queue").select("*").eq("course_id", course_id).execute()
        queue_map: dict = {row["question_id"]: row for row in (aq_res.data or [])}

        results = []
        for q in questions:
            queue_row = queue_map.get(q["id"])
            q_status = (queue_row or {}).get("status", "pending")

            # Students only see approved answers
            if not is_faculty and q_status not in ("approved", "edited_approved"):
                continue

            answer = None
            if queue_row and q_status in ("approved", "edited_approved"):
                answer = {
                    "final_answer": queue_row.get("final_answer"),
                    "faculty_note": queue_row.get("faculty_note"),
                    "reviewed_at": queue_row.get("reviewed_at"),
                    "status": q_status,
                }

            results.append({
                "question_id": q["id"],
                "question_text": q["question_text"],
                "student_name": q.get("student_name", ""),
                "created_at": q.get("created_at"),
                "answer": answer,
                "queue_status": q_status,
            })

        return results
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/student/questions/{question_id}/status")
async def question_status(
    question_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Student polls their own question's review status."""
    try:
        client = _client()

        q_res = client.table("course_questions").select("*").eq("id", question_id).execute()
        if not q_res.data:
            raise HTTPException(status_code=404, detail="Question not found")

        question = q_res.data[0]
        if str(question.get("student_id")) != str(current_user["id"]):
            raise HTTPException(status_code=403, detail="Not your question")

        aq_res = (
            client.table("ai_answer_queue")
            .select("*")
            .eq("question_id", question_id)
            .execute()
        )
        queue_row = (aq_res.data or [None])[0]

        return {
            "status": (queue_row or {}).get("status", "pending"),
            "final_answer": (queue_row or {}).get("final_answer") if queue_row else None,
            "answered_at": (queue_row or {}).get("reviewed_at") if queue_row else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Faculty endpoints ──────────────────────────────────────────────────────────




@router.get("/faculty/ai-queue")
async def faculty_queue(current_user: dict = Depends(get_current_teacher)):
    """Return all pending queue items across faculty's courses."""
    try:
        client = _client()

        # Fetch queue items for all courses belonging to this faculty
        aq_query = (
            client.table("ai_answer_queue")
            .select(
                "id, question_id, ai_draft, ai_confidence, ai_sources, status, created_at, faculty_note,"
                " course_id,"
                " course_questions(question_text, student_id, created_at, context_lecture_id)"
            )
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
            cq = row.get("course_questions") or {}
            items.append({
                "id": row["id"],
                "question_id": row["question_id"],
                "question_text": cq.get("question_text", ""),
                "student_name": cq.get("student_name", "Unknown"),
                "student_identifier": cq.get("roll_number", ""),
                "course_name": row.get("course_name", f"Course {row.get('course_id', '')}"),
                "lecture_context": cq.get("context_lecture_id", ""),
                "ai_draft": row.get("ai_draft", ""),
                "ai_confidence": row.get("ai_confidence"),
                "ai_sources": row.get("ai_sources") or [],
                "status": row.get("status", "pending"),
                "created_at": row.get("created_at"),
            })

        total_pending = sum(1 for i in items if i["status"] in ("pending", "escalated_to_faculty", "escalated_to_hod"))
        return {"items": items, "total_pending": total_pending}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/faculty/ai-queue/{queue_id}/approve")
async def approve_queue_item(
    queue_id: int,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        client = _client()

        # Verify item exists
        existing = client.table("ai_answer_queue").select("id, ai_draft").eq("id", queue_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Queue item not found")

        ai_draft = existing.data[0].get("ai_draft", "")
        client.table("ai_answer_queue").update({
            "status": "approved",
            "final_answer": ai_draft,
            "reviewed_by": current_user["id"],
            "reviewed_at": _now_iso(),
        }).eq("id", queue_id).execute()

        return {"success": True, "status": "approved"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/faculty/ai-queue/{queue_id}/edit-approve")
async def edit_approve_queue_item(
    queue_id: int,
    body: EditApproveRequest,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        client = _client()

        existing = client.table("ai_answer_queue").select("id").eq("id", queue_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Queue item not found")

        client.table("ai_answer_queue").update({
            "status": "edited_approved",
            "final_answer": body.final_answer,
            "faculty_note": body.faculty_note,
            "reviewed_by": current_user["id"],
            "reviewed_at": _now_iso(),
        }).eq("id", queue_id).execute()

        return {"success": True, "status": "edited_approved"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/faculty/ai-queue/{queue_id}/reject")
async def reject_queue_item(
    queue_id: int,
    body: RejectRequest,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        client = _client()

        existing = client.table("ai_answer_queue").select("id").eq("id", queue_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Queue item not found")

        client.table("ai_answer_queue").update({
            "status": "rejected",
            "faculty_note": body.faculty_note,
            "reviewed_by": current_user["id"],
            "reviewed_at": _now_iso(),
        }).eq("id", queue_id).execute()

        return {"success": True, "status": "rejected"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/faculty/ai-queue/{queue_id}/escalate")
async def escalate_queue_item(
    queue_id: int,
    body: EscalateRequest,
    current_user: dict = Depends(get_current_teacher),
):
    try:
        client = _client()
        existing = client.table("ai_answer_queue").select("id, status").eq("id", queue_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Queue item not found")

        role = current_user.get("role", "teacher")
        
        # Decide new status based on current role
        if role == "teacher":
            new_status = "escalated_to_faculty"
        elif role == "faculty":
            new_status = "escalated_to_hod"
        else:
            raise HTTPException(status_code=400, detail="Cannot escalate further. You are at top of escalation chain.")

        client.table("ai_answer_queue").update({
            "status": new_status,
            "faculty_note": body.reason,
            "reviewed_by": current_user["id"],
            "reviewed_at": _now_iso(),
        }).eq("id", queue_id).execute()

        return {"success": True, "status": new_status}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
