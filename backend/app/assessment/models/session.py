from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.assessment.models.schemas import MasteryState, Question

class AssessmentSession(BaseModel):
    session_id: str
    student_id: str
    start_time: datetime = Field(default_factory=datetime.now)
    mastery_state: MasteryState
    history: List[dict] = [] # List of previous responses
    seen_question_ids: List[str] = []
    is_completed: bool = False
    completion_reason: Optional[str] = None
    
    # We might keep the current question here to validate submission
    current_question: Optional[Question] = None 
