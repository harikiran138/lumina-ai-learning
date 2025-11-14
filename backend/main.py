"""
Lumina AI Backend - FastAPI Application
Core AI services for RAG, embeddings, and LLM inference
"""

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Depends, Request, status, WebSocket
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.websockets import WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import logging
import uuid
import os
import io
from datetime import datetime
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from sqlalchemy.orm import Session

# Import services (heavy ML deps). If they fail to import, provide lightweight
# dummy implementations so the API can still start for local testing.
try:
    from services.embeddings import embedding_service
    from services.vector_store import vector_store
    from services.llm_service import llm_service
    from services.content_parser import content_parser
    from services.assessment_generator import AssessmentGenerator
    from services.auto_grader import AutoGrader
    from services.personalization_engine import PersonalizationEngine
    from services.pathway_generator import pathway_generator
    from services.streak_service import StreakService
    from services.face_recognition_service import FaceRecognitionService
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"Could not import ML services: {e}; using dummy fallbacks")

    # Dummy/simple fallbacks to allow the server to run without ML libs
    class _DummyEmbeddingService:
        def encode(self, text):
            return [0.0]

    class _DummyVectorStore:
        def insert(self, *args, **kwargs):
            return None

    class _DummyLLMService:
        async def generate(self, *args, **kwargs):
            return {"result": "dummy"}

    class _DummyContentParser:
        def parse_text(self, text):
            return text

    class AssessmentGenerator:
        async def generate_assessment(self, course_id, lesson_id, assessment_type, num_questions, difficulty):
            return {"assessment": [], "note": "dummy assessment"}

    class AutoGrader:
        async def grade(self, *args, **kwargs):
            return {"score": 0}

    class PersonalizationEngine:
        async def generate_learning_pathway(self, student_id, course, level):
            return {"pathway": []}

        async def get_adaptive_recommendations(self, student_id, current_performance):
            return []

        async def get_class_analytics(self, course_id):
            return {}

        async def get_student_analytics(self, student_id):
            return {}

        async def detect_weaknesses(self, course_id):
            return {}

    class PathwayGenerator:
        async def generate_pathway(self, student_id, current_skills, target_skills, learning_style, difficulty):
            return {"pathway": [], "learning_plan": [], "metadata": {}}

    class StreakService:
        def __init__(self, url=None):
            pass

        async def record_activity(self, student_id, activity_type):
            return True

        async def get_streak_info(self, student_id):
            return {}

    class FaceRecognitionService:
        def __init__(self, model_path=None):
            pass

        async def verify_attendance(self, student_id, image_data):
            return {"verified": False, "confidence": 0.0}

    # Phase 7 dummy services
    class ConversationalTutorService:
        async def process_message(self, *args, **kwargs):
            return {"response_text": "dummy response", "confidence_score": 0.5}

        async def get_student_conversations(self, *args, **kwargs):
            return []

        async def get_conversation_history(self, *args, **kwargs):
            return {}

        async def end_conversation(self, *args, **kwargs):
            return True

    class NLPEngine:
        async def analyze_message(self, *args, **kwargs):
            return {"intent": "general", "sentiment": "neutral"}

    class QAEngine:
        async def process_question(self, *args, **kwargs):
            return {"answer_text": "dummy answer", "confidence": 0.5}

        async def get_suggestions(self, *args, **kwargs):
            return []

    class OptimizedEmbeddingService:
        async def generate_embedding(self, *args, **kwargs):
            return [0.0] * 384

    class SkillGraphService:
        pass

    class RealTimeAnalytics:
        pass

    # Instantiate dummy services
    embedding_service = _DummyEmbeddingService()
    vector_store = _DummyVectorStore()
    llm_service = _DummyLLMService()
    content_parser = _DummyContentParser()
    AssessmentGenerator = AssessmentGenerator
    AutoGrader = AutoGrader
    PersonalizationEngine = PersonalizationEngine
    pathway_generator = PathwayGenerator()
    StreakService = StreakService
    FaceRecognitionService = FaceRecognitionService
    # Phase 7 services
    ConversationalTutorService = ConversationalTutorService
    NLPEngine = NLPEngine
    QAEngine = QAEngine
    OptimizedEmbeddingService = OptimizedEmbeddingService
    SkillGraphService = SkillGraphService
    RealTimeAnalytics = RealTimeAnalytics

from config import settings

# Initialize new services
assessment_generator = AssessmentGenerator()
auto_grader = AutoGrader()
personalization_engine = PersonalizationEngine()
streak_service = StreakService(settings.REDIS_URL)
face_recognition = FaceRecognitionService(settings.FACE_MODEL_PATH)

# Initialize Phase 7 services
try:
    optimized_embedding = OptimizedEmbeddingService()
    skill_graph = SkillGraphService()
    analytics = RealTimeAnalytics()
    conversational_tutor = ConversationalTutorService(optimized_embedding, vector_store, skill_graph, analytics)
    nlp_engine = NLPEngine(optimized_embedding)
    qa_engine = QAEngine(nlp_engine, vector_store, optimized_embedding)
except Exception as e:
    logger.warning(f"Could not initialize Phase 7 services: {e}; using dummy implementations")
    # Dummy instances
    optimized_embedding = OptimizedEmbeddingService()
    skill_graph = SkillGraphService()
    analytics = RealTimeAnalytics()
    conversational_tutor = ConversationalTutorService()
    nlp_engine = NLPEngine()
    qa_engine = QAEngine()

# Prometheus metrics
try:
    REQUEST_COUNT = Counter('lumina_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
    REQUEST_LATENCY = Histogram('lumina_request_duration_seconds', 'Request duration', ['method', 'endpoint'])
except ValueError:
    # Handle duplicate registration in development reloads
    from prometheus_client import REGISTRY
    REQUEST_COUNT = REGISTRY._names_to_collectors['lumina_requests_total']
    REQUEST_LATENCY = REGISTRY._names_to_collectors['lumina_request_duration_seconds']

# Define assessment-specific metrics
try:
    ASSESSMENT_GENERATION_TIME = Histogram(
        'lumina_assessment_generation_seconds',
        'Time taken to generate assessments',
        ['assessment_type', 'difficulty']
    )
    ASSESSMENT_QUESTION_COUNT = Counter(
        'lumina_assessment_questions_total',
        'Number of questions generated',
        ['assessment_type', 'difficulty']
    )
    ASSESSMENT_ERROR_COUNT = Counter(
        'lumina_assessment_errors_total',
        'Number of assessment generation errors',
        ['assessment_type', 'error_type']
    )
except ValueError:
    # Handle duplicate registration in development reloads
    from prometheus_client import REGISTRY
    ASSESSMENT_GENERATION_TIME = REGISTRY._names_to_collectors['lumina_assessment_generation_seconds']
    ASSESSMENT_QUESTION_COUNT = REGISTRY._names_to_collectors['lumina_assessment_questions_total']
    ASSESSMENT_ERROR_COUNT = REGISTRY._names_to_collectors['lumina_assessment_errors_total']

# JWT Security
security = HTTPBearer()

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
    difficulty: Optional[str] = "intermediate"

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

# Metrics endpoint for Prometheus
@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Import auth utilities
from auth import (
    UserCreate, UserLogin, TokenResponse, generate_tokens,
    create_user, authenticate_user, get_current_user,
    require_admin, require_teacher, require_student,
    require_teacher_or_admin, require_student_or_teacher
)
from db import get_db
from models import User, Course, Lesson, StudentProgress, UserRole
from sqlalchemy.orm import Session

# Pydantic models for LMS endpoints
class CourseCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class LessonCreate(BaseModel):
    course_id: str
    title: str
    content: Optional[str] = None
    order: int

class ProgressUpdate(BaseModel):
    completed_lessons: List[int]
    mastery_score: Optional[float] = None

# Middleware for metrics
@app.middleware("http")
async def add_metrics(request: Request, call_next):
    """Add Prometheus metrics to all requests"""
    start_time = datetime.utcnow()
    response = await call_next(request)
    process_time = (datetime.utcnow() - start_time).total_seconds()

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(process_time)

    return response

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
async def generate_pathway(request: PathwayGenerationRequest, current_user: dict = Depends(get_current_user)):
    """Generate personalized learning pathway"""
    try:
        logger.info(f"Generating pathway for student: {request.student_id}")

        # Validate user permissions
        if current_user["role"] not in ["admin", "teacher"] and current_user["user_id"] != request.student_id:
            raise HTTPException(status_code=403, detail="Access denied")

        pathway = await pathway_generator.generate_pathway(
            student_id=request.student_id,
            current_skills=request.current_skills,
            target_skills=request.target_skills,
            learning_style=request.learning_style,
            difficulty=request.difficulty
        )

        # Store pathway data in database
        from models import LearningPathway
        db: Session = next(get_db())

        # Create or update learning pathway record
        pathway_record = LearningPathway(
            id=str(uuid.uuid4()),
            student_id=request.student_id,
            course_id="general_course",  # TODO: Make this dynamic based on context
            pathway_data=pathway,
            status="active",
            created_at=datetime.utcnow()
        )
        db.add(pathway_record)
        db.commit()

        return pathway
    except Exception as e:
        logger.error(f"Pathway generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/student/pathway/{student_id}")
async def get_student_pathway(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get student's current learning pathway and recommended next steps"""
    try:
        # Validate user permissions
        if current_user["role"] not in ["admin", "teacher"] and current_user["user_id"] != student_id:
            raise HTTPException(status_code=403, detail="Access denied")

        logger.info(f"Getting pathway for student: {student_id}")

        # Get the most recent active pathway from database
        from models import LearningPathway
        db: Session = next(get_db())

        pathway_record = db.query(LearningPathway).filter(
            LearningPathway.student_id == student_id,
            LearningPathway.status == "active"
        ).order_by(LearningPathway.created_at.desc()).first()

        if not pathway_record:
            # Generate a new pathway if none exists
            logger.info(f"No existing pathway found for student {student_id}, generating new one")
            pathway = await pathway_generator.generate_pathway(
                student_id=student_id,
                current_skills=[],  # TODO: Fetch from skill_levels table
                target_skills=["basic_math", "algebra"],  # Default target skills
                learning_style="visual",
                difficulty="intermediate"
            )

            # Store the new pathway
            pathway_record = LearningPathway(
                id=str(uuid.uuid4()),
                student_id=student_id,
                course_id="general_course",
                pathway_data=pathway,
                status="active",
                created_at=datetime.utcnow()
            )
            db.add(pathway_record)
            db.commit()
        else:
            pathway = pathway_record.pathway_data

        # Get recommended next step
        next_step = await pathway_generator.get_next_recommended_step(student_id, pathway)

        return {
            "student_id": student_id,
            "pathway": pathway,
            "next_step": next_step,
            "pathway_id": pathway_record.id,
            "last_updated": pathway_record.created_at.isoformat()
        }
    except Exception as e:
        logger.error(f"Get student pathway error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Assessment generation endpoint
@app.post("/api/generate-assessment")
async def generate_assessment(request: AssessmentGenerationRequest):
    """Generate automated assessments"""
    tracer = trace.get_tracer(__name__)
    
    try:
        logger.info(f"Generating {request.assessment_type} assessment for course: {request.course_id}")
        
        with tracer.start_as_current_span("assessment_generation") as span, ASSESSMENT_GENERATION_TIME.labels(
            assessment_type=request.assessment_type,
            difficulty=request.difficulty
        ).time():
            # Add trace context
            span.set_attribute("course_id", request.course_id)
            span.set_attribute("assessment_type", request.assessment_type)
            span.set_attribute("difficulty", request.difficulty)
            span.set_attribute("num_questions", request.num_questions)
            
            # Generate assessment
            assessment = await assessment_generator.generate_assessment(
                request.course_id, request.lesson_id, request.assessment_type,
                request.num_questions, request.difficulty
            )
            
            # Record metrics
            ASSESSMENT_QUESTION_COUNT.labels(
                assessment_type=request.assessment_type,
                difficulty=request.difficulty
            ).inc(request.num_questions)
            
            # Add result context to span
            span.set_attribute("generated_questions", len(assessment.get("assessment", [])))
            span.set_status(trace.StatusCode.OK)
            
            return assessment
            
    except Exception as e:
        error_type = type(e).__name__
        ASSESSMENT_ERROR_COUNT.labels(
            assessment_type=request.assessment_type,
            error_type=error_type
        ).inc()
        
        if tracer.get_current_span():
            current_span = tracer.get_current_span()
            current_span.set_status(trace.StatusCode.ERROR, str(e))
            current_span.record_exception(e)
            
        logger.error(f"Assessment generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Adaptive learning suggestions endpoint
@app.post("/api/adaptive-learning")
async def adaptive_learning(request: AdaptiveLearningRequest):
    """Provide adaptive learning suggestions"""
    try:
        logger.info(f"Generating adaptive suggestions for student: {request.student_id}")

        recommendations = await personalization_engine.get_adaptive_recommendations(
            request.student_id, request.current_performance
        )

        return {
            "student_id": request.student_id,
            "recommendations": recommendations
        }
    except Exception as e:
        logger.error(f"Adaptive learning error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Streak service endpoints
@app.post("/api/record-activity")
async def record_activity(student_id: str, activity_type: str):
    """Record student activity for streak tracking"""
    try:
        logger.info(f"Recording activity for student: {student_id}, type: {activity_type}")

        success = await streak_service.record_activity(student_id, activity_type)

        return {
            "student_id": student_id,
            "activity_type": activity_type,
            "recorded": success
        }
    except Exception as e:
        logger.error(f"Record activity error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/streak/{student_id}")
async def get_streak(student_id: str):
    """Get streak information for a student"""
    try:
        logger.info(f"Getting streak info for student: {student_id}")

        streak_info = await streak_service.get_streak_info(student_id)

        return streak_info
    except Exception as e:
        logger.error(f"Get streak error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Face recognition attendance endpoint
@app.post("/api/verify-attendance")
async def verify_attendance(student_id: str, file: UploadFile = File(...)):
    """Verify student attendance using face recognition"""
    try:
        logger.info(f"Verifying attendance for student: {student_id}")

        # Read image file
        image_data = await file.read()

        # Verify attendance
        result = await face_recognition.verify_attendance(student_id, image_data)

        return result
    except Exception as e:
        logger.error(f"Verify attendance error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics endpoints for teacher dashboard
@app.get("/api/class-analytics/{course_id}")
async def get_class_analytics(course_id: str, current_user: dict = Depends(get_current_user)):
    """Get class-level analytics for teacher dashboard"""
    try:
        logger.info(f"Getting class analytics for course: {course_id}")

        # Get class overview stats
        analytics = await personalization_engine.get_class_analytics(course_id)

        return analytics
    except Exception as e:
        logger.error(f"Class analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/student-analytics/{student_id}")
async def get_student_analytics(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed student analytics"""
    try:
        logger.info(f"Getting student analytics for student: {student_id}")

        analytics = await personalization_engine.get_student_analytics(student_id)

        # Mock data for development - replace with real analytics
        if not analytics or len(analytics) == 0:
            analytics = {
                "student_id": student_id,
                "name": "Alice Johnson",
                "progress_history": {
                    "labels": ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
                    "data": [65, 72, 78, 82, 85, 88]
                },
                "assessment_scores": {
                    "labels": ["Quiz 1", "Midterm", "Quiz 2", "Final"],
                    "data": [75, 82, 88, 91]
                },
                "topic_mastery": {
                    "labels": ["Algebra", "Geometry", "Calculus", "Statistics"],
                    "data": [85, 78, 72, 88]
                },
                "current_mastery": 85,
                "streak": 5,
                "attendance_rate": 95,
                "weak_topics": ["Calculus", "Trigonometry"],
                "recommendations": [
                    "Focus on Calculus practice problems",
                    "Review Trigonometry fundamentals"
                ]
            }

        return analytics
    except Exception as e:
        logger.error(f"Student analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/weakness-detection/{course_id}")
async def get_weakness_detection(course_id: str, current_user: dict = Depends(get_current_user)):
    """Get weakness detection analysis for course"""
    try:
        logger.info(f"Getting weakness detection for course: {course_id}")

        weaknesses = await personalization_engine.detect_weaknesses(course_id)

        return weaknesses
    except Exception as e:
        logger.error(f"Weakness detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/attendance-reports/{course_id}")
async def get_attendance_reports(course_id: str, current_user: dict = Depends(get_current_user)):
    """Get attendance reports for course"""
    try:
        logger.info(f"Getting attendance reports for course: {course_id}")

        # Query attendance data from database
        from db import get_db
        from sqlalchemy.orm import Session
        from models import Attendance, User

        db: Session = next(get_db())

        attendance_records = db.query(
            Attendance, User.name
        ).join(
            User, Attendance.student_id == User.id
        ).filter(
            Attendance.course_id == course_id
        ).all()

        reports = []
        for record, student_name in attendance_records:
            reports.append({
                "student_name": student_name,
                "check_in_time": record.check_in_time.isoformat() if record.check_in_time else None,
                "check_out_time": record.check_out_time.isoformat() if record.check_out_time else None,
                "duration_minutes": record.duration_minutes,
                "attendance_type": record.attendance_type,
                "is_present": record.is_present,
                "confidence_score": record.confidence_score
            })
        return {"attendance_reports": reports}
    except Exception as e:
        logger.error(f"Attendance reports error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Authentication endpoints
@app.post("/api/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        logger.info(f"Registering new user: {user_data.email}")

        user = create_user(db, user_data)
        tokens = generate_tokens(user)

        return tokens
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return tokens"""
    try:
        logger.info(f"Login attempt for: {credentials.email}")

        user = authenticate_user(db, credentials.email, credentials.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        tokens = generate_tokens(user)
        return tokens
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/auth/refresh")
async def refresh_token(token_data: dict = Depends(get_current_user)):
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        from auth import verify_token
        refresh_payload = verify_token(token_data.get("refresh_token", ""), "refresh")

        # Generate new tokens
        from auth import generate_tokens
        user_data = {
            "user_id": refresh_payload.user_id,
            "role": refresh_payload.role
        }

        # Get user from database
        db: Session = next(get_db())
        user = db.query(User).filter(User.id == refresh_payload.user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        tokens = generate_tokens(user)
        return tokens
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# LMS Core endpoints
@app.get("/api/courses")
async def get_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses (filtered by user role)"""
    try:
        if current_user.role == UserRole.admin:
            courses = db.query(Course).all()
        elif current_user.role == UserRole.teacher:
            courses = db.query(Course).filter(Course.teacher_id == current_user.id).all()
        else:  # student
            # Students see courses they're enrolled in (via groups or direct enrollment)
            courses = db.query(Course).all()  # TODO: Implement proper enrollment logic

        return [
            {
                "id": course.id,
                "name": course.name,
                "description": course.description,
                "teacher_id": course.teacher_id,
                "status": course.status,
                "created_at": course.created_at,
                "updated_at": course.updated_at
            }
            for course in courses
        ]
    except Exception as e:
        logger.error(f"Get courses error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/courses", dependencies=[Depends(require_teacher_or_admin)])
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new course"""
    try:
        course_id = f"course_{uuid.uuid4().hex[:8]}"
        course = Course(
            id=course_id,
            name=course_data.name,
            description=course_data.description,
            teacher_id=current_user.id
        )
        db.add(course)
        db.commit()
        db.refresh(course)

        return {
            "id": course.id,
            "name": course.name,
            "description": course.description,
            "teacher_id": course.teacher_id,
            "status": course.status,
            "created_at": course.created_at
        }
    except Exception as e:
        logger.error(f"Create course error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/courses/{course_id}")
async def get_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get course details"""
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check permissions
        if (current_user.role not in [UserRole.admin, UserRole.teacher] and
            course.teacher_id != current_user.id):
            raise HTTPException(status_code=403, detail="Access denied")

        return {
            "id": course.id,
            "name": course.name,
            "description": course.description,
            "teacher_id": course.teacher_id,
            "status": course.status,
            "created_at": course.created_at,
            "updated_at": course.updated_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get course error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/courses/{course_id}/lessons")
async def get_course_lessons(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get lessons for a course"""
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        lessons = db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.order).all()

        return [
            {
                "id": lesson.id,
                "title": lesson.title,
                "content": lesson.content,
                "order": lesson.order,
                "created_at": lesson.created_at,
                "updated_at": lesson.updated_at
            }
            for lesson in lessons
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get course lessons error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/courses/{course_id}/lessons", dependencies=[Depends(require_teacher_or_admin)])
async def create_lesson(
    course_id: str,
    lesson_data: LessonCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new lesson for a course"""
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if course.teacher_id != current_user.id and current_user.role != UserRole.admin:
            raise HTTPException(status_code=403, detail="Access denied")

        lesson = Lesson(
            course_id=course_id,
            title=lesson_data.title,
            content=lesson_data.content,
            order=lesson_data.order
        )
        db.add(lesson)
        db.commit()
        db.refresh(lesson)

        return {
            "id": lesson.id,
            "course_id": lesson.course_id,
            "title": lesson.title,
            "content": lesson.content,
            "order": lesson.order,
            "created_at": lesson.created_at
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create lesson error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/progress/{student_id}")
async def get_student_progress(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student progress"""
    try:
        # Check permissions
        if (current_user.role == UserRole.student and current_user.id != student_id):
            raise HTTPException(status_code=403, detail="Access denied")

        progress = db.query(StudentProgress).filter(
            StudentProgress.student_id == student_id
        ).all()

        return [
            {
                "id": p.id,
                "course_id": p.course_id,
                "completed_lessons": p.completed_lessons,
                "mastery_score": p.mastery_score,
                "current_streak": p.current_streak,
                "last_activity": p.last_activity
            }
            for p in progress
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get student progress error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/progress/{student_id}")
async def update_student_progress(
    student_id: str,
    progress_data: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update student progress"""
    try:
        # Check permissions
        if (current_user.role == UserRole.student and current_user.id != student_id):
            raise HTTPException(status_code=403, detail="Access denied")

        # Find or create progress record
        progress = db.query(StudentProgress).filter(
            StudentProgress.student_id == student_id
        ).first()

        if not progress:
            progress = StudentProgress(
                student_id=student_id,
                completed_lessons=progress_data.completed_lessons,
                mastery_score=progress_data.mastery_score
            )
            db.add(progress)
        else:
            progress.completed_lessons = progress_data.completed_lessons
            if progress_data.mastery_score is not None:
                progress.mastery_score = progress_data.mastery_score
            progress.last_activity = datetime.utcnow()

        db.commit()
        db.refresh(progress)

        return {
            "id": progress.id,
            "student_id": progress.student_id,
            "completed_lessons": progress.completed_lessons,
            "mastery_score": progress.mastery_score,
            "last_activity": progress.last_activity
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update student progress error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-content")
async def upload_content(
    file: UploadFile = File(...),
    course_id: Optional[str] = None,
    current_user: User = Depends(require_teacher_or_admin)
):
    """Upload content file (PDF, etc.)"""
    try:
        # Validate file type
        if file.filename.split('.')[-1].lower() not in settings.allowed_extensions:
            raise HTTPException(status_code=400, detail="File type not allowed")

        # Validate file size
        file_content = await file.read()
        if len(file_content) > settings.max_upload_size:
            raise HTTPException(status_code=400, detail="File too large")

        # Save file (in production, use cloud storage)
        content_id = str(uuid.uuid4())
        file_path = f"uploads/{content_id}_{file.filename}"

        os.makedirs("uploads", exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_content)

        return {
            "content_id": content_id,
            "filename": file.filename,
            "file_path": file_path,
            "course_id": course_id,
            "uploaded_by": current_user.id,
            "uploaded_at": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload content error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Background task for content processing
async def process_content_async(request: ContentIngestionRequest, content_id: str):
    """Process content in background with chunk-level embeddings"""
    tracer = trace.get_tracer(__name__)
    
    try:
        with tracer.start_as_current_span("content_processing") as content_span:
            content_span.set_attribute("content_id", content_id)
            content_span.set_attribute("content_type", request.content_type)
            logger.info(f"Processing content asynchronously: {content_id}")

            # Parse and chunk content
            with tracer.start_span("content_parsing") as parsing_span:
                chunks = content_parser.parse_text(request.content)
                parsing_span.set_attribute("num_chunks", len(chunks))

            # Process chunks in batches
            batch_size = 10
            chunk_batches = [chunks[i:i + batch_size] for i in range(0, len(chunks), batch_size)]

            for batch_idx, chunk_batch in enumerate(chunk_batches):
                with tracer.start_span("batch_processing") as batch_span:
                    batch_span.set_attribute("batch_idx", batch_idx)
                    batch_span.set_attribute("batch_size", len(chunk_batch))

                    # Generate embeddings for the batch
                    texts = [chunk["content"] for chunk in chunk_batch]
                    embeddings = embedding_service.encode_batch(texts)

                    # Prepare chunks for vector store
                    chunk_ids = [f"{content_id}_chunk_{chunk['chunk_num']}" for chunk in chunk_batch]
                    chunk_metadata = []
                    
                    for chunk, embed in zip(chunk_batch, embeddings):
                        metadata = {
                            **request.metadata,
                            **chunk,  # Include chunk-specific info
                            "content_id": content_id,
                            "content_type": request.content_type,
                            "processed_at": datetime.utcnow().isoformat(),
                            "embedding_version": settings.EMBEDDING_MODEL
                        }
                        chunk_metadata.append(metadata)

                    # Store batch in vector database
                    success = await vector_store.insert_batch(
                        ids=chunk_ids,
                        embeddings=embeddings,
                        contents=[chunk["content"] for chunk in chunk_batch],
                        metadatas=chunk_metadata
                    )

                    if not success:
                        raise Exception(f"Failed to insert batch {batch_idx}")

                    logger.info(f"Processed batch {batch_idx + 1}/{len(chunk_batches)}")

            content_span.set_attribute("total_chunks", len(chunks))
            logger.info(f"Content processed successfully: {content_id} ({len(chunks)} chunks)")
            content_span.set_status(trace.StatusCode.OK)

    except Exception as e:
        logger.error(f"Background content processing error: {str(e)}")
        if tracer.get_current_span():
            current_span = tracer.get_current_span()
            current_span.set_status(trace.StatusCode.ERROR, str(e))
            current_span.record_exception(e)
        raise
# Initialize OpenTelemetry
def init_telemetry():
    """Initialize OpenTelemetry configuration"""
    # Create a resource with service name
    resource = Resource(attributes={
        SERVICE_NAME: "lumina-ai-backend"
    })

    # Set up the trace provider
    trace_provider = TracerProvider(resource=resource)
    
    # Create gRPC exporter
    otlp_exporter = OTLPSpanExporter(
        endpoint="http://localhost:4317",  # Default OTLP gRPC endpoint
        insecure=True
    )
    
    # Add BatchSpanProcessor to the trace provider
    trace_provider.add_span_processor(
        BatchSpanProcessor(otlp_exporter)
    )
    
    # Set the trace provider as the global provider
    trace.set_tracer_provider(trace_provider)
    
    # Instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)
    
    # Instrument SQLAlchemy
    from db import engine
    SQLAlchemyInstrumentor().instrument(engine=engine)
    
    # Instrument Redis if used
    try:
        from services.streak_service import redis_client
        RedisInstrumentor().instrument()
    except ImportError:
        logger.warning("Redis instrumentation skipped - client not found")
    
    # Instrument requests library
    RequestsInstrumentor().instrument()

# Startup event
# WebSocket endpoints for real-time updates
@app.websocket("/ws/student/{student_id}")
async def student_websocket(websocket: WebSocket, student_id: str):
    """WebSocket endpoint for student real-time updates"""
    try:
        await realtime_pathway_service.handle_student_connection(websocket, student_id)
    except WebSocketDisconnect:
        logger.info(f"Student {student_id} disconnected from WebSocket")
    except Exception as e:
        logger.error(f"Student WebSocket error: {str(e)}")

@app.websocket("/ws/teacher/{teacher_id}")
async def teacher_websocket(websocket: WebSocket, teacher_id: str):
    """WebSocket endpoint for teacher real-time updates"""
    try:
        await realtime_pathway_service.connection_manager.connect_teacher(websocket, teacher_id)
        
        while True:
            try:
                data = await websocket.receive_json()
                # Handle teacher-specific messages
                if data.get("type") == "analytics_request":
                    analytics = await personalization_engine.get_class_analytics(
                        data.get("course_id")
                    )
                    await websocket.send_json({
                        "type": "analytics_update",
                        "data": analytics
                    })
            except WebSocketDisconnect:
                await realtime_pathway_service.connection_manager.disconnect_teacher(websocket, teacher_id)
                break
    except Exception as e:
        logger.error(f"Teacher WebSocket error: {str(e)}")

@app.websocket("/ws/analytics")
async def analytics_websocket(websocket: WebSocket):
    """WebSocket endpoint for analytics observers"""
    try:
        await realtime_pathway_service.connection_manager.connect_analytics(websocket)
        
        while True:
            try:
                await websocket.receive_text()  # Keep connection alive
            except WebSocketDisconnect:
                await realtime_pathway_service.connection_manager.disconnect_analytics(websocket)
                break
    except Exception as e:
        logger.error(f"Analytics WebSocket error: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Lumina AI Backend")
    
    # Initialize OpenTelemetry
    init_telemetry()
    logger.info("OpenTelemetry instrumentation initialized")
    
    # Create database tables (commented out for quick local dev; uncomment if using Postgres with proper schema)
    # from db import create_tables
    # create_tables()
    # logger.info("Database tables created/verified")
    
    logger.info("Skipping DB table creation for local dev (using dummy services)")
    
    # Initialize WebSocket service (commented out for quick local dev; requires networkx and other heavy deps)
    global realtime_pathway_service
    realtime_pathway_service = None  # Set to None for local dev
    # from services.websocket_service import RealTimePathwayService
    # realtime_pathway_service = RealTimePathwayService()
    # logger.info("WebSocket service initialized")
    logger.info("WebSocket service skipped for quick local dev")

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
