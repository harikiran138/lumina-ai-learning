from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
import uuid

# --- Core Utilities ---


def generate_id() -> str:
    return str(uuid.uuid4())


def current_time_iso() -> str:
    return datetime.utcnow().isoformat()


# --- 1. USER & AUTH SYSTEM ---


class User(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    email: EmailStr
    hashed_password: str
    full_name: str
    role: str = "student"  # student, teacher, admin
    profile_image: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)
    last_login: Optional[str] = None
    is_active: bool = True


class Session(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    user_id: str
    token: str
    expires_at: str
    ip_address: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)


# --- 2. LEARNER PROFILE ENGINE ---


class MasteryLevel(BaseModel):
    score: float = 0.0  # 0.0 to 1.0
    confidence: float = 0.0
    last_assessed: Optional[str] = None


class LearnerProfile(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    user_id: str
    # Map of topic_id -> MasteryLevel
    mastery_levels: Dict[str, MasteryLevel] = {}
    learning_style: Optional[str] = None  # visual, auditory, kinesthetic
    strengths: List[str] = []
    weaknesses: List[str] = []
    goals: List[str] = []
    updated_at: str = Field(default_factory=current_time_iso)


class BehaviorLog(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    user_id: str
    action: str  # e.g., "view_lesson", "complete_quiz", "ask_tutor"
    metadata: Dict[str, Any] = {}
    timestamp: str = Field(default_factory=current_time_iso)


# --- 3. AI AGENT SYSTEM (MCP) ---


class AgentMemory(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    agent_id: str  # e.g., "tutor_v1"
    user_id: str
    context_key: str  # e.g., "last_discussed_topic"
    memory_value: Any
    timestamp: str = Field(default_factory=current_time_iso)


class Message(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: str = Field(default_factory=current_time_iso)


class Conversation(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    user_id: str
    agent_id: str
    messages: List[Message] = []
    summary: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)


# --- 4. CONTENT SYSTEM ---


class Lesson(BaseModel):
    id: str = Field(default_factory=generate_id)
    title: str
    content_type: str  # video, text, quiz
    content_url: Optional[str] = None
    content_body: Optional[str] = None  # Markdown content
    duration_minutes: int = 0
    order: int = 0


class Module(BaseModel):
    id: str = Field(default_factory=generate_id)
    title: str
    description: Optional[str] = None
    lessons: List[Lesson] = []
    order: int = 0


class Course(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    title: str
    description: str
    instructor_id: str
    modules: List[Module] = []
    published: bool = False
    thumbnail_url: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)


# --- 5. ASSESSMENT ENGINE ---


class Question(BaseModel):
    id: str = Field(default_factory=generate_id)
    text: str
    options: List[str]
    correct_option_index: int
    explanation: Optional[str] = None
    points: int = 1


class Quiz(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    course_id: Optional[str] = None
    module_id: Optional[str] = None
    title: str
    questions: List[Question] = []
    difficulty: str = "medium"  # easy, medium, hard
    created_at: str = Field(default_factory=current_time_iso)


class QuizAttempt(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    user_id: str
    quiz_id: str
    score: float
    max_score: float
    answers: List[int]  # List of selected indices
    timestamp: str = Field(default_factory=current_time_iso)


# --- 6. DASHBOARDS (Aggregated) ---


class TeacherStats(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    teacher_id: str
    total_students: int = 0
    active_courses: int = 0
    avg_mastery: float = 0.0
    pending_grading: int = 0
    last_updated: str = Field(default_factory=current_time_iso)


class StudentStats(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    user_id: str
    streak_days: int = 0
    total_learning_minutes: int = 0
    completed_lessons: int = 0
    avg_quiz_score: float = 0.0
    last_updated: str = Field(default_factory=current_time_iso)


# --- 7. ANALYTICS ENGINE ---


class AnalyticsEvent(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    type: str  # click, view, submit, error
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    timestamp: str = Field(default_factory=current_time_iso)


class TutorSession(BaseModel):
    id: str = Field(default_factory=generate_id, alias="_id")
    session_id: str
    asked_hashes: List[str] = []
    asked_questions_preview: List[str] = []
    topic_coverage: Dict[str, int] = {}
    last_activity: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)
