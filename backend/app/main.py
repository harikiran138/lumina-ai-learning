from dotenv import load_dotenv
import importlib.metadata

# Python 3.8 compatibility shim for dependencies expecting packages_distributions
if not hasattr(importlib.metadata, "packages_distributions"):
    try:
        import importlib_metadata
        importlib.metadata.packages_distributions = importlib_metadata.packages_distributions
    except ImportError:
        pass

load_dotenv()

import os  # noqa: E402
import time  # noqa: E402
import asyncio  # noqa: E402
import functools  # noqa: E402
import contextvars  # noqa: E402
from contextlib import asynccontextmanager  # noqa: E402

import structlog  # noqa: E402
import sentry_sdk  # noqa: E402
from fastapi import FastAPI, Request  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.middleware.trustedhost import TrustedHostMiddleware  # noqa: E402
from fastapi.middleware.gzip import GZipMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from starlette.middleware.base import BaseHTTPMiddleware  # noqa: E402
from prometheus_fastapi_instrumentator import Instrumentator  # noqa: E402
from slowapi import _rate_limit_exceeded_handler  # noqa: E402
from slowapi.errors import RateLimitExceeded  # noqa: E402

from app.database.manager import db  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.core.logging import configure_logging  # noqa: E402
from app.core.limiter import limiter  # noqa: E402

from .routers import (  # noqa: E402
    ai,
    handwriting_simple as handwriting,
    assignments,
    courses,
    auth,
    hybrid,
    student,
    personalization,
    community,
    admin,
    pathway,
    teacher,
    knowledge_graph,
    generation,
    parent,
    mentor,
    peer_tutor,
    counselor,
    content_creator,
    researcher,
    alumni,
    curriculum,
)

from app.assessment.api.router import router as assessment_router  # noqa: E402
from app.api.routers.automation import router as automation_router  # noqa: E402

# Polyfill for python 3.8
if not hasattr(asyncio, "to_thread"):

    async def to_thread(func, /, *args, **kwargs):
        loop = asyncio.get_running_loop()
        ctx = contextvars.copy_context()
        func_call = functools.partial(ctx.run, func, *args, **kwargs)
        return await loop.run_in_executor(None, func_call)

    asyncio.to_thread = to_thread

# 1. Configure JSON Logging
configure_logging()

# 2. Configure Sentry (with Profiling)
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,  # Enable profiling
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
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

    # Startup automation scheduler
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

# 3. Add Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


os.makedirs("data/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="data/uploads"), name="uploads")

os.makedirs("static/presentations", exist_ok=True)
app.mount(
    "/api/tutor/download-ppt", StaticFiles(directory="static/presentations"), name="presentations"
)


# Prevent Host Header Attacks
allowed_hosts = ["localhost", "127.0.0.1", "testserver"]
domain_name = os.getenv("DOMAIN_NAME")
if domain_name:
    allowed_hosts.append(domain_name)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# CORS Polish
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Add GZip Compression


app.add_middleware(GZipMiddleware, minimum_size=1000)

# 6. Add Cache Control Headers for Static Files


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

app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(generation.router)
app.include_router(handwriting.router, prefix="/api/handwriting", tags=["Handwriting"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])


app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])


app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])


app.include_router(assessment_router, prefix="/api/assessment", tags=["Assessment"])


app.include_router(hybrid.router, prefix="/api/ai", tags=["Hybrid AI"])


app.include_router(student.router, prefix="/api/student", tags=["Student Data"])
app.include_router(personalization.router, prefix="/api/personalization", tags=["Personalization"])
app.include_router(automation_router)
app.include_router(community.router, prefix="/api/community", tags=["Community"])
app.include_router(parent.router, prefix="/api/parent", tags=["Parent"])
app.include_router(mentor.router, prefix="/api/mentor", tags=["Mentor"])
app.include_router(peer_tutor.router, prefix="/api/peer_tutor", tags=["Peer Tutor"])
app.include_router(counselor.router, prefix="/api/counselor", tags=["Counselor"])
app.include_router(content_creator.router, prefix="/api/content_creator", tags=["Content Creator"])
app.include_router(researcher.router, prefix="/api/researcher", tags=["Researcher"])
app.include_router(alumni.router, prefix="/api/alumni", tags=["Alumni"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(curriculum.router, prefix="/api", tags=["Curriculum"])
app.include_router(pathway.router, prefix="/api/pathway", tags=["Pathway"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["Teacher Dashboard"])
app.include_router(knowledge_graph.router, prefix="/api/knowledge-graph", tags=["Knowledge Graph"])


# --- Performance & Security Polish ---
logger = structlog.get_logger()


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


class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response


app.add_middleware(TimingMiddleware)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Use structlog for critical errors
    logger.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "path": request.url.path,
        },
    )


@app.get("/")
def read_root():
    return {"message": "Welcome to Lumina API"}


@app.get("/health")
async def health_check():
    """
    Deep Health Check: Verifies all backend dependencies.
    """
    health_report = {"status": "ok", "timestamp": time.time(), "services": {}}

    # 1. Check Supabase
    try:
        from app.database.supabase_manager import supabase_db
        client = supabase_db.get_client()
        if client is None:
            health_report["status"] = "degraded"
            health_report["services"]["supabase"] = {
                "status": "degraded",
                "message": supabase_db.last_error or "Running on local fallback store",
            }
        else:
            health_report["services"]["supabase"] = {"status": "connected"}
    except Exception as e:
        health_report["status"] = "degraded"
        health_report["services"]["supabase"] = {"status": "error", "error": str(e)}

    # MongoDB removed from health check

    # 2. Check Redis
    try:
        from app.store.redis_client import redis_client

        await redis_client.ping()
        health_report["services"]["redis"] = {"status": "connected"}
    except Exception as e:
        health_report["status"] = "degraded"
        health_report["services"]["redis"] = {"status": "degraded", "message": "Redis cache unavailable. App functioning with limited caching."}

    # 3. Check Vector Store (Chroma)
    try:
        import app.rag.vector_store  # noqa: F401

        # Simple existence check
        health_report["services"]["vector_store"] = {"status": "online"}
    except Exception as e:
        health_report["status"] = "degraded"
        health_report["services"]["vector_store"] = {"status": "error", "error": str(e)}

    return health_report


@app.middleware("http")
async def sentry_context_middleware(request: Request, call_next):
    """
    Middleware to tag Sentry events with user context if authenticated.
    """
    response = await call_next(request)

    # Check if user data exists in request state (set by auth middleware if present)
    user = getattr(request.state, "user", None)
    if user:
        with sentry_sdk.configure_scope() as scope:
            scope.set_user({"id": str(user.get("id")), "email": user.get("email")})

    return response
