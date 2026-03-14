from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import uuid


class QuestionFormat(str, Enum):
    MCQ = "mcq"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"
    LONG_EXPLANATION = "long_explanation"
    TEACH_BACK = "teach_back"
    TRY_ANSWER = "try_answer"


class Option(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str


class QuestionMetadata(BaseModel):
    """Metadata used for adaptive selection and mastery tracking."""

    question_id: str
    concepts: List[str] = Field(default_factory=list)
    difficulty: float = 0.5
    blooms_level: Optional[str] = None
    evidence_goal: Optional[str] = None  # e.g., "recognition", "recall", "transfer"
    expected_time_seconds: Optional[int] = None


class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    format: QuestionFormat = QuestionFormat.MCQ
    text: str
    prompt: Optional[str] = None  # Context-specific prompt (e.g., "You said X, why Y?")
    options: List[Option] = []  # Empty for open-ended formats
    correct_option_id: Optional[str] = None
    correct_answer: Optional[str] = None  # For non-MCQ formats
    explanation: Optional[str] = None
    difficulty: float = 0.5  # 0.0 to 1.0
    topic: str
    metadata: Optional[QuestionMetadata] = None
    rubric: Dict[str, Any] = Field(default_factory=dict)  # Scoring keys for open-ended


class MasteryState(BaseModel):
    """Tracks concept-level mastery for a student.

    Values are probabilities in [0, 1].
    """

    student_id: str
    concept_mastery: Dict[str, float] = Field(default_factory=dict)


class ResponseTelemetry(BaseModel):
    paste_detected: bool = False
    typing_variance: float = 0.0
    backspace_count: int = 0
    think_time_seconds: float = 0.0
    char_count: int = 0


class AnswerAnalysis(BaseModel):
    correctness: float = 0.0  # 0 to 1.0
    concepts_demonstrated: List[str] = Field(default_factory=list)
    concepts_missing: List[str] = Field(default_factory=list)
    misconceptions: List[str] = Field(default_factory=list)
    confidence_estimate: float = 0.5
    feedback: str = ""


class StudentResponse(BaseModel):
    question_id: str
    # For ID-based MCQs
    selected_option_id: Optional[str] = None
    # For open-ended or simple flows
    selected_answer: Optional[str] = None
    is_correct: bool = False  # Legacy for MCQ, multi-score uses analysis
    score: float = 0.0 # 0 to 1.0
    
    # New enrichment fields
    telemetry: Optional[ResponseTelemetry] = None
    analysis: Optional[AnswerAnalysis] = None
    
    time_taken_seconds: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AssessmentSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    topic: str
    total_questions: int = 5
    current_difficulty: float = 0.5
    responses: List[StudentResponse] = []
    question_history: List[Question] = []
    is_completed: bool = False
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    final_score: Optional[float] = None
    
    current_question: Optional[Question] = None
    seen_question_ids: List[str] = []
    mastery_state: Optional[MasteryState] = None


class QuestionRequest(BaseModel):
    topic: str
    difficulty: float
    format: Optional[QuestionFormat] = None
    previous_analysis: Optional[AnswerAnalysis] = None


class StartAssessmentRequest(BaseModel):
    student_id: str
    topic: str
    num_questions: int = 5


class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    selected_option_id: Optional[str] = None
    selected_answer: Optional[str] = None
    telemetry: Optional[ResponseTelemetry] = None
    time_taken: Optional[float] = None


class AssessmentResult(BaseModel):
    session_id: str
    total_questions: int
    correct_answers: int
    final_ability_estimate: float
    message: str


class AssessmentReport(BaseModel):
    """Richer report for a completed assessment session."""

    session_id: str
    total_questions: int
    correct_answers: int
    accuracy: float
    final_ability_estimate: float
    level: str
    summary: str
    analysis_history: List[AnswerAnalysis] = []
