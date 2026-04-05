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
    integrity_score: float = Field(default=1.0, ge=0.0, le=1.0) # Confident in originality
    attempts: int = 0
    successes: int = 0
    last_assessed_at: Optional[datetime] = None
    last_source: Optional[str] = None


class LanguagePreferences(BaseModel):
    locale: Optional[str] = None
    primary_language: Optional[str] = None
    secondary_languages: List[str] = Field(default_factory=list)
    translation_enabled: bool = True


class LearnerPreferences(BaseModel):
    preferred_modalities: List[str] = Field(default_factory=list)
    preferred_difficulty: Optional[str] = None
    preferred_session_minutes: Optional[int] = None
    study_goals: List[str] = Field(default_factory=list)
    accessibility_needs: List[str] = Field(default_factory=list)
    language: LanguagePreferences = Field(default_factory=LanguagePreferences)
    parent_link_code: Optional[str] = None


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
    category_breakdown: Dict[str, float] = Field(default_factory=dict) # e.g. {"performance": 0.3, "engagement": 0.1}
    last_evaluated_at: Optional[datetime] = None


class ExplanationStrategyState(BaseModel):
    mode_name: str
    effectiveness_score: float = Field(default=0.5, ge=0.0, le=1.0)
    total_uses: int = 0
    success_count: int = 0
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ExplanationPlan(BaseModel):
    plan_id: str = Field(default_factory=generate_id)
    objective: str # explain, simplify, hint, summarize, quiz, challenge
    strategy: str # worked_example_first, socratic_prompting, etc.
    mode: str # Story, Joke, Analogy, etc.
    vocabulary_band: str # simple, grade-level, advanced
    depth: str # concise, standard, deep
    pace: str # compressed, normal, slow
    chunk_size: int = 1
    socratic_ratio: float = 0.0
    modalities: List[str] = Field(default_factory=list)
    confidence: float = 1.0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExplanationProfile(BaseModel):
    strategies: Dict[str, ExplanationStrategyState] = Field(default_factory=dict)
    primary_mode: Optional[str] = None
    last_plan: Optional[ExplanationPlan] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class KPISnapshot(BaseModel):
    growth_velocity: float = 0.0
    lag_zone_score: float = 0.0
    authenticity_score: float = 1.0
    explanation_effectiveness: float = 0.0
    engagement_score: float = 0.0
    persistence: float = 0.0
    readiness: float = 0.0
    learning_score: float = 0.5            # Multidimensional 40/30/20/10 score
    # Extended by student_analytics service
    growth_trend: str = "plateauing"        # improving | plateauing | declining
    tier: str = "developing"               # struggling | developing | proficient | advanced
    study_pattern: str = "inactive"        # consistent | cramming | bursty | declining | inactive
    recommended_section: str = "C"         # A | B | C | D
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


class KnowledgeGraphState(BaseModel):
    graph_id: Optional[str] = None
    graph_version: Optional[str] = None
    concept_ids: List[str] = Field(default_factory=list)
    last_synced_at: Optional[datetime] = None


class SpacedRepetitionItem(BaseModel):
    concept_id: str
    stability: float = 0.0
    difficulty: float = 0.0
    repetitions: int = 0
    last_reviewed_at: Optional[datetime] = None
    next_review_at: Optional[datetime] = None


class SpacedRepetitionState(BaseModel):
    algorithm: str = "fsrs"
    items: Dict[str, SpacedRepetitionItem] = Field(default_factory=dict)
    pending_review_count: int = 0
    last_updated_at: datetime = Field(default_factory=datetime.utcnow)


class OfflineSyncState(BaseModel):
    enabled: bool = False
    last_synced_at: Optional[datetime] = None
    pending_event_count: int = 0
    device_ids: List[str] = Field(default_factory=list)
    sync_version: int = 1




class InterventionHistory(BaseModel):
    total_interventions: int = 0
    resolved_count: int = 0
    dismissed_count: int = 0
    successful_outcomes: int = 0
    failed_outcomes: int = 0


class LearnerProfileRecord(BaseModel):
    id: Optional[str] = None
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
    explanation_profile: ExplanationProfile = Field(default_factory=ExplanationProfile)
    kpi_snapshot: KPISnapshot = Field(default_factory=KPISnapshot)
    kpi_history: List[KPISnapshot] = Field(default_factory=list)
    intervention_history: InterventionHistory = Field(default_factory=InterventionHistory)
    misconception_summary: Dict[str, Any] = Field(default_factory=dict)
    knowledge_graph_state: KnowledgeGraphState = Field(default_factory=KnowledgeGraphState)
    spaced_repetition_state: SpacedRepetitionState = Field(default_factory=SpacedRepetitionState)
    offline_sync_state: OfflineSyncState = Field(default_factory=OfflineSyncState)
    tutor_summary: Dict[str, Any] = Field(default_factory=dict)
    assignment_summary: Dict[str, Any] = Field(default_factory=dict)
    assessment_summary: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class QuizResultPayload(BaseModel):
    score: float
    total_questions: Optional[int] = None
    correct_count: Optional[int] = None
    difficulty: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class LessonCompletedPayload(BaseModel):
    lesson_id: str
    course_id: str
    progress: float


class ActivityLoggedPayload(BaseModel):
    course_id: str
    duration_minutes: float
    streak: Optional[int] = None


class TutorInteractionPayload(BaseModel):
    message: Optional[str] = None
    response: Optional[str] = None
    session_id: Optional[str] = None
    topic: Optional[str] = None
    recommendation: Optional[str] = None
    behavior: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    explanation_plan: Optional[Dict[str, Any]] = None
    strategy_used: Optional[str] = None


class AssessmentAnswerPayload(BaseModel):
    is_correct: bool
    question_id: Optional[str] = None
    time_taken: Optional[float] = None
    response_time: Optional[float] = None
    attempt_number: Optional[int] = None
    answer_text: Optional[str] = None
    session_id: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[float] = None
    analysis: Optional[Dict[str, Any]] = None
    telemetry: Optional[Dict[str, Any]] = None


class AssessmentCompletedPayload(BaseModel):
    accuracy: float
    session_id: Optional[str] = None
    topic: Optional[str] = None
    total_questions: Optional[int] = None
    duration: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    confidence_avg: Optional[float] = None
    misconceptions: Optional[List[str]] = None
    remediation_plan: Optional[Dict[str, Any]] = None


class AssignmentSubmittedPayload(BaseModel):
    assignment_id: str
    file_path: Optional[str] = None
    submission_id: Optional[str] = None
    content: Optional[str] = None


class AssignmentGradedPayload(BaseModel):
    assignment_id: str
    score: float
    feedback: Optional[str] = None


class NoteAddedPayload(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    content: str


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
    teacher_notes: Optional[str] = None
    action_taken: Optional[str] = None
    resolved_at: Optional[datetime] = None
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


class InterventionUpdateRequest(BaseModel):
    status: Optional[InterventionStatus] = None
    teacher_notes: Optional[str] = None
    action_taken: Optional[str] = None
