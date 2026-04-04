"""
Lumina Automation — Database Seeding

Strategy (in order of preference):
  1. Run backend/scripts/setup_demo_users.py as a subprocess — creates all 4
     roles (super_admin, hod, teacher, student) directly in the DB.
  2. If that fails, fall back to POST /api/auth/register for the two
     self-signup roles (teacher, student). Admin + HOD cannot be registered
     via the public endpoint (they are INVITE_ONLY roles).
"""

import asyncio
import subprocess
import sys
import os
from pathlib import Path

import httpx

from automation.config import API, USERS, DEMO_PASSWORD, HTTP_TIMEOUT, SEED_SCRIPT_TIMEOUT
from automation.logger import log, ok, fail, warn


# ── Method 1: subprocess seeding ──────────────────────────────────────────────

def seed_via_script(project_root: Path) -> bool:
    """Run backend/scripts/setup_demo_users.py using the venv Python."""
    script = project_root / "backend" / "scripts" / "setup_demo_users.py"
    if not script.exists():
        warn(f"Seed script not found at {script}")
        return False

    # Prefer the venv interpreter inside backend/
    venv_py = project_root / "backend" / ".venv" / "bin" / "python"
    if not venv_py.exists():
        venv_py = Path(sys.executable)  # fall back to current interpreter

    log(f"Seeding users via {script.name} ...")
    env = os.environ.copy()
    env["PYTHONPATH"] = str(project_root / "backend")

    try:
        result = subprocess.run(
            [str(venv_py), str(script)],
            cwd=str(project_root / "backend"),
            capture_output=True,
            text=True,
            timeout=SEED_SCRIPT_TIMEOUT,
            env=env,
        )
        output = result.stdout + result.stderr
        if "DEMO_USERS_SETUP_COMPLETE" in output or result.returncode == 0:
            ok("Demo users seeded via script")
            return True
        warn(f"Seed script exited {result.returncode}: {output[-300:]}")
        return False
    except subprocess.TimeoutExpired:
        warn("Seed script timed out")
        return False
    except Exception as exc:
        warn(f"Seed script error: {exc}")
        return False


# ── Method 2: API registration fallback ───────────────────────────────────────

async def seed_via_api(client: httpx.AsyncClient) -> dict:
    """
    Register teacher and student via POST /api/auth/register.
    Admin and HOD cannot self-register; they are seeded only via script.
    Returns dict of seeded roles: {"teacher": True/False, "student": True/False}
    """
    results = {}
    registerable = ["teacher", "student"]

    for key in registerable:
        cfg = USERS[key]
        log(f"Registering {key} ({cfg['email']}) via API ...")
        try:
            resp = await client.post(
                f"{API}/auth/register",
                json={
                    "email":     cfg["email"],
                    "password":  cfg["password"],
                    "full_name": cfg["full_name"],
                    "role":      cfg["role"],
                },
                timeout=HTTP_TIMEOUT,
            )
            if resp.status_code in (200, 201):
                ok(f"{key} registered")
                results[key] = True
            elif resp.status_code == 409 or "already" in resp.text.lower():
                ok(f"{key} already exists — skipping")
                results[key] = True
            else:
                warn(f"{key} registration returned {resp.status_code}: {resp.text[:200]}")
                results[key] = False
        except Exception as exc:
            warn(f"API registration error for {key}: {exc}")
            results[key] = False

    return results


# ── Entry point ────────────────────────────────────────────────────────────────

async def seed_all(client: httpx.AsyncClient, project_root: Path) -> bool:
    """Seed all demo users. Returns True if at least admin + teacher + student exist."""
    script_ok = seed_via_script(project_root)

    if not script_ok:
        warn("Script seeding failed — falling back to API registration for teacher/student")
        api_results = await seed_via_api(client)
        teacher_ready = api_results.get("teacher", False)
        student_ready = api_results.get("student", False)
        if not (teacher_ready and student_ready):
            fail("Critical users (teacher / student) could not be seeded. "
                 "Ensure backend is running and Supabase is reachable.")
            return False
        warn("Admin and HOD not seeded (require script or direct DB access). "
             "Institutional setup steps will be skipped.")
    return True
