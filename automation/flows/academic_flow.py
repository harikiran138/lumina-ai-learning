"""
Lumina Automation — Academic Hierarchy Flow

Builds: College → Department → Batch → Subject (course)
Uses:   admin token for college/dept, hod token for batch/subject
"""

import uuid
import httpx
from typing import Optional

from automation.config import API, HTTP_TIMEOUT
from automation.logger import log, ok, fail, warn


def _uid() -> str:
    return uuid.uuid4().hex[:6].upper()


async def create_college(client: httpx.AsyncClient, admin_token: str) -> Optional[dict]:
    code = f"LUM-{_uid()}"
    payload = {
        "name":  "Lumina University",
        "email": "admin@lumina.edu",
        "code":  code,
        "city":  "Silicon City",
        "state": "Digital State",
    }
    try:
        resp = await client.post(
            f"{API}/colleges",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            college = resp.json()
            cid = college.get("id")
            ok(f"College created: {college.get('institution_name', 'Lumina University')} ({cid})")
            return college
        # If already exists, fetch the first one
        if resp.status_code in (400, 409):
            warn("College may already exist — fetching existing ...")
            r2 = await client.get(
                f"{API}/colleges",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=HTTP_TIMEOUT,
            )
            if r2.status_code == 200 and r2.json():
                college = r2.json()[0]
                ok(f"Using existing college: {college.get('institution_name')} ({college.get('id')})")
                return college
        fail(f"College creation failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return None
    except Exception as exc:
        fail(f"College creation exception: {exc}")
        return None


async def create_department(
    client: httpx.AsyncClient,
    admin_token: str,
    institution_id: str,
) -> Optional[dict]:
    payload = {
        "name":         "Computer Science & AI",
        "abbreviation": "CSAI",
        "description":  "Dept of CS and Artificial Intelligence",
    }
    try:
        resp = await client.post(
            f"{API}/colleges/{institution_id}/departments",
            json=payload,
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            dept = resp.json()
            ok(f"Department created: {dept.get('department_name')} ({dept.get('id')})")
            return dept
        if resp.status_code in (400, 409):
            warn("Department may already exist — fetching existing ...")
            r2 = await client.get(
                f"{API}/colleges/{institution_id}/departments",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=HTTP_TIMEOUT,
            )
            if r2.status_code == 200 and r2.json():
                dept = r2.json()[0]
                ok(f"Using existing department: {dept.get('department_name')} ({dept.get('id')})")
                return dept
        fail(f"Department creation failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return None
    except Exception as exc:
        fail(f"Department creation exception: {exc}")
        return None


async def create_batch(
    client: httpx.AsyncClient,
    hod_token: str,
    department_id: str,
) -> Optional[dict]:
    payload = {
        "year":     2026,
        "label":    "Alpha-2026",
        "sections": ["A", "B"],
        "current_semester": 1,
    }
    try:
        resp = await client.post(
            f"{API}/departments/{department_id}/batches",
            json=payload,
            headers={"Authorization": f"Bearer {hod_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            batch = resp.json()
            ok(f"Batch created: {batch.get('label')} ({batch.get('id')})")
            return batch
        fail(f"Batch creation failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return None
    except Exception as exc:
        fail(f"Batch creation exception: {exc}")
        return None


async def create_subject(
    client: httpx.AsyncClient,
    hod_token: str,
    department_id: str,
) -> Optional[dict]:
    payload = {
        "name":     "Agentic AI Systems",
        "code":     f"AI-{_uid()}",
        "credits":  4,
        "semester": 1,
    }
    try:
        resp = await client.post(
            f"{API}/departments/{department_id}/subjects",
            json=payload,
            headers={"Authorization": f"Bearer {hod_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            subject = resp.json()
            ok(f"Subject created: {subject.get('course_name')} ({subject.get('id')})")
            return subject
        fail(f"Subject creation failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return None
    except Exception as exc:
        fail(f"Subject creation exception: {exc}")
        return None


async def create_enrollment_code(
    client: httpx.AsyncClient,
    hod_token: str,
    batch_id: str,
    section: str = "A",
) -> Optional[str]:
    try:
        resp = await client.post(
            f"{API}/batches/{batch_id}/enrollment-code",
            json={"section": section},
            headers={"Authorization": f"Bearer {hod_token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code in (200, 201):
            code = resp.json().get("code")
            ok(f"Enrollment code generated: {code}")
            return code
        fail(f"Enrollment code failed: HTTP {resp.status_code} — {resp.text[:200]}")
        return None
    except Exception as exc:
        fail(f"Enrollment code exception: {exc}")
        return None


async def assign_users_to_dept(
    client: httpx.AsyncClient,
    admin_token: str,
    department_id: str,
    institution_id: str,
) -> None:
    """
    PATCH hod@lumina.com and teacher@lumina.com to carry department_id + institution_id so
    that HOD/Faculty dashboards (which require department_id) work without 403.
    """
    from automation.config import API, HTTP_TIMEOUT, USERS
    for role_key in ("hod", "teacher"):
        email = USERS[role_key]["email"]
        try:
            resp = await client.patch(
                f"{API}/admin/users/by-email",
                json={
                    "email":      email,
                    "department_id":    department_id,
                    "institution_id": institution_id,
                },
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=HTTP_TIMEOUT,
            )
            if resp.status_code == 200:
                ok(f"Linked {email} → dept {department_id}")
            else:
                # Fallback: try PATCH /admin/users/{id} if by-email endpoint missing
                warn(f"by-email patch not available ({resp.status_code}) for {email} — skipping dept assignment")
        except Exception as exc:
            warn(f"dept assignment exception for {email}: {exc}")


async def run_academic_flow(
    client: httpx.AsyncClient,
    admin_token: str,
    hod_token: str,
) -> dict:
    """
    Build the full academic hierarchy.
    Returns context dict with ids needed by downstream flows.
    """
    log("Building academic hierarchy ...")
    ctx: dict = {}

    college = await create_college(client, admin_token)
    if not college:
        fail("Cannot continue without a college record")
        return ctx
    ctx["institution_id"] = college.get("id")

    dept = await create_department(client, admin_token, ctx["institution_id"])
    if not dept:
        fail("Cannot continue without a department record")
        return ctx
    ctx["department_id"] = dept.get("id")

    # Assign HOD and teacher to this department so their dashboards don't 403
    await assign_users_to_dept(client, admin_token, ctx["department_id"], ctx["institution_id"])

    batch = await create_batch(client, hod_token, ctx["department_id"])
    if batch:
        ctx["batch_id"] = batch.get("id")
        code = await create_enrollment_code(client, hod_token, ctx["batch_id"])
        ctx["enrollment_code"] = code
    else:
        warn("Batch creation failed — student enrollment step will be skipped")

    subject = await create_subject(client, hod_token, ctx["department_id"])
    if subject:
        ctx["subject_id"] = subject.get("id")

    log(f"Academic hierarchy built: {ctx}")
    return ctx
