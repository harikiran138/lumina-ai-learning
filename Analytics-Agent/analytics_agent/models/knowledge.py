from typing import Dict, Any
import logging
from .base_model import AnalyticsModel

logger = logging.getLogger(__name__)

class KnowledgeTracer(AnalyticsModel):
    """
    Bayesian Knowledge Tracing (BKT) implementation.
    """
    
    def __init__(self):
        # Default BKT parameters
        self.p_init = 0.1  # P(L0)
        self.p_transit = 0.1 # P(T)
        self.p_slip = 0.1    # P(S)
        self.p_guess = 0.2   # P(G)

    def predict(self, features: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Updates mastery probability given an observation (correct/incorrect).
        Expected context: {"concept_id": str, "is_correct": bool, "current_p_mastery": float}
        """
        if not context or "is_correct" not in context:
            # If no direct assessment event, return previous state or default
            return {"probability": context.get("current_p_mastery", self.p_init), "change": 0.0}
            
        p_known = context.get("current_p_mastery", self.p_init)
        correct = context["is_correct"]
        
        # 1. Update based on evidence
        if correct:
            # P(L|Obs=Correct)
            num = p_known * (1 - self.p_slip)
            denom = num + (1 - p_known) * self.p_guess
        else:
            # P(L|Obs=Incorrect)
            num = p_known * self.p_slip
            denom = num + (1 - p_known) * (1 - self.p_guess)
            
        p_posterior = num / (denom + 1e-9)
        
        # 2. Update based on learning (transition)
        p_next = p_posterior + (1 - p_posterior) * self.p_transit
        
        return {
            "concept": context.get("concept_id", "unknown"),
            "probability": round(p_next, 4),
            "delta": round(p_next - p_known, 4)
        }
