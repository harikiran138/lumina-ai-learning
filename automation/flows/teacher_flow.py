"""
Lumina Automation — Teacher Flow

Creates a course (query-param variant, allows teacher role),
then an assignment for that course.
"""

import uuid
import httpx
from typing import Optional

from automation.config import API, HTTP_TIMEOUT
from automation.logger import log, ok, fail, warn


def _uid() -> str:
    return uuid.uuid4().hex[:5].upper()


async def create_course(
    client: httpx.AsyncClient,
    teacher_token: str,
    department_id: Optional[str] = None,
) -> Optional[dict]:
    """
    POST /api/courses/create (query params) — accepts teacher role.
    Falls back to POST /api/courses/ (JSON) with hod/admin if teacher role is rejected.
    """
    name = "Physics — Mechanics & Waves"
    code = f"PHY-{_uid()}"
    description = "Auto-generated demo course for Physics"

    # Query-param variant (allows teacher role)
    try:
        resp = await client.post(
            f"{API}/courses/create",
            params={"name": name, "code": code, "description": description},
            headers={"Authorization": f"Bearer {teacher_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            course = data.get("course") or data
            ok(f"Course created: {course.get('name') or name} ({course.get('id')})")
            return course
        # code-already-exists → retry with new code
        if resp.status_code == 400 and "already" in resp.text.lower():
            code = f"PHY-{_uid()}"
            resp = await client.post(
                f"{API}/courses/create",
                params={"name": name, "code": code, "description": description},
                headers={"Authorization": f"Bearer {teacher_token}"},
                timeout=HTTP_TIMEOUT,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                course = data.get("course") or data
                ok(f"Course created: {course.get('name') or name} ({course.get('id')})")
                return course
        fail(f"Course creation failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return None
    except Exception as exc:
        fail(f"Course creation exception: {exc}")
        return None


async def create_assignment(
    client: httpx.AsyncClient,
    teacher_token: str,
    course_id: str,
) -> Optional[dict]:
    """
    POST /api/assignments/create (form-data).
    """
    try:
        resp = await client.post(
            f"{API}/assignments/create",
            data={
                "title":       "Newton's Laws — Problem Set 1",
                "course_id":   course_id,
                "description": "Solve 5 problems on Newton's laws of motion.",
                "due_date":    "2026-06-01",
            },
            headers={"Authorization": f"Bearer {teacher_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            assignment = data.get("assignment") or data
            ok(f"Assignment created: {assignment.get('title')} ({assignment.get('id')})")
            return assignment
        fail(f"Assignment creation failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return None
    except Exception as exc:
        fail(f"Assignment creation exception: {exc}")
        return None


async def list_assignments(
    client: httpx.AsyncClient,
    teacher_token: str,
) -> list:
    try:
        resp = await client.get(
            f"{API}/assignments/list",
            headers={"Authorization": f"Bearer {teacher_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code == 200:
            items = resp.json()
            ok(f"Assignment list fetched: {len(items)} item(s)")
            return items
        warn(f"Assignment list HTTP {resp.status_code}")
        return []
    except Exception as exc:
        warn(f"Assignment list exception: {exc}")
        return []


async def run_teacher_flow(
    client: httpx.AsyncClient,
    teacher_token: str,
    department_id: Optional[str] = None,
) -> dict:
    log("Running teacher flow ...")
    ctx: dict = {}

    course = await create_course(client, teacher_token, department_id)
    if course:
        ctx["course_id"] = course.get("id")
        assignment = await create_assignment(client, teacher_token, ctx["course_id"])
        if assignment:
            ctx["assignment_id"] = assignment.get("id")
        await list_assignments(client, teacher_token)

    log(f"Teacher flow complete: {ctx}")
    return ctx
