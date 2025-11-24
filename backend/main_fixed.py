"""
Lumina AI Backend - FastAPI Application
Core AI services for RAG, embeddings, and LLM inference
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import logging
import uuid
from datetime import datetime

# Import services
from .services.embeddings import embedding_service
from .services.vector_store import vector_store
from .services.llm_service import llm_service
from .services.content_parser import content_parser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Lumina AI Backend",
    description="AI-powered learning management system backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class ContentIngestionRequest(BaseModel):
    content: str
    content_type: str  # 'text', 'pdf', 'url'
    metadata: Optional[Dict[str, Any]] = {}

class EmbeddingRequest(BaseModel):
    text: str
    model: Optional[str] = "sentence-transformers/all-MiniLM-L6-v2"

class PathwayGenerationRequest(BaseModel):
    student_id: str
    current_skills: List[str]
    target_skills: List[str]
    learning_style: Optional[str] = "visual"

class AssessmentGenerationRequest(BaseModel):
    course_id: str
    lesson_id: Optional[str] = None
    assessment_type: str  # 'mcq', 'short_answer', 'essay'
    difficulty: str = "medium"
    num_questions: int = 10

class AdaptiveLearningRequest(BaseModel):
    student_id: str
    current_performance: Dict[str, Any]
    recent_activities: List[Dict[str, Any]]

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "lumina-ai-backend"
    }

# Content ingestion endpoint
@app.post("/api/ingest-content")
async def ingest_content(request: ContentIngestionRequest, background_tasks: BackgroundTasks):
    """Ingest and process educational content"""
    try:
        logger.info(f"Ingesting content: {request.content_type}")

        content_id = str(uuid.uuid4())

        # Add background task for processing
        background_tasks.add_task(process_content_async, request, content_id)

        return {
            "message": "Content ingestion started",
            "content_id": content_id,
            "status": "processing"
        }
    except Exception as e:
        logger.error(f"Content ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Embedding generation endpoint
@app.post("/api/generate-embeddings")
async def generate_embeddings(request: EmbeddingRequest):
    """Generate vector embeddings for text"""
    try:
        logger.info(f"Generating embeddings for text length: {len(request.text)}")

        embeddings = embedding_service.encode(request.text)

        return {
            "embeddings": embeddings,
            "model": request.model,
            "text_length": len(request.text),
            "dimension": len(embeddings)
        }
    except Exception as e:
        logger.error(f"Embedding generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Pathway generation endpoint
@app.post("/api/generate-pathway")
async def generate_pathway(request: PathwayGenerationRequest):
    """Generate personalized learning pathway"""
    try:
        logger.info(f"Generating pathway for student: {request.student_id}")

        result = llm_service.generate_pathway({
            "student_id": request.student_id,
            "current_skills": request.current_skills,
            "target_skills": request.target_skills,
            "learning_style": request.learning_style
        })

        return result
    except Exception as e:
        logger.error(f"Pathway generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Assessment generation endpoint
@app.post("/api/generate-assessment")
async def generate_assessment(request: AssessmentGenerationRequest):
    """Generate automated assessments"""
    try:
        logger.info(f"Generating {request.assessment_type} assessment for course: {request.course_id}")

        result = llm_service.generate_assessment({
            "course_id": request.course_id,
            "lesson_id": request.lesson_id,
            "assessment_type": request.assessment_type,
            "difficulty": request.difficulty,
            "num_questions": request.num_questions
        })

        return result
    except Exception as e:
        logger.error(f"Assessment generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Adaptive learning suggestions endpoint
@app.post("/api/adaptive-learning")
async def adaptive_learning(request: AdaptiveLearningRequest):
    """Provide adaptive learning suggestions"""
    try:
        logger.info(f"Generating adaptive suggestions for student: {request.student_id}")

        result = llm_service.adaptive_learning({
            "student_id": request.student_id,
            "current_performance": request.current_performance,
            "recent_activities": request.recent_activities
        })

        return result
    except Exception as e:
        logger.error(f"Adaptive learning error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Background task for content processing
async def process_content_async(request: ContentIngestionRequest, content_id: str):
    """Process content in background"""
    try:
        logger.info(f"Processing content asynchronously: {content_id}")

        # Parse content
        if request.content_type.lower() == 'text':
            parsed_content = content_parser.parse_text(request.content)
        else:
            # For now, assume raw text; in future, handle file uploads
            parsed_content = content_parser.parse_text(request.content)

        # Generate embeddings
        embeddings = embedding_service.encode(parsed_content)

        # Store in vector database
        metadata = {
            **request.metadata,
            "content_type": request.content_type,
            "processed_at": datetime.utcnow().isoformat()
        }
        vector_store.insert(content_id, parsed_content, embeddings, metadata)

        logger.info(f"Content processed successfully: {content_id}")
    except Exception as e:
        logger.error(f"Background content processing error: {str(e)}")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Lumina AI Backend")
    # TODO: Initialize vector database connections, load models, etc.

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Lumina AI Backend")
    # TODO: Close connections, save state, etc.

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
