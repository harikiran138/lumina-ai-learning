from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
import uuid


class Option(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str


class QuestionMetadata(BaseModel):
    """Metadata used for adaptive selection and mastery tracking."""

    question_id: str
    concepts: List[str] = Field(default_factory=list)
    difficulty: float = 0.5
    blooms_level: Optional[str] = None


class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    options: List[Option]
    correct_option_id: str
    explanation: Optional[str] = None
    difficulty: float = 0.5  # 0.0 to 1.0
    topic: str
    metadata: Optional[QuestionMetadata] = None


class MasteryState(BaseModel):
    """Tracks concept-level mastery for a student.

    Values are probabilities in [0, 1].
    """

    student_id: str
    concept_mastery: Dict[str, float] = Field(default_factory=dict)


class StudentResponse(BaseModel):
    question_id: str
    # For ID-based MCQs (LLM-generated questions)
    selected_option_id: Optional[str] = None
    # For older/simple flows where we only store the raw answer text
    selected_answer: Optional[str] = None
    is_correct: bool
    # Optional timing information for future policy use
    time_taken_seconds: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AssessmentSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    topic: str
    total_questions: int = 5
    current_difficulty: float = 0.5
    responses: List[StudentResponse] = []
    question_history: List[Question] = []  # Store generated questions for validation
    is_completed: bool = False
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    final_score: Optional[float] = None

    # Fields expected by assessment_routes.py
    mastery_state: Optional[MasteryState] = None
    current_question: Optional[Question] = None
    seen_question_ids: List[str] = []
    # history is implicitly responses, but routes use 'history' expecting list of dicts.
    # We will update routes to use 'responses' list of objects.


class QuestionRequest(BaseModel):
    topic: str
    difficulty: float


class StartAssessmentRequest(BaseModel):
    student_id: str
    topic: str
    num_questions: int = 5


class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    selected_option_id: str
    time_taken: Optional[float] = None


class AssessmentResult(BaseModel):
    session_id: str
    total_questions: int
    correct_answers: int
    final_ability_estimate: float
    message: str


class AssessmentReport(BaseModel):
    """Richer report for a completed assessment session.

    This is built from the scalar-difficulty engine and summarizes overall performance.
    """

    session_id: str
    total_questions: int
    correct_answers: int
    accuracy: float
    final_ability_estimate: float
    level: str
    summary: str
