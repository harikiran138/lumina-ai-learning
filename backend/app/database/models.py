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
    id: str = Field(default_factory=generate_id)
    email: EmailStr
    hashed_password: str
    full_name: str
    role: str = "student"  # student, teacher, admin
    profile_image: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)
    last_login: Optional[str] = None
    is_active: bool = True


class Session(BaseModel):
    id: str = Field(default_factory=generate_id)
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
    id: str = Field(default_factory=generate_id)
    user_id: str
    # Map of topic_id -> MasteryLevel
    mastery_levels: Dict[str, MasteryLevel] = {}
    learning_style: Optional[str] = None  # visual, auditory, kinesthetic
    strengths: List[str] = []
    weaknesses: List[str] = []
    goals: List[str] = []
    updated_at: str = Field(default_factory=current_time_iso)


class LearningEvent(BaseModel):
    id: str = Field(default_factory=generate_id)
    user_id: str
    action: str  # e.g., "view_lesson", "complete_quiz", "ask_tutor"
    metadata: Dict[str, Any] = {}
    timestamp: str = Field(default_factory=current_time_iso)


# --- 3. AI AGENT SYSTEM (MCP) ---


class AgentMemory(BaseModel):
    id: str = Field(default_factory=generate_id)
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
    id: str = Field(default_factory=generate_id)
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
    id: str = Field(default_factory=generate_id)
    title: str
    description: str
    instructor_id: str
    modules: List[Module] = []
    published: bool = False
    thumbnail_url: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)


class Enrollment(BaseModel):
    id: str = Field(default_factory=generate_id)
    user_id: str
    course_id: str
    status: str = "active"  # active, completed, dropped
    progress: float = 0.0
    last_accessed: str = Field(default_factory=current_time_iso)
    enrolled_at: str = Field(default_factory=current_time_iso)


# --- 5. ASSESSMENT ENGINE ---


class Question(BaseModel):
    id: str = Field(default_factory=generate_id)
    text: str
    options: List[str]
    correct_option_index: int
    explanation: Optional[str] = None
    points: int = 1


class Quiz(BaseModel):
    id: str = Field(default_factory=generate_id)
    course_id: Optional[str] = None
    module_id: Optional[str] = None
    title: str
    questions: List[Question] = []
    difficulty: str = "medium"  # easy, medium, hard
    created_at: str = Field(default_factory=current_time_iso)


class QuizAttempt(BaseModel):
    id: str = Field(default_factory=generate_id)
    user_id: str
    quiz_id: str
    score: float
    max_score: float
    answers: List[int]  # List of selected indices
    timestamp: str = Field(default_factory=current_time_iso)


class Assignment(BaseModel):
    id: str = Field(default_factory=generate_id)
    course_id: str
    title: str
    description: str
    due_date: Optional[str] = None
    max_points: int = 100
    created_at: str = Field(default_factory=current_time_iso)


class AssignmentSubmission(BaseModel):
    id: str = Field(default_factory=generate_id)
    assignment_id: str
    student_id: str
    submission_content: str
    file_url: Optional[str] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: str = Field(default_factory=current_time_iso)


# --- 6. DASHBOARDS (Aggregated) ---


class TeacherStats(BaseModel):
    id: str = Field(default_factory=generate_id)
    teacher_id: str
    total_students: int = 0
    active_courses: int = 0
    avg_mastery: float = 0.0
    pending_grading: int = 0
    last_updated: str = Field(default_factory=current_time_iso)


class StudentStats(BaseModel):
    id: str = Field(default_factory=generate_id)
    user_id: str
    streak_days: int = 0
    total_learning_minutes: int = 0
    completed_lessons: int = 0
    avg_quiz_score: float = 0.0
    last_updated: str = Field(default_factory=current_time_iso)


# --- 7. ANALYTICS ENGINE ---


class AnalyticsEvent(BaseModel):
    id: str = Field(default_factory=generate_id)
    type: str  # click, view, submit, error
    user_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    timestamp: str = Field(default_factory=current_time_iso)


class TutorSession(BaseModel):
    id: str = Field(default_factory=generate_id)
    session_id: str
    asked_hashes: List[str] = []
    asked_questions_preview: List[str] = []
    topic_coverage: Dict[str, int] = {}
    last_activity: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)

# --- 8. INSTITUTION & STAKEHOLDER MANAGEMENT ---


class Institution(BaseModel):
    id: str = Field(default_factory=generate_id)
    institution_name: str
    email: Optional[EmailStr] = None
    institution_type: Optional[str] = None  # Private, Government, Deemed, Trust
    institution_status: Optional[str] = None  # Autonomous, Affiliated, etc.
    established_year: Optional[int] = None
    university_affiliation: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    vision: Optional[str] = None
    mission: Optional[str] = None
    onboarding_status: str = "PENDING"
    created_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)


class Department(BaseModel):
    id: str = Field(default_factory=generate_id)
    institution_id: str
    department_name: str
    hod_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)


class Program(BaseModel):
    id: str = Field(default_factory=generate_id)
    institution_id: str
    program_name: str
    degree: Optional[str] = None
    level: Optional[str] = None
    intake: Optional[int] = None
    status: str = "active"
    created_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)


class Stakeholder(BaseModel):
    id: str = Field(default_factory=generate_id)
    program_id: Optional[str] = None
    institution_id: Optional[str] = None
    user_id: Optional[str] = None  # Link to User if they are a login user
    name: str
    email: Optional[EmailStr] = None
    contact_no: Optional[str] = None
    organization: Optional[str] = None
    category: str  # Student, Teacher, Parent, Alumni, Industry, etc.
    feedback_enabled: bool = False
    created_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)


class InstitutionDetails(BaseModel):
    institution_id: str
    type: Optional[str] = None
    status: Optional[str] = None
    established_year: Optional[int] = None
    affiliation: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    vision: Optional[str] = None
    mission: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)


class Semester(BaseModel):
    id: str = Field(default_factory=generate_id)
    program_id: str
    semester_number: int
    title: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)


class ClassSection(BaseModel):
    id: str = Field(default_factory=generate_id)
    program_id: str
    semester_id: Optional[str] = None
    class_name: str
    batch: Optional[str] = None
    section: Optional[str] = None
    created_at: str = Field(default_factory=current_time_iso)


class StudentEnrollment(BaseModel):
    id: str = Field(default_factory=generate_id)
    student_id: str
    program_id: str
    current_semester_id: Optional[str] = None
    class_id: Optional[str] = None
    year_of_study: int = 1
    status: str = "active"
    enrolled_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)


class StudentCredit(BaseModel):
    id: str = Field(default_factory=generate_id)
    student_id: str
    semester_id: str
    earned_credits: int = 0
    total_credits: int = 0
    updated_at: str = Field(default_factory=current_time_iso)


class TeacherRequest(BaseModel):
    id: str = Field(default_factory=generate_id)
    teacher_id: str
    course_id: Optional[str] = None
    class_id: Optional[str] = None
    department_id: Optional[str] = None
    message: Optional[str] = None
    status: str = "PENDING_HOD"
    hod_status: str = "PENDING"
    admin_status: str = "PENDING"
    created_at: str = Field(default_factory=current_time_iso)
    updated_at: str = Field(default_factory=current_time_iso)
    hod_reviewed_at: Optional[str] = None
    admin_reviewed_at: Optional[str] = None


class TeacherAssignment(BaseModel):
    id: str = Field(default_factory=generate_id)
    teacher_id: str
    course_id: Optional[str] = None
    class_id: Optional[str] = None
    is_primary: bool = True
    created_at: str = Field(default_factory=current_time_iso)


class CourseConcept(BaseModel):
    id: str = Field(default_factory=generate_id)
    course_id: str
    concept_name: str
    created_at: str = Field(default_factory=current_time_iso)
