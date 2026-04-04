"""
Lumina Automation — Student Flow

Steps:
  1. Enroll via enrollment code (if available)
  2. Submit assignment (if course_id + assignment_id present)
  3. Check student dashboard
"""

import io
import uuid
import httpx
from typing import Optional

from automation.config import API, HTTP_TIMEOUT
from automation.logger import log, ok, fail, warn


async def enroll_with_code(
    client: httpx.AsyncClient,
    enrollment_code: str,
) -> Optional[dict]:
    """
    POST /api/enroll — self-registers a new student using the batch enrollment code.
    Returns the new user's id.
    """
    unique = uuid.uuid4().hex[:6]
    payload = {
        "enrollmentCode": enrollment_code,
        "rollNumber":     f"RS-{unique.upper()}",
        "fullName":       "Automation Student",
        "email":          f"auto_student_{unique}@lumina.test",
        "password":       "Lumina@138800",
    }
    try:
        resp = await client.post(
            f"{API}/enroll",
            json=payload,
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            uid = data.get("userId") or data.get("id")
            ok(f"Student enrolled: {payload['email']} ({uid})")
            return {"userId": uid, "email": payload["email"], "password": payload["password"]}
        fail(f"Student enrollment failed: HTTP {resp.status_code} — {resp.text[:300]}")
        return None
    except Exception as exc:
        fail(f"Student enrollment exception: {exc}")
        return None


async def submit_assignment(
    client: httpx.AsyncClient,
    student_token: str,
    assignment_id: str,
) -> bool:
    """
    POST /api/assignments/submit (multipart: form field + file upload).
    Uploads a synthetic text file as the submission.
    """
    content = (
        "Newton's First Law: An object at rest stays at rest unless acted upon by a net force.\n"
        "Newton's Second Law: F = ma\n"
        "Newton's Third Law: For every action there is an equal and opposite reaction.\n"
    ).encode()

    try:
        resp = await client.post(
            f"{API}/assignments/submit",
            data={"assignment_id": assignment_id},
            files={"file": ("newton_laws.txt", io.BytesIO(content), "text/plain")},
            headers={"Authorization": f"Bearer {student_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            ok(f"Assignment {assignment_id} submitted successfully")
            return True
        fail(f"Assignment submission failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return False
    except Exception as exc:
        fail(f"Assignment submission exception: {exc}")
        return False


async def get_student_dashboard(
    client: httpx.AsyncClient,
    student_token: str,
) -> bool:
    try:
        resp = await client.get(
            f"{API}/student/dashboard",
            headers={"Authorization": f"Bearer {student_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code == 200:
            ok("Student dashboard loaded")
            return True
        warn(f"Student dashboard HTTP {resp.status_code}")
        return False
    except Exception as exc:
        warn(f"Student dashboard exception: {exc}")
        return False


async def run_student_flow(
    client: httpx.AsyncClient,
    student_token: str,
    assignment_id: Optional[str] = None,
    enrollment_code: Optional[str] = None,
) -> dict:
    log("Running student flow ...")
    ctx: dict = {}

    if enrollment_code:
        enrolled = await enroll_with_code(client, enrollment_code)
        if enrolled:
            ctx["enrolled_student"] = enrolled

    await get_student_dashboard(client, student_token)

    if assignment_id:
        submitted = await submit_assignment(client, student_token, assignment_id)
        ctx["assignment_submitted"] = submitted

    log(f"Student flow complete: {ctx}")
    return ctx
