from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
import uuid

class Option(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    options: List[Option]
    correct_option_id: str
    difficulty: float = 0.5  # 0.0 to 1.0
    topic: str
    
class StudentResponse(BaseModel):
    question_id: str
    selected_option_id: str
    is_correct: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AssessmentSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    topic: str
    current_difficulty: float = 0.5
    responses: List[StudentResponse] = []
    is_completed: bool = False
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    final_score: Optional[float] = None

class QuestionRequest(BaseModel):
    topic: str
    difficulty: float

class StartAssessmentRequest(BaseModel):
    student_id: str
    topic: str


class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    selected_option_id: str

class AssessmentResult(BaseModel):
    session_id: str
    total_questions: int
    correct_answers: int
    final_ability_estimate: float
    message: str
