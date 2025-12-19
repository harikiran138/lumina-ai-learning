from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# --- Outgoing MCP Signals ---

class DifficultyChangeRecommendation(BaseModel):
    """Signal sent to Pathway Agent to adjust difficulty."""
    type: Literal["difficulty_adjustment"] = "difficulty_adjustment"
    direction: Literal["increase", "decrease", "maintain"]
    magnitude: float = Field(..., ge=0.0, le=1.0, description="How strong the adjustment should be.")
    reason: str
    confidence: float

class MisconceptionSignal(BaseModel):
    """Signal sent to Tutor Agent about a detected misconception."""
    type: Literal["misconception_detected"] = "misconception_detected"
    concept_id: str
    misconception_type: str
    struggle_duration_seconds: int
    recommended_explanation_depth: Literal["surface", "deep", "analogy", "visual"]
    confidence: float

class InterventionAlert(BaseModel):
    """Signal sent to Intervention Agent for at-risk learners."""
    type: Literal["intervention_required"] = "intervention_required"
    risk_type: Literal["dropout", "failure", "burnout"]
    severity: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
    suggested_action: str
    time_window: str # e.g. "immediate", "next_session", "24h"

# --- Incoming Content Context ---
# (This might be shared state, but defining here for completeness of what the agent expects)

class InteractionEvent(BaseModel):
    """Raw event stream item."""
    learner_id: str
    timestamp: float
    event_type: str # e.g., "scroll", "click", "pause", "answer"
    payload: dict
