import os
import sys

import pytest
from fastapi import HTTPException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.supabase_manager import supabase_db
from app.routers.ai_queue import approve_queue_item
from app.routers.student import submit_student_assignment


@pytest.mark.asyncio
async def test_student_assignment_submission_persists_course_id_and_audit_log():
    client = supabase_db.get_client(force_new=True)
    client.table("assignments").insert(
        {
            "id": "assignment-hardening-1",
            "course_id": "course-hardening-1",
            "title": "Systems Homework",
        }
    ).execute()

    current_user = {
        "id": "student-hardening-1",
        "role": "student",
        "batch_id": "2026",
        "section": "A",
    }

    submission = await submit_student_assignment(
        "assignment-hardening-1",
        {"text_content": "My submission"},
        current_user=current_user,
    )

    assert submission["assignment_id"] == "assignment-hardening-1"
    assert submission["course_id"] == "course-hardening-1"

    audit_rows = client.table("audit_logs").select("*").eq("action", "assignment_submitted").execute().data or []
    assert len(audit_rows) == 1
    assert audit_rows[0]["user_id"] == "student-hardening-1"

    with pytest.raises(HTTPException) as exc_info:
        await submit_student_assignment(
            "assignment-hardening-1",
            {"text_content": "Second submission"},
            current_user=current_user,
        )

    assert exc_info.value.status_code == 409


@pytest.mark.asyncio
async def test_ai_queue_approval_only_banks_answer_once():
    client = supabase_db.get_client(force_new=True)
    client.table("ai_answer_queue").insert(
        {
            "id": "queue-hardening-1",
            "question_id": "question-hardening-1",
            "course_id": "course-hardening-1",
            "ai_generated_answer": "A verified answer",
            "status": "pending",
        }
    ).execute()

    reviewer = {"id": "teacher-hardening-1", "role": "teacher"}

    first = await approve_queue_item("queue-hardening-1", current_user=reviewer)
    second = await approve_queue_item("queue-hardening-1", current_user=reviewer)

    assert first["status"] == "approved"
    assert second["status"] == "approved"

    bank_rows = (
        client.table("verified_answers_bank")
        .select("*")
        .eq("source_queue_id", "queue-hardening-1")
        .execute()
        .data
        or []
    )
    assert len(bank_rows) == 1
