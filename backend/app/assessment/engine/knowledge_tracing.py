from typing import Dict, List
from app.assessment.models.schemas import MasteryState, QuestionMetadata

class KnowledgeTracingEngine:
    """
    Implements Bayesian Knowledge Tracing (BKT) to track concept mastery.
    P(L_t) = P(L_{t-1} | Evidence)
    """

    def __init__(self, default_p_init=0.3, p_transit=0.1, p_slip=0.1, p_guess=0.2):
        self.p_init = default_p_init   # Initial probability of knowing the concept
        self.p_transit = p_transit     # Prob of learning the concept after an opportunity
        self.p_slip = p_slip           # Prob of making a mistake even if known
        self.p_guess = p_guess         # Prob of guessing correctly if not known

    def _update_single_concept(self, p_known: float, is_correct: bool) -> float:
        """
        Updates the probability of knowing a concept based on a single response.
        """
        if is_correct:
            # P(L | Correct) = (P(L) * (1 - P(Slip))) / (P(L) * (1 - P(Slip)) + (1 - P(L)) * P(Guess))
            prob_posterior = (p_known * (1 - self.p_slip)) / \
                             (p_known * (1 - self.p_slip) + (1 - p_known) * self.p_guess)
        else:
            # P(L | Incorrect) = (P(L) * P(Slip)) / (P(L) * P(Slip) + (1 - P(L)) * (1 - P(Guess)))
            prob_posterior = (p_known * self.p_slip) / \
                             (p_known * self.p_slip + (1 - p_known) * (1 - self.p_guess))

        # Account for learning transition: P(L_t) = P(L_{t-1} | Obs) + (1 - P(L_{t-1} | Obs)) * P(Transit)
        p_next = prob_posterior + (1 - prob_posterior) * self.p_transit
        
        # Clamp to [0, 1] just in case
        return max(0.0, min(1.0, p_next))

    def update_mastery(self, mastery_state: MasteryState, concepts: List[str], is_correct: bool) -> MasteryState:
        """
        Updates mastery for all concepts involved in the question.
        """
        for concept in concepts:
            current_p = mastery_state.concept_mastery.get(concept, self.p_init)
            
            # If the question covers multiple concepts, we can either:
            # 1. Update all of them fully (simplest)
            # 2. Distribute credit/blame
            # For BKT, we typically assume the question creates a learning opportunity for all involved concepts.
            new_p = self._update_single_concept(current_p, is_correct)
            mastery_state.concept_mastery[concept] = new_p
            
        return mastery_state
