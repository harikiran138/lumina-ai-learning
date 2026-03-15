from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4
from pydantic import BaseModel, Field


def generate_id() -> str:
    return str(uuid4())


class AutomationJobType(str, Enum):
    WEEKLY_DIGEST = "weekly_digest"
    POST_ASSESSMENT_REMEDIATION = "post_assessment_remediation"
    INACTIVITY_ALERT = "inactivity_alert"
    PROGRESS_DIGEST = "progress_digest"
    PROFILE_REFRESH = "profile_refresh"


class AutomationJobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class AutomationJob(BaseModel):
    job_id: str = Field(default_factory=generate_id)
    job_type: AutomationJobType
    status: AutomationJobStatus = AutomationJobStatus.PENDING
    scheduled_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    result_summary: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class RemediationPlan(BaseModel):
    user_id: str
    triggered_by_score: float
    weak_concepts: List[str]
    recommended_concepts: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ClassDigest(BaseModel):
    course_id: str
    week_start: datetime
    at_risk_count: int
    avg_kpi_score: float
    avg_engagement_minutes: float
    top_weak_concepts: List[str]
    most_improved_user_id: Optional[str] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class InactivityAlert(BaseModel):
    user_id: str
    last_activity_at: Optional[datetime]
    hours_inactive: float
    risk_level: str
    nudge_message: str


class StudentProgressDigest(BaseModel):
    user_id: str
    current_streak: int
    mastered_this_week: List[str]
    next_recommended_concept: Optional[str]
    motivation_message: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
