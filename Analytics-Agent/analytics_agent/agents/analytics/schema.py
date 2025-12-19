from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, Field, conlist

# --- State Models ---

class EngagementState(BaseModel):
    """Tracks the learner's engagement level and trends."""
    score: float = Field(..., ge=0.0, le=1.0, description="Current behavioral engagement score (0-1).")
    trend: Literal["increasing", "stable", "declining", "volatile"] = Field(..., description="Direction of engagement change.")
    stability: float = Field(..., ge=0.0, le=1.0, description="Stability of engagement signaling.")
    last_interaction_timestamp: float = Field(..., description="Unix timestamp of last significant interaction.")

class CognitiveState(BaseModel):
    """Estimates the learner's cognitive load and mental state."""
    load_index: float = Field(..., ge=0.0, le=1.0, description="Estimated cognitive load (0=idle, 1=overload).")
    fatigue_index: float = Field(0.0, ge=0.0, le=1.0, description="Cumulative fatigue measure.")
    fatigue_detected: bool = Field(..., description="True if behavioral markers suggest fatigue.")
    flow_state: bool = Field(..., description="True if markers suggest flow/deep focus.")
    time_of_day_modifier: float = Field(1.0, description="Multiplier for cognitive capacity based on circadian rhythm.")

class MasteryState(BaseModel):
    """Tracks concept mastery probabilities."""
    concept_id: str
    probability: float = Field(..., ge=0.0, le=1.0, description="Probability of mastery (BKT/DKT output).")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in the mastery estimate.")
    last_updated: float

class RiskState(BaseModel):
    """Assesses risks of negative outcomes."""
    dropout_probability: float = Field(..., ge=0.0, le=1.0)
    failure_probability: float = Field(..., ge=0.0, le=1.0)
    burnout_risk: float = Field(..., ge=0.0, le=1.0)

# --- Output Models ---

class MasteryUpdate(BaseModel):
    concept: str
    probability: float
    delta: float

class RiskAssessment(BaseModel):
    dropout_risk: float
    failure_risk: float

class AnalyticsOutput(BaseModel):
    """Standardized output format for the Analytics Agent."""
    engagement_score: float
    engagement_trend: Literal["increasing", "stable", "declining", "volatile"]
    cognitive_load: Literal["low", "optimal", "high", "overload"]
    fatigue_detected: bool
    learning_strategy: Optional[str] = None
    mastery_update: Optional[MasteryUpdate] = None
    risk_assessment: Optional[RiskAssessment] = None
    recommended_action: List[str] = Field(default_factory=list)
    mcp_actions: List[Dict[str, Any]] = Field(default_factory=list, description="Structured MCP signals triggered.")
    confidence: float = Field(..., ge=0.0, le=1.0)
