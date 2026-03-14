from typing import Dict, Any, Tuple
import random
from app.pathway.schemas import PathwayAction, ActionPriority

class PolicyEngine:
    """
    Bootstraps the RL Policy with a Heuristic Engine.
    Evaluates the normalized state vector to select the next action:
    CONTINUE, REVIEW, ADVANCE, REST.
    """

    @staticmethod
    def evaluate_action(state: Dict[str, Any]) -> Tuple[PathwayAction, str, ActionPriority, str]:
        """
        Takes the S_t state dictionary and outputs the chosen action.
        Returns: (Action, TargetConceptId, Priority, Reasoning)
        """
        engagement = state.get("engagement", {})
        concepts = state.get("concepts", [])
        
        # 1. Check REST Condition (Fatigue/Cognitive Load limits)
        fatigue = engagement.get("norm_fatigue", 0.0)
        cog_load = engagement.get("norm_cognitive_load", 0.0)
        
        if fatigue >= 0.8:
            return (
                PathwayAction.REST, 
                None, 
                ActionPriority.HIGH, 
                f"Learner fatigue is high ({fatigue:.2f}). Approaching exhaustion."
            )
            
        if cog_load >= 0.9:
            return (
                PathwayAction.REST, 
                None, 
                ActionPriority.MEDIUM, 
                f"Cognitive load is extremely high ({cog_load:.2f}). Recommend a short break."
            )

        # 2. Check REVIEW Condition (Forgetting curve / Low confidence)
        # Find concepts that have low stability or confidence
        review_candidates = []
        for c in concepts:
            if c["norm_stability"] < 0.3 or c["norm_confidence"] < 0.4:
                review_candidates.append(c)
                
        if review_candidates:
            # Pick the one with lowest confidence to review
            target = min(review_candidates, key=lambda x: x["norm_confidence"])
            return (
                PathwayAction.REVIEW,
                target["concept_id"],
                ActionPriority.HIGH,
                f"Concept {target['concept_id']} has low confidence ({target['norm_confidence']:.2f}) or stability."
            )

        # 3. Check ADVANCE Condition (High Mastery, Ready for next steps)
        # If the user is doing very well on all current tracked concepts
        readiness = state.get("context", {}).get("readiness_score", 0.5)
        risk = state.get("context", {}).get("risk_level", 0.0)
        
        if all(c["norm_confidence"] > 0.85 for c in concepts) and concepts:
            # Prefer the most recent concept or current focus as target if blocked
            target_id = concepts[0]["concept_id"]
            
            if readiness < 0.7:
                return (
                    PathwayAction.CONTINUE,
                    target_id,
                    ActionPriority.MEDIUM,
                    f"Mastery is high, but readiness score ({readiness:.2f}) is below threshold (0.70). Continuing practice."
                )
            
            if risk > 0.6:
                return (
                    PathwayAction.REVIEW,
                    target_id,
                    ActionPriority.HIGH,
                    f"Mastery is high, but risk level ({risk:.2f}) is elevated. Recommending review before advancing."
                )

            # We assume the curriculum optimizer will provide the next node for 'ADVANCE', 
            # so target_concept can be inferred downstream or returned as 'NEXT' signal.
            return (
                PathwayAction.ADVANCE,
                "NEXT_OPTIMAL_NODE", # Placeholder for optimizer
                ActionPriority.MEDIUM,
                f"Mastery is high and readiness ({readiness:.2f}) is sufficient. Ready to advance."
            )

        # 4. Default to CONTINUE (Incremental mastery)
        # Find the concept currently being worked on (most recent) or just the one with middle confidence
        if concepts:
            target = min(concepts, key=lambda x: abs(x["norm_confidence"] - 0.6))
            target_id = target["concept_id"]
        else:
            target_id = "GENERAL_TOPIC"

        return (
            PathwayAction.CONTINUE,
            target_id,
            ActionPriority.LOW,
            "Mastery is growing steadily. Continuing practice on current focus."
        )

    @staticmethod
    def get_action_mask(state: Dict[str, Any]) -> Dict[PathwayAction, bool]:
        """
        Determines which actions are legal in the current state (Safety Constraints).
        """
        mask = {
            PathwayAction.CONTINUE: True,
            PathwayAction.REVIEW: True,
            PathwayAction.ADVANCE: True,
            PathwayAction.REST: True
        }
        
        # Prevent advance if fatigue is too high
        if state.get("engagement", {}).get("norm_fatigue", 0.0) > 0.9:
            mask[PathwayAction.ADVANCE] = False
            
        return mask
