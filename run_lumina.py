#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════╗
║     LUMINA — ONE-COMMAND AUTOMATION SYSTEM                   ║
║     Usage:  python run_lumina.py [options]                   ║
║                                                              ║
║  Options:                                                    ║
║    --no-frontend   Skip starting the Next.js dev server      ║
║    --skip-seed     Skip DB seeding (users already exist)     ║
║    --skip-docker   Skip Docker service startup               ║
║    --report-only   Print last report and exit                ║
╚══════════════════════════════════════════════════════════════╝

Layers executed:
  0  Preflight        → kill stale procs, verify .env
  1  Infrastructure   → Docker services, backend, frontend
  2  Seeding          → Create demo users in Supabase
  3  Auth             → Login all 4 roles, verify /auth/me
  4  Academic Hierarchy → College → Dept → Batch → Subject
  5  Teacher Flow     → Create course + assignment
  6  Student Flow     → Enroll, dashboard, submit assignment
  7  AI Tutor Flow    → Ask question, faculty approve, AI chat
  8  Faculty Flow     → Verify queue, grade, HOD dashboard
  9  Report           → Markdown report + console summary
"""

import argparse
import asyncio
import sys
import os
from pathlib import Path

# ── Ensure project root is on sys.path so `automation.*` imports work ──────────
PROJECT_ROOT = Path(__file__).parent.resolve()
sys.path.insert(0, str(PROJECT_ROOT))

import httpx

from automation.config import BASE_URL, FRONTEND_URL, HTTP_TIMEOUT
from automation.logger import log, ok, fail, warn, section
from automation.services import (
    preflight,
    start_backend,
    start_frontend,
    start_docker,
    wait_for_port,
)
from automation.seed import seed_all
from automation.flows.auth_flow     import run_auth_flow
from automation.flows.academic_flow import run_academic_flow
from automation.flows.teacher_flow  import run_teacher_flow
from automation.flows.student_flow  import run_student_flow
from automation.flows.ai_flow       import run_ai_flow
from automation.flows.faculty_flow  import run_faculty_flow
from automation.report              import print_summary


# ── Health check ───────────────────────────────────────────────────────────────

async def health_check(client: httpx.AsyncClient, url: str, name: str) -> bool:
    for endpoint in ("/health", "/api/health", "/"):
        try:
            resp = await client.get(url + endpoint, timeout=5)
            if resp.status_code < 500:
                ok(f"{name} health check passed ({url}{endpoint})")
                return True
        except Exception:
            pass
    fail(f"{name} health check failed — no reachable endpoint")
    return False


# ── Derive student user id from token ─────────────────────────────────────────

async def get_user_id(client: httpx.AsyncClient, token: str) -> str:
    try:
        resp = await client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("id") or data.get("user", {}).get("id") or "unknown"
    except Exception:
        pass
    return "unknown"


# ── Main orchestrator ──────────────────────────────────────────────────────────

async def run(args: argparse.Namespace):
    results: dict = {}
    procs = []

    # ── PHASE 0: Preflight ─────────────────────────────────────────────────────
    section("PHASE 0 — Preflight")
    preflight(PROJECT_ROOT)

    # ── PHASE 1: Infrastructure ────────────────────────────────────────────────
    section("PHASE 1 — Infrastructure")

    if not args.skip_docker:
        start_docker(PROJECT_ROOT)

    backend_proc = start_backend(PROJECT_ROOT)
    if backend_proc:
        procs.append(backend_proc)

    if not args.no_frontend:
        frontend_proc = start_frontend(PROJECT_ROOT)
        if frontend_proc:
            procs.append(frontend_proc)

    log("Waiting for backend to become ready ...")
    backend_up = await wait_for_port("Backend", 8000)
    results["backend_up"] = backend_up

    if not backend_up:
        fail("Backend not reachable — aborting. Check backend logs.")
        print_summary(results)
        _cleanup(procs)
        sys.exit(1)

    frontend_up = False
    if not args.no_frontend:
        frontend_up = await wait_for_port("Frontend", 3000, timeout=120)
    results["frontend_up"] = frontend_up

    # ── Shared HTTP client ─────────────────────────────────────────────────────
    async with httpx.AsyncClient(
        base_url=BASE_URL,
        timeout=HTTP_TIMEOUT,
        follow_redirects=True,
    ) as client:

        await health_check(client, BASE_URL, "Backend")

        # ── PHASE 2: Seeding ───────────────────────────────────────────────────
        if not args.skip_seed:
            section("PHASE 2 — Database Seeding")
            seeded = await seed_all(client, PROJECT_ROOT)
            results["seeded"] = seeded
        else:
            log("Seeding skipped (--skip-seed)")
            results["seeded"] = True

        # ── PHASE 3: Auth ──────────────────────────────────────────────────────
        section("PHASE 3 — Auth Flow")
        tokens = await run_auth_flow(client)
        results["tokens"] = tokens

        admin_token   = tokens.get("admin")
        hod_token     = tokens.get("hod")
        teacher_token = tokens.get("teacher")
        student_token = tokens.get("student")

        if not teacher_token:
            fail("Teacher token missing — cannot run teacher/AI/student flows")
            print_summary(results)
            _cleanup(procs)
            sys.exit(1)

        if not student_token:
            fail("Student token missing — cannot run student/AI flows")
            print_summary(results)
            _cleanup(procs)
            sys.exit(1)

        # ── PHASE 4: Academic Hierarchy ────────────────────────────────────────
        section("PHASE 4 — Academic Hierarchy")
        if admin_token and hod_token:
            academic_ctx = await run_academic_flow(client, admin_token, hod_token)
        elif admin_token:
            warn("HOD token missing — using admin for batch/subject creation")
            academic_ctx = await run_academic_flow(client, admin_token, admin_token)
        else:
            warn("Admin token missing — skipping academic hierarchy setup")
            academic_ctx = {}
        results["academic"] = academic_ctx

        # ── PHASE 5: Teacher Flow ──────────────────────────────────────────────
        section("PHASE 5 — Teacher Flow")
        teacher_ctx = await run_teacher_flow(
            client,
            teacher_token,
            dept_id=academic_ctx.get("dept_id"),
        )
        results["teacher"] = teacher_ctx

        course_id     = teacher_ctx.get("course_id")
        assignment_id = teacher_ctx.get("assignment_id")

        # ── PHASE 6: Student Flow ──────────────────────────────────────────────
        section("PHASE 6 — Student Flow")
        student_ctx = await run_student_flow(
            client,
            student_token,
            assignment_id=assignment_id,
            enrollment_code=academic_ctx.get("enrollment_code"),
        )
        results["student"] = student_ctx

        # ── PHASE 7: AI Tutor Flow ─────────────────────────────────────────────
        section("PHASE 7 — AI Tutor Flow")
        student_user_id = await get_user_id(client, student_token)
        ai_ctx = await run_ai_flow(
            client,
            student_token=student_token,
            teacher_token=teacher_token,
            course_id=course_id,
            student_user_id=student_user_id,
        )
        results["ai"] = ai_ctx

        # ── PHASE 8: Faculty & HOD Flow ────────────────────────────────────────
        section("PHASE 8 — Faculty & HOD Flow")
        faculty_ctx = await run_faculty_flow(
            client,
            teacher_token=teacher_token,
            hod_token=hod_token,
            assignment_id=assignment_id,
        )
        results["faculty"] = faculty_ctx

    # ── PHASE 9: Report ────────────────────────────────────────────────────────
    section("PHASE 9 — Final Report")
    print_summary(results)
    _cleanup(procs)


# ── Cleanup ────────────────────────────────────────────────────────────────────

def _cleanup(procs):
    for p in procs:
        try:
            p.terminate()
        except Exception:
            pass


# ── CLI entrypoint ─────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Lumina AI Learning — One-Command Automation System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--no-frontend",  action="store_true",
                        help="Skip starting the Next.js dev server")
    parser.add_argument("--skip-seed",    action="store_true",
                        help="Skip DB seeding (users already exist)")
    parser.add_argument("--skip-docker",  action="store_true",
                        help="Skip Docker service startup")
    parser.add_argument("--report-only",  action="store_true",
                        help="Print the last saved report and exit")
    return parser.parse_args()


def main():
    args = parse_args()

    if args.report_only:
        from automation.config import REPORT_FILE
        p = Path(REPORT_FILE)
        if p.exists():
            print(p.read_text())
        else:
            print(f"No report found at {REPORT_FILE}. Run without --report-only first.")
        sys.exit(0)

    # Clear previous log
    from automation.config import LOG_FILE
    Path(LOG_FILE).write_text("", encoding="utf-8")

    section("LUMINA ONE-COMMAND AUTOMATION SYSTEM")
    log(f"Project root: {PROJECT_ROOT}")

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
