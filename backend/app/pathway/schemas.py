from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
import uuid

# --- Input Schemas ---

class MasteryDetail(BaseModel):
    conceptId: str
    probabilityCorrect: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    stability: Optional[float] = Field(None, description="Estimated days until forgetting.")
    lastInteraction: Optional[datetime] = None

class EngagementState(BaseModel):
    currentSessionDurationMinutes: Optional[int] = None
    cognitiveLoadIndex: float = Field(..., ge=0.0, le=10.0)
    fatigueLevel: float = Field(..., ge=0.0, le=1.0)
    isDistracted: Optional[bool] = None

class ActionOutcome(str, Enum):
    CORRECT = "correct"
    INCORRECT = "incorrect"
    PARTIAL = "partial"

class PerformanceRecord(BaseModel):
    actionId: Optional[str] = None
    outcome: Optional[ActionOutcome] = None
    timestamp: Optional[datetime] = None

class Constraints(BaseModel):
    maxSessionTimeMinutes: Optional[int] = None
    availableEnergy: Optional[float] = Field(None, ge=0.0, le=100.0)

class DetectedPattern(BaseModel):
    patternId: str = Field(..., description="ID of the pattern (e.g., 'BP01').")
    patternName: Optional[str] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    lastDetected: Optional[datetime] = None

class PathwayInput(BaseModel):
    """
    Contextual data required by the Pathway Agent to decide the next best action.
    """
    learnerId: str
    currentTimestamp: datetime
    masteryState: Dict[str, MasteryDetail]
    engagementState: EngagementState
    recentPerformance: Optional[List[PerformanceRecord]] = []
    constraints: Optional[Constraints] = None
    detectedPatterns: Optional[List[DetectedPattern]] = []

# --- Output Schemas ---

class PathwayAction(str, Enum):
    CONTINUE = "continue"
    REVIEW = "review"
    ADVANCE = "advance"
    REST = "rest"

class ActionPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class DecisionMeta(BaseModel):
    predictedReward: Optional[float] = None
    explorationFactor: Optional[float] = None

class PathwayOutput(BaseModel):
    """
    The decision made by the Pathway Agent regarding the learner's next action.
    """
    decisionId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: PathwayAction
    targetConcept: Optional[str] = Field(
        None, description="The specific concept ID or topic to focus on next. Null if action is 'rest'."
    )
    priority: ActionPriority
    reasoning: str = Field(..., description="Human-readable explanation of why this action was chosen.")
    meta: Optional[DecisionMeta] = None
