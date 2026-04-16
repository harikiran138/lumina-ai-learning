"""
Lumina Automation — Service Startup & Health Checks
"""

import asyncio
import socket
import subprocess
import sys
import time
import os
from pathlib import Path
from typing import Optional

from automation.config import BASE_URL, FRONTEND_URL, SERVICE_STARTUP_TIMEOUT
from automation.logger import log, ok, fail, warn


# ── Port probe ─────────────────────────────────────────────────────────────────

def _port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex(("127.0.0.1", port)) == 0


async def wait_for_port(name: str, port: int, timeout: int = SERVICE_STARTUP_TIMEOUT) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if _port_open(port):
            ok(f"{name} is up on :{port}")
            return True
        await asyncio.sleep(2)
    fail(f"{name} did not start on :{port} within {timeout}s")
    return False


# ── Preflight ──────────────────────────────────────────────────────────────────

def preflight(project_root: Path):
    """Kill stale processes, verify .env, check required tools."""
    log("Preflight: killing stale processes on :9000 / :3000 ...")
    for port in (9000, 3000):
        if _port_open(port):
            subprocess.run(
                f"lsof -ti :{port} | xargs kill -9 2>/dev/null || true",
                shell=True, capture_output=True
            )
            time.sleep(1)

    env_file = project_root / ".env"
    if not env_file.exists():
        example = project_root / ".env.example"
        if example.exists():
            subprocess.run(f"cp {example} {env_file}", shell=True)
            warn(".env was missing — copied from .env.example. Fill in real keys before production use.")
        else:
            fail(".env not found and no .env.example to fall back on.")
            sys.exit(1)
    ok("Preflight checks passed")


# ── Backend ────────────────────────────────────────────────────────────────────

def start_backend(project_root: Path) -> Optional[subprocess.Popen]:
    if _port_open(9000):
        ok("Backend already running on :9000 — skipping start")
        return None

    backend_dir = project_root / "backend"
    if not backend_dir.exists():
        fail("backend/ directory not found")
        sys.exit(1)

    log("Starting FastAPI backend (uvicorn)...")
    log_file = open(project_root / "backend.log", "a")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app",
         "--host", "0.0.0.0", "--port", "9000"],
        cwd=str(backend_dir),
        stdout=log_file,
        stderr=subprocess.STDOUT,
    )
    return proc


# ── Frontend ───────────────────────────────────────────────────────────────────

def start_frontend(project_root: Path) -> Optional[subprocess.Popen]:
    if _port_open(3000):
        ok("Frontend already running on :3000 — skipping start")
        return None

    frontend_dir = project_root / "frontend" / "web"
    if not frontend_dir.exists():
        warn("frontend/web/ not found — skipping frontend start")
        return None

    log("Starting Next.js frontend (npm run dev)...")
    proc = subprocess.Popen(
        ["npm", "run", "dev", "--", "-p", "3000"],
        cwd=str(frontend_dir),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc


# ── Docker (optional) ──────────────────────────────────────────────────────────

def start_docker(project_root: Path):
    compose_file = project_root / "docker-compose.yml"
    if not compose_file.exists():
        return
    log("Starting Docker services (Postgres, Redis, Neo4j, MinIO)...")
    result = subprocess.run(
        ["docker-compose", "up", "-d",
         "db", "redis", "neo4j", "minio"],
        cwd=str(project_root),
        capture_output=True, text=True
    )
    if result.returncode == 0:
        ok("Docker services started")
    else:
        warn(f"Docker start warning: {result.stderr[:200]}")
