import sys
import io
import importlib.metadata
from dotenv import load_dotenv

# Force UTF-8 for stdout and stderr on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv()

import os  # noqa: E402
import time  # noqa: E402
import socket # noqa: E402
import re # noqa: E402


# FORCE IPv4 to prevent IPv6 blackhole hanging (Mac/Supabase bug)
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [res for res in responses if res[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo


import asyncio  # noqa: E402
import functools  # noqa: E402
import contextvars  # noqa: E402
from contextlib import asynccontextmanager  # noqa: E402

import structlog  # noqa: E402
import sentry_sdk  # noqa: E402
from fastapi import FastAPI, Request, HTTPException  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from starlette.exceptions import HTTPException as StarletteHTTPException # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.middleware.trustedhost import TrustedHostMiddleware  # noqa: E402
from fastapi.middleware.gzip import GZipMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware  # noqa: E402
from prometheus_fastapi_instrumentator import Instrumentator  # noqa: E402

from app.database.manager import db  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.core.logging import configure_logging  # noqa: E402
from app.core.limiter import limiter  # noqa: E402
from app.core.middleware import SentinelMiddleware # noqa: E402
from app.core.responses import error_response # noqa: E402

# 1. Configure JSON Logging
configure_logging()

logger = structlog.get_logger(__name__)
log = logger # Alias for compatibility

# 2. Configure Sentry (with Profiling)
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,  # Enable profiling
    )

from app.routers import (  # noqa: E402
    admin,
    ai,
    ai_agents,
    ai_governance,
    ai_tutor,
    alumni,
    analytics,
    assessment,
    assignments,
    attendance,
    auth,
    community,
    content_creator,
    counselor,
    courses,
    curriculum,
    departments,
    enrollments,
    faculties,
    flashcards,
    fsrs,
    gamification,
    generation,
    hod,
    hybrid,
    institutions,
    knowledge_graph,
    mentor,
    notifications,
    onboarding,
    parent,
    pathway,
    peer_tutor,
    personalization,
    realtime,
    researcher,
    schedule,
    student,
    teacher,
    users,
    wellbeing,
    progress,
    study_groups,
    exam_mode,
    ai_tools,
    core_extensions,
    unit_pipeline,
    handwritten,
    paper_info,
    ai_queue,
)

# from app.assessment.api.router import router as assessment_router  # noqa: E402
from app.api.routers.automation import router as automation_router  # noqa: E402

# Polyfill for older Python runtimes that do not expose asyncio.to_thread
if not hasattr(asyncio, "to_thread"):

    async def to_thread(func, /, *args, **kwargs):
        loop = asyncio.get_running_loop()
        ctx = contextvars.copy_context()
        func_call = functools.partial(ctx.run, func, *args, **kwargs)
        return await loop.run_in_executor(None, func_call)

    asyncio.to_thread = to_thread

if os.getenv("ENVIRONMENT") == "production" and not settings.SECURE_COOKIES:
    raise RuntimeError("SECURE_COOKIES must be True in production")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Rule 2: Automated Validation Layer
    critical_env_vars = {
        "SUPABASE_URL": settings.SUPABASE_URL,
        "SUPABASE_KEY": settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY,
        "JWT_SECRET": settings.JWT_SECRET,
        "REDACT_PII_LOGS": settings.REDACT_PII_LOGS
    }
    missing_vars = [k for k, v in critical_env_vars.items() if v is None or v == ""]
    if missing_vars:
        logger.critical("startup_validation_failed", missing=missing_vars)
        raise RuntimeError(f"CRITICAL: Missing required environment variables: {', '.join(missing_vars)}")

    # 2. Database Connection
    try:
        await db.connect()
        from app.database.supabase_manager import supabase_db

        if supabase_db.client is not None:
            print("Connected to Supabase")
        else:
            print("Starting in limited functionality mode (local fallback store).")
    except Exception as e:
        print(f"WARNING: Could not connect to database: {e}")
        print("Starting in limited functionality mode.")

    # 3. Startup automation scheduler
    try:
        from app.automation.scheduler import setup_scheduled_jobs
        setup_scheduled_jobs(app)
    except Exception as e:
        print(f"WARNING: Scheduler not started: {e}")

    yield

    # Shutdown
    await db.close()
    print("Closed database connections")


app = FastAPI(
    title="Lumina AI Learning Platform",
    description="""
    Lumina AI Learning Platform API.

    Features:
    * AI-powered Tutoring with RAG
    * Handwritten Document Digitization (OCR)
    * Automated Assignment Grading
    * Personalized Learning Pathways
    """,
    version="1.0.0",
    contact={
        "name": "Lumina Engineering",
        "email": "engineering@lumina-learning.com",
    },
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# 3. Add Rate Limiter (Moved to specialized section)

_ALLOWED_CORS_ORIGINS = {
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:5173",
    "https://lumina-ai-blond.vercel.app",
    "https://lumina-r14oxh9hj-chepuri-hari-kirans-projects.vercel.app",
    "https://lumina-ai-learning.vercel.app",
    "http://10.49.71.79:3000",
    "http://10.49.71.79:8000",
}
_ALLOWED_CORS_ORIGIN_REGEX = r"^https://lumina-[a-z0-9-]+\.vercel\.app$"

def add_cors_headers(response: JSONResponse, request: Request) -> JSONResponse:
    origin = request.headers.get("origin")
    # Check against allowed list or matching the Vercel regex
    is_allowed = origin and (
        origin in _ALLOWED_CORS_ORIGINS or 
        os.getenv("FRONTEND_URL") == origin or
        re.match(_ALLOWED_CORS_ORIGIN_REGEX, origin)
    )
    if is_allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    status_code = getattr(exc, "status_code", 500)
    detail = getattr(exc, "detail", "Internal Server Error")
    log.warning("http_exception", status_code=status_code, path=request.url.path, detail=str(detail))
    response = error_response(
        error=str(status_code),
        message=str(detail),
        status_code=status_code,
        path=request.url.path,
        detail=detail
    )
    return add_cors_headers(response, request)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for any unhandled Python exception.
    Logs the full traceback internally; returns a safe 500 to the client.
    Never exposes stack traces or raw error messages to the frontend.
    """
    import traceback
    log.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        exc_type=type(exc).__name__,
        error=str(exc),
        traceback=traceback.format_exc(),
    )
    response = error_response(
        error="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred. Please try again later.",
        status_code=500,
        path=request.url.path,
        detail=type(exc).__name__,
    )
    return add_cors_headers(response, request)


# Serverless environments (Vercel) have a read-only filesystem except /tmp.
_IS_SERVERLESS = bool(os.getenv("VERCEL"))
_upload_dir = "/tmp/uploads" if _IS_SERVERLESS else "data/uploads"  # nosec B108
_ppt_dir = "/tmp/presentations" if _IS_SERVERLESS else "static/presentations"  # nosec B108

os.makedirs(_upload_dir, exist_ok=True)
os.makedirs(_ppt_dir, exist_ok=True)

if not _IS_SERVERLESS:
    app.mount("/uploads", StaticFiles(directory=_upload_dir), name="uploads")
    app.mount(
        "/api/tutor/download-ppt", StaticFiles(directory=_ppt_dir), name="presentations"
    )



# GZip Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def add_diagnostic_header(request: Request, call_next):
    origin = request.headers.get("origin")
    response = await call_next(request)
    if origin:
        logger.info("cors_origin_diagnostic", origin=origin, path=request.url.path, method=request.method)
    return response

# 7. Add Cache Control Headers for Static Files


class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)

        # Add cache headers for static files
        if request.url.path.startswith("/uploads") or request.url.path.startswith(
            "/api/tutor/download-ppt"
        ):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        elif request.url.path.startswith("/api"):
            # API responses - no cache by default (can be overridden by route)
            if "Cache-Control" not in response.headers:
                response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"

        return response


app.add_middleware(CacheControlMiddleware)

# 4. Prometheus Metrics


Instrumentator().instrument(app).expose(app)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(institutions.router, prefix="/api/institutions", tags=["Institutions"])
app.include_router(departments.router, prefix="/api/departments", tags=["Departments"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(curriculum.router, prefix="/api/curriculum", tags=["Curriculum"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["Schedule"])
app.include_router(enrollments.router, prefix="/api/enrollments", tags=["Enrollments"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(assessment.router, prefix="/api/assessment", tags=["Assessment"])
app.include_router(faculties.router, prefix="/api/faculties", tags=["Faculties"])
app.include_router(ai_agents.router, prefix="/api/ai-agents", tags=["AI Agents"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["Onboarding"])

app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(hybrid.router, prefix="/api/ai", tags=["Hybrid AI"])
app.include_router(generation.router, prefix="/api/generation", tags=["Generation"])

app.include_router(student.router, prefix="/api/student", tags=["Student (Legacy)"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["Teacher (Legacy)"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin (Legacy)"])
app.include_router(hod.router, prefix="/api/hod", tags=["HOD (Legacy)"])

app.include_router(personalization.router, prefix="/api/personalization", tags=["Personalization"])
app.include_router(community.router, prefix="/api/community", tags=["Community"])
app.include_router(knowledge_graph.router, prefix="/api/knowledge-graph", tags=["Knowledge Graph"])
app.include_router(pathway.router, prefix="/api/pathway", tags=["Pathway"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(realtime.router, prefix="/ws", tags=["Real-time"])

# Role-specific Shells
app.include_router(parent.router, prefix="/api/parent", tags=["Parent"])
app.include_router(mentor.router, prefix="/api/mentor", tags=["Mentor"])
app.include_router(peer_tutor.router, prefix="/api/peer_tutor", tags=["Peer Tutor"])
app.include_router(counselor.router, prefix="/api/counselor", tags=["Counselor"])
app.include_router(content_creator.router, prefix="/api/content_creator", tags=["Content Creator"])
app.include_router(researcher.router, prefix="/api/researcher", tags=["Researcher"])
app.include_router(alumni.router, prefix="/api/alumni", tags=["Alumni"])

# Infrastructure & Tools
app.include_router(automation_router)
app.include_router(ai_queue.router, prefix="/api", tags=["AI Queue"])
app.include_router(ai_governance.router, prefix="/api/monitoring", tags=["AI Monitoring"])
app.include_router(unit_pipeline.router, prefix="/api/v1/unit-pipeline", tags=["Knowledge Pipeline"])
app.include_router(handwritten.router, prefix="/api/v1/handwritten", tags=["OCR"])
app.include_router(paper_info.router, prefix="/api/v1/paper-info", tags=["Research"])
app.include_router(flashcards.router)
app.include_router(gamification.router, prefix="/api/gamification", tags=["Gamification"])
app.include_router(fsrs.router, prefix="/api/fsrs", tags=["FSRS"])
app.include_router(ai_tools.router, prefix="/api/ai-tools", tags=["AI Tools"])
app.include_router(exam_mode.router, prefix="/api/exam-mode", tags=["Exam Mode"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(study_groups.router, prefix="/api/study-groups", tags=["Study Groups"])
app.include_router(wellbeing.router, prefix="/api/wellbeing", tags=["Wellbeing"])


# --- RATE LIMITING (L5 Sentinel) ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# --- GLOBAL CORS EXCEPTION HANDLERS ---


# --- Performance & Security Polish ---


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        logger.info(
            "request_processed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration=f"{process_time:.4f}s",
        )
        return response


app.add_middleware(LoggingMiddleware)


# Note: Timing is handled by SentinelMiddleware to avoid double headers




from app.core.responses import success_response

@app.get("/")
def read_root():
    return success_response({"version": "1.0.0"}, "Welcome to Lumina API")


@app.get("/health")
async def health_check():
    """Simple health check for service availability."""
    return {"status": "ok"}


@app.middleware("http")
async def sentry_context_middleware(request: Request, call_next):
    """
    Middleware to tag Sentry events with user context if authenticated.
    """
    response = await call_next(request)

    # Check if user data exists in request state (set by auth middleware if present)
    user = getattr(request.state, "user", None)
    if user:
        sentry_sdk.set_user({"id": str(user.get("id")), "email": user.get("email")})
    else:
        sentry_sdk.set_user(None)

    return response


# --- Middlewares (Enforced in LIFO order) ---

# RBAC & Global Auth (L5 Sentinel)
app.add_middleware(SentinelMiddleware)

# SECURITY: TrustedHostMiddleware
allowed_hosts = [
    "localhost", "127.0.0.1", "::1", "0.0.0.1", "testserver", "*.vercel.app",
    "lumina-backend.onrender.com", "localhost:8000", "127.0.0.1:8000", "[::1]:8000",
    "10.49.71.79", "10.49.71.79:8000"
]
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# CORS: Outermost to ensure all responses (including errors) have headers
# CORS Lockdown (R-002 Fix): Strict whitelist only.
origins = list(_ALLOWED_CORS_ORIGINS)
# Safely add FRONTEND_URL if it's not a wildcard
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url != "*":
    if frontend_url not in origins:
        origins.append(frontend_url)

# [Lumina Security] Development mode uses relaxed CORS for rapid debugging.
# Production uses strict whitelists for hard compliance.
is_dev = (os.getenv("ENVIRONMENT") == "development" or os.getenv("DEBUG") == "true")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=None if is_dev else _ALLOWED_CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)
