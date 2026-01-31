import sys
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import ai, handwriting_simple as handwriting, assignments

import asyncio
import functools
import contextvars

# Polyfill for python 3.8
if not hasattr(asyncio, "to_thread"):
    async def to_thread(func, /, *args, **kwargs):
        loop = asyncio.get_running_loop()
        ctx = contextvars.copy_context()
        func_call = functools.partial(ctx.run, func, *args, **kwargs)
        return await loop.run_in_executor(None, func_call)
    asyncio.to_thread = to_thread


from app.database.manager import db
from app.core.config import settings

# --- Observability & Production ---
import sentry_sdk
from app.core.logging import configure_logging
from app.core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# 1. Configure JSON Logging
configure_logging()

# 2. Configure Sentry (if DSN provided)
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
    )

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await db.connect()
        print("Connected to MongoDB")
    except Exception as e:
        print(f"WARNING: Could not connect to database: {e}")
        print("Starting in limited functionality mode.")
    
    yield
    
    # Shutdown
    await db.close()
    print("Closed MongoDB connection")

app = FastAPI(
    title=settings.PROJECT_NAME, 
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# 3. Add Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from fastapi.staticfiles import StaticFiles
import os

os.makedirs("data/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="data/uploads"), name="uploads")

os.makedirs("static/presentations", exist_ok=True)
app.mount("/api/tutor/download-ppt", StaticFiles(directory="static/presentations"), name="presentations")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(handwriting.router, prefix="/api/handwriting", tags=["Handwriting"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])

from .routers import courses
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])

from .routers import auth
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

from app.assessment.api.router import router as assessment_router
app.include_router(assessment_router, prefix="/api/assessment", tags=["Assessment"])

from .routers import hybrid
app.include_router(hybrid.router, prefix="/api/ai", tags=["Hybrid AI"])

from .routers import student
app.include_router(student.router, prefix="/api/student", tags=["Student Data"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Lumina API"}

@app.get("/health")
async def health_check():
    from app.database.manager import db
    db_status = "connected" if db.db else "disconnected"
    return {"status": "ok", "database": db_status}
