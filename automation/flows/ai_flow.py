"""
Lumina Automation — AI Tutor Flow

Steps:
  1. Student asks a question via POST /api/courses/{course_id}/questions
  2. Faculty fetches the AI queue
  3. Faculty approves the first pending item
  4. Student checks question status
  5. Student chats directly with AI Tutor (POST /api/ai-tutor/chat)
"""

import httpx
from typing import Optional

from automation.config import API, HTTP_TIMEOUT
from automation.logger import log, ok, fail, warn


async def ask_question(
    client: httpx.AsyncClient,
    student_token: str,
    course_id: str,
) -> Optional[str]:
    """Submit a question to the AI queue. Returns the question_id."""
    try:
        resp = await client.post(
            f"{API}/courses/{course_id}/questions",
            json={"question_text": "What is Newton's Second Law and how is it applied?"},
            headers={"Authorization": f"Bearer {student_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            qid = (
                data.get("question_id")
                or data.get("id")
                or (data.get("question") or {}).get("id")
            )
            ok(f"Question submitted to AI queue (id={qid})")
            return qid
        fail(f"Ask question failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return None
    except Exception as exc:
        fail(f"Ask question exception: {exc}")
        return None


async def get_faculty_queue(
    client: httpx.AsyncClient,
    teacher_token: str,
) -> list:
    """Fetch the teacher's AI verification queue."""
    try:
        resp = await client.get(
            f"{API}/faculty/ai-queue",
            headers={"Authorization": f"Bearer {teacher_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code == 200:
            items = resp.json()
            if isinstance(items, dict):
                items = items.get("items") or items.get("data") or []
            ok(f"Faculty AI queue fetched: {len(items)} item(s)")
            return items
        warn(f"Faculty queue HTTP {resp.status_code}: {resp.text[:100]}")
        return []
    except Exception as exc:
        warn(f"Faculty queue exception: {exc}")
        return []


async def approve_queue_item(
    client: httpx.AsyncClient,
    teacher_token: str,
    queue_id: str,
) -> bool:
    """Approve an AI answer in the faculty queue."""
    try:
        resp = await client.post(
            f"{API}/faculty/ai-queue/{queue_id}/approve",
            headers={"Authorization": f"Bearer {teacher_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 204):
            ok(f"Queue item {queue_id} approved by faculty")
            return True
        fail(f"Approval failed for {queue_id}: HTTP {resp.status_code} — {resp.text[:200]}")
        return False
    except Exception as exc:
        fail(f"Approval exception: {exc}")
        return False


async def check_question_status(
    client: httpx.AsyncClient,
    student_token: str,
    question_id: str,
) -> Optional[str]:
    """Check the status of a student's question."""
    try:
        resp = await client.get(
            f"{API}/student/questions/{question_id}/status",
            headers={"Authorization": f"Bearer {student_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code == 200:
            status = resp.json().get("status", "unknown")
            ok(f"Question {question_id} status: {status}")
            return status
        warn(f"Question status HTTP {resp.status_code}")
        return None
    except Exception as exc:
        warn(f"Question status exception: {exc}")
        return None


async def chat_with_tutor(
    client: httpx.AsyncClient,
    student_token: str,
    user_id: str,
) -> bool:
    """Chat directly with the AI Tutor endpoint."""
    try:
        resp = await client.post(
            f"{API}/ai-tutor/chat",
            json={
                "message":    "Explain Newton's Second Law with a real-world example.",
                "user_id":    user_id,
                "session_id": "demo-automation-session",
                "provider":   "google",
            },
            headers={"Authorization": f"Bearer {student_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code == 200:
            ok("AI Tutor responded successfully")
            return True
        warn(f"AI Tutor HTTP {resp.status_code}: {resp.text[:200]}")
        return False
    except Exception as exc:
        warn(f"AI Tutor exception (may need LLM API key): {exc}")
        return False


async def run_ai_flow(
    client: httpx.AsyncClient,
    student_token: str,
    teacher_token: str,
    course_id: Optional[str],
    student_user_id: str,
) -> dict:
    log("Running AI tutor flow ...")
    ctx: dict = {}

    if course_id:
        question_id = await ask_question(client, student_token, course_id)
        ctx["question_id"] = question_id

        queue = await get_faculty_queue(client, teacher_token)
        ctx["queue_length"] = len(queue)

        if queue:
            first_item = queue[0]
            qid = first_item.get("id") or first_item.get("queue_id")
            if qid:
                approved = await approve_queue_item(client, teacher_token, qid)
                ctx["approved"] = approved

        if question_id:
            status = await check_question_status(client, student_token, question_id)
            ctx["question_status"] = status
    else:
        warn("No course_id — skipping question-queue flow")

    tutor_ok = await chat_with_tutor(client, student_token, student_user_id)
    ctx["ai_tutor_chat"] = tutor_ok

    log(f"AI flow complete: {ctx}")
    return ctx
