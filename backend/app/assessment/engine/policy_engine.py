from enum import Enum
from typing import List, Optional
from pydantic import BaseModel
from app.assessment.models.schemas import MasteryState, StudentResponse


class AssessmentAction(Enum):
    NEXT_QUESTION = "next_question"
    REMEDIAL = "remedial"
    CHALLENGE = "challenge"
    STOP = "stop"


class PolicyDecision(BaseModel):
    action: AssessmentAction
    target_difficulty: float
    target_concepts: List[str]
    reason: str
    is_final: bool = False
    confidence_score: float = 1.0  # The policy's confidence in this decision


class PolicyEngine:
    """
    Decides the next best action based on student mastery and history.
    """

    def __init__(self, mastery_threshold=0.8, remediation_threshold=0.4):
        self.mastery_threshold = mastery_threshold
        self.remediation_threshold = remediation_threshold

    def decide_next_action(
        self,
        student_state: MasteryState,
        recent_history: List[StudentResponse],
        active_concept: str,
    ) -> PolicyDecision:
        current_mastery = student_state.concept_mastery.get(active_concept, 0.5)

        # 1. Early Stop: Stability Detection
        # If mastery hasn't changed significantly over last 3 questions, stop.
        if len(recent_history) >= 3:
            recent_scores = [r.score for r in recent_history[-3:]]
            if all(s == recent_scores[0] for s in recent_scores):
                 return PolicyDecision(
                    action=AssessmentAction.STOP,
                    target_difficulty=0.0,
                    target_concepts=[],
                    reason="Performance stabilized; assessment concluded.",
                    is_final=True
                )

        # 2. Early Stop: Fatigue / Latency Detection
        # If the student is taking much longer than expected on easy questions.
        if recent_history:
            last = recent_history[-1]
            if last.time_taken_seconds and last.time_taken_seconds > 120 and last.is_correct:
                # Correct but very slow suggests fatigue or over-thinking
                 return PolicyDecision(
                    action=AssessmentAction.STOP,
                    target_difficulty=0.0,
                    target_concepts=[],
                    reason="High response latency detected; stopping for learner comfort.",
                    is_final=True
                )

        # 3. Stop: Mastery Achieved (Goal)
        if current_mastery >= self.mastery_threshold:
             # Check if there are other concepts in the session that need focus
             other_concepts = [c for c, m in student_state.concept_mastery.items() if m < self.mastery_threshold]
             if other_concepts:
                 return PolicyDecision(
                    action=AssessmentAction.NEXT_QUESTION,
                    target_difficulty=0.5,
                    target_concepts=[other_concepts[0]],
                    reason=f"Switching to next concept: {other_concepts[0]}",
                )
             
             return PolicyDecision(
                action=AssessmentAction.STOP,
                target_difficulty=0.0,
                target_concepts=[],
                reason=f"Mastery achieved in all targeted concepts.",
                is_final=True
            )

        # 4. Analyze Performance for Scaling
        if not recent_history:
            return PolicyDecision(
                action=AssessmentAction.NEXT_QUESTION,
                target_difficulty=0.5,
                target_concepts=[active_concept],
                reason="Initial question",
            )

        last_response = recent_history[-1]
        
        # Factor in AI analysis confidence if available
        confidence = last_response.analysis.confidence_estimate if last_response.analysis else 0.5
        
        # 5. Dynamic Adjustment Logic
        if current_mastery < self.remediation_threshold:
            return PolicyDecision(
                action=AssessmentAction.REMEDIAL,
                target_difficulty=max(0.1, current_mastery - 0.1),
                target_concepts=[active_concept],
                reason="Performance consistently low; triggering remedial material.",
                confidence_score=0.9
            )

        # Zone of Proximal Development (ZPD) Adjustment
        # Logic: If correct and confident -> Jump; If correct but low confidence -> Small Step
        if last_response.is_correct:
            step = 0.15 if confidence > 0.7 else 0.05
            target_diff = min(0.95, current_mastery + step)
            reason = "Success detected; increasing difficulty limit."
        else:
            step = 0.1 if confidence > 0.5 else 0.05
            target_diff = max(0.1, current_mastery - step)
            reason = "Response incorrect; adjusting difficulty floor."

        return PolicyDecision(
            action=AssessmentAction.NEXT_QUESTION,
            target_difficulty=target_diff,
            target_concepts=[active_concept],
            reason=reason,
            confidence_score=confidence
        )


policy_engine = PolicyEngine()
