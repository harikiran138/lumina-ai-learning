from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ai, handwriting_simple as handwriting, assignments

from app.database.manager import db
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

@app.on_event("startup")
async def startup_db_client():
    await db.connect()

@app.on_event("shutdown")
async def shutdown_db_client():
    await db.close()

from fastapi.staticfiles import StaticFiles
import os

os.makedirs("data/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="data/uploads"), name="uploads")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(handwriting.router, prefix="/api/handwriting", tags=["Handwriting"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])

from routers import courses
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])

from routers import auth
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

from app.assessment.api.router import router as assessment_router
app.include_router(assessment_router, prefix="/api/assessment", tags=["Assessment"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Lumina API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
