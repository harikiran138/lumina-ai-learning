from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum

from app.personalization.schemas import (
    LearnerProfileRecord,
    LearningEventType,
    KPISnapshot,
    ExplanationPlan,
)
from app.personalization.explanation_planner import ExplanationPlanner

class ActivityType(str, Enum):
    EXPLANATION = "explanation"
    ASSESSMENT = "assessment"
    REMEDIATION = "remediation"
    CHALLENGE = "challenge"
    SOCRATIC_REFLECTION = "socratic_reflection"
    INTERVENTION = "intervention"

class AdaptiveDecision:
    def __init__(self, activity_type: ActivityType, topic_id: str, difficulty: float, explanation_plan: Optional[ExplanationPlan] = None, reason: str = "", metadata: Dict[str, Any] = None):
        self.activity_type = activity_type
        self.topic_id = topic_id
        self.difficulty = difficulty
        self.explanation_plan = explanation_plan
        self.reason = reason
        self.metadata = metadata or {}

    def to_dict(self):
        return {
            "activity_type": self.activity_type.value,
            "topic_id": self.topic_id,
            "difficulty": self.difficulty,
            "explanation_plan": self.explanation_plan.model_dump() if self.explanation_plan else None,
            "reason": self.reason,
            "metadata": self.metadata
        }

class AdaptiveEngine:
    """
    The 'Intelligence Controller' that decides the next pedagogical move.
    Implements the core decision logic of the closed-loop adaptive system.
    """

    @classmethod
    def decide_next_step(
        cls, 
        profile: LearnerProfileRecord, 
        current_topic_id: Optional[str] = None
    ) -> AdaptiveDecision:
        """
        Input: Learner Profile (Intelligence Core)
        Output: Next Action (Controller)
        """
        kpi = profile.kpi_snapshot
        mastery_map = profile.mastery_state
        
        # 1. Identify Target Topic
        target_topic = current_topic_id or cls._select_target_topic(profile)
        
        # 2. Logic: Decide Activity Type based on KPIs
        decision_type = cls._determine_activity_type(kpi)
        
        # 3. Logic: Determine Difficulty (0.0 - 1.0)
        # Difficulty = f(Mastery, Readiness, Lag)
        topic_mastery = mastery_map[target_topic].score if target_topic in mastery_map else 0.5
        difficulty = cls._calculate_difficulty(topic_mastery, kpi.readiness, kpi.lag_zone_score)
        
        # 4. Logic: Generate Pedagogical Plan
        plan = None
        if decision_type in [ActivityType.EXPLANATION, ActivityType.REMEDIATION, ActivityType.SOCRATIC_REFLECTION]:
            plan = ExplanationPlanner.generate_plan(profile, objective=decision_type.value)
            
        return AdaptiveDecision(
            activity_type=decision_type,
            topic_id=target_topic,
            difficulty=difficulty,
            explanation_plan=plan,
            reason=cls._generate_reason(decision_type, kpi),
            metadata={
                "kpi_context": {
                    "learning_score": kpi.learning_score,
                    "lag_zone": kpi.lag_zone_score,
                    "growth_velocity": kpi.growth_velocity
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    @staticmethod
    def _select_target_topic(profile: LearnerProfileRecord) -> str:
        # Prioritize weak topics if they exist
        if profile.weak_topics:
            return profile.weak_topics[0]
            
        # Otherwise, find lowest mastery concept
        if not profile.mastery_state:
            return "general"
            
        sorted_mastery = sorted(profile.mastery_state.items(), key=lambda x: x[1].score)
        return sorted_mastery[0][0]

    @staticmethod
    def _determine_activity_type(kpi: KPISnapshot) -> ActivityType:
        """
        Policy Logic (Intelligence Controller):
        - High Lag (>0.6) -> Remediation
        - Falling Authenticity -> Intervention
        - Low Readiness (<0.4) -> Explanation
        - Plateauing Growth + High Mastery -> Challenge
        - Extreme Persistence Lag -> Socratic Reflection
        - Balanced -> Assessment
        """
        if kpi.lag_zone_score > 0.7:
            return ActivityType.REMEDIATION
            
        if kpi.authenticity_score < 0.4:
            return ActivityType.INTERVENTION
            
        if kpi.readiness < 0.3:
            return ActivityType.EXPLANATION
            
        if kpi.growth_velocity < 0.2 and kpi.learning_score > 0.7:
            return ActivityType.CHALLENGE
            
        if kpi.lag_zone_score > 0.4 and kpi.persistence < 0.5:
            return ActivityType.SOCRATIC_REFLECTION
            
        return ActivityType.ASSESSMENT

    @staticmethod
    def _calculate_difficulty(mastery: float, readiness: float, lag: float) -> float:
        # Zone of Proximal Development (ZPD) heuristic
        # Target Difficulty should be slightly higher than current mastery but tempered by lag.
        base = mastery + 0.1
        penalty = lag * 0.2
        bonus = readiness * 0.1
        return max(0.1, min(1.0, base - penalty + bonus))

    @staticmethod
    def _generate_reason(activity: ActivityType, kpi: KPISnapshot) -> str:
        if activity == ActivityType.REMEDIATION:
            return "Lag zone detected. Providing simplified remediation to unlock progress."
        if activity == ActivityType.CHALLENGE:
            return "High readiness and plateauing growth. Pushing boundaries with a challenge."
        if activity == ActivityType.EXPLANATION:
            return "Readiness score is low. Establishing foundational concepts."
        if activity == ActivityType.INTERVENTION:
            return "Authenticity alarm. Requiring higher-fidelity verification."
        return "Standard adaptive assessment loop."
