from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


def generate_id() -> str:
    return str(uuid4())


class LearningEventType(str, Enum):
    LESSON_COMPLETED = "lesson_completed"
    ACTIVITY_LOGGED = "activity_logged"
    QUIZ_RESULT = "quiz_result"
    ASSESSMENT_ANSWER = "assessment_answer"
    ASSESSMENT_COMPLETED = "assessment_completed"
    ASSIGNMENT_SUBMITTED = "assignment_submitted"
    ASSIGNMENT_GRADED = "assignment_graded"
    TUTOR_INTERACTION = "tutor_interaction"
    NOTE_ADDED = "note_added"
    PROFILE_UPDATED = "profile_updated"


class InterventionPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class InterventionStatus(str, Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ConceptMastery(BaseModel):
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    attempts: int = 0
    successes: int = 0
    last_assessed_at: Optional[datetime] = None
    last_source: Optional[str] = None


class LearnerPreferences(BaseModel):
    preferred_modalities: List[str] = Field(default_factory=list)
    preferred_difficulty: Optional[str] = None
    preferred_session_minutes: Optional[int] = None
    study_goals: List[str] = Field(default_factory=list)
    accessibility_needs: List[str] = Field(default_factory=list)


class EngagementSummary(BaseModel):
    total_minutes: float = 0.0
    total_lessons_completed: int = 0
    total_quiz_attempts: int = 0
    total_assessments_completed: int = 0
    total_assignment_submissions: int = 0
    total_tutor_interactions: int = 0
    current_streak: int = 0
    last_activity_at: Optional[datetime] = None


class PerformanceSummary(BaseModel):
    recent_average_score: float = 0.0
    assignment_average: float = 0.0
    assessment_average: float = 0.0
    quiz_average: float = 0.0
    low_score_count: int = 0
    high_score_count: int = 0


class RiskSummary(BaseModel):
    risk_level: str = "low"
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    reasons: List[str] = Field(default_factory=list)
    last_evaluated_at: Optional[datetime] = None


class LearnerProfileRecord(BaseModel):
    user_id: str
    role: str = "student"
    grade_level: Optional[str] = None
    goals: List[str] = Field(default_factory=list)
    preferences: LearnerPreferences = Field(default_factory=LearnerPreferences)
    mastery_state: Dict[str, ConceptMastery] = Field(default_factory=dict)
    weak_topics: List[str] = Field(default_factory=list)
    behavior_signals: Dict[str, Any] = Field(default_factory=dict)
    engagement_summary: EngagementSummary = Field(default_factory=EngagementSummary)
    performance_summary: PerformanceSummary = Field(default_factory=PerformanceSummary)
    risk_summary: RiskSummary = Field(default_factory=RiskSummary)
    tutor_summary: Dict[str, Any] = Field(default_factory=dict)
    assignment_summary: Dict[str, Any] = Field(default_factory=dict)
    assessment_summary: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class LearningEventRecord(BaseModel):
    id: str = Field(default_factory=generate_id)
    user_id: str
    event_type: LearningEventType
    source: str = "system"
    course_id: Optional[str] = None
    topic_id: Optional[str] = None
    session_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InterventionRecommendation(BaseModel):
    id: str = Field(default_factory=generate_id)
    user_id: str
    course_id: Optional[str] = None
    topic_id: Optional[str] = None
    priority: InterventionPriority = InterventionPriority.MEDIUM
    status: InterventionStatus = InterventionStatus.OPEN
    recommended_action: str
    reason: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    evidence: Dict[str, Any] = Field(default_factory=dict)
    created_by: str = "system"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RubricCriterion(BaseModel):
    id: str = Field(default_factory=generate_id)
    title: str
    description: Optional[str] = None
    max_points: float = Field(default=0.0, ge=0.0)
    weight: float = Field(default=1.0, ge=0.0)
    mastery_targets: List[str] = Field(default_factory=list)
    indicators: List[str] = Field(default_factory=list)


class RubricDefinition(BaseModel):
    assignment_id: str
    title: str
    criteria: List[RubricCriterion] = Field(default_factory=list)
    version: int = 1
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RubricScore(BaseModel):
    criterion_id: str
    score: float = Field(default=0.0, ge=0.0)
    feedback: Optional[str] = None
    evidence: List[str] = Field(default_factory=list)


class SubmissionScorecard(BaseModel):
    submission_id: str
    overall_score: float = Field(default=0.0, ge=0.0)
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    review_required: bool = False
    rubric_scores: List[RubricScore] = Field(default_factory=list)
    rationale: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
