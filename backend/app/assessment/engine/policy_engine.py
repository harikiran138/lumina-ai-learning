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

class PolicyEngine:
    """
    Decides the next best action based on student mastery and history.
    """
    
    def __init__(self, mastery_threshold=0.8, remediation_threshold=0.4):
        self.mastery_threshold = mastery_threshold
        self.remediation_threshold = remediation_threshold

    def decide_next_action(self, 
                           student_state: MasteryState, 
                           recent_history: List[StudentResponse],
                           active_concept: str) -> PolicyDecision:
        
        current_mastery = student_state.concept_mastery.get(active_concept, 0.5)
        
        # 1. Check for Stop / Mastery Condition
        if current_mastery >= self.mastery_threshold:
            return PolicyDecision(
                action=AssessmentAction.STOP,
                target_difficulty=0.0,
                target_concepts=[],
                reason=f"Mastery achieved in {active_concept} ({current_mastery:.2f})"
            )
            
        # 2. Analyze recent performance
        if not recent_history:
            # Start with moderate difficulty
            return PolicyDecision(
                action=AssessmentAction.NEXT_QUESTION,
                target_difficulty=0.5,
                target_concepts=[active_concept],
                reason="Initial question"
            )

        last_response = recent_history[-1]
        
        # 3. Dynamic Adjustment Logic
        if current_mastery < self.remediation_threshold:
             # Struggling -> Remedial / Easier
             return PolicyDecision(
                action=AssessmentAction.REMEDIAL,
                target_difficulty=max(0.2, current_mastery - 0.1), # Lower difficulty
                target_concepts=[active_concept],
                reason="Mastery low, providing remedial content"
            )
        
        elif current_mastery < 0.7:
            # Practice Zone -> Match difficulty to mastery (approx Vygotsky's ZPD)
            # If they got the last one wrong, easy up slightly. If right, push slightly.
            if last_response.is_correct:
                target_diff = min(0.8, current_mastery + 0.1)
                reason = "Correct response, increasing difficulty"
            else:
                target_diff = max(0.3, current_mastery)
                reason = "Incorrect response, maintaining/lowering difficulty"
                
            return PolicyDecision(
                action=AssessmentAction.NEXT_QUESTION,
                target_difficulty=target_diff,
                target_concepts=[active_concept],
                reason=reason
            )
            
        else:
            # High mastery but not finished -> Challenge
            return PolicyDecision(
                action=AssessmentAction.CHALLENGE,
                target_difficulty=min(0.95, current_mastery + 0.1),
                target_concepts=[active_concept],
                reason="High performance, challenging learner"
            )
