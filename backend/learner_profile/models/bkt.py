class BKTModel:
    """
    Bayesian Knowledge Tracing Model.
    Tracks P(L) = probability student learned skill.
    """

    def __init__(self, p_l0=0.1, p_t=0.2, p_g=0.1, p_s=0.1):
        # Default parameters (can be tuned per concept)
        self.p_l0 = p_l0  # Initial probability of knowledge
        self.p_t = p_t    # Probability of learning from one attempt
        self.p_g = p_g    # Probability of guessing correctly
        self.p_s = p_s    # Probability of slip (knowing but answering wrong)

    def update_mastery(self, current_mastery: float, correct: bool) -> float:
        """
        Update mastery estimate after a response.
        """
        if correct:
            # Probability of correct answer given current state
            p_correct = (current_mastery * (1 - self.p_s) +
                        (1 - current_mastery) * self.p_g)

            # Bayes rule: updated knowledge probability
            p_l_updated = (current_mastery * (1 - self.p_s) / p_correct) if p_correct > 0 else 0
        else:
            # Probability of incorrect answer given current state
            p_incorrect = (current_mastery * self.p_s +
                          (1 - current_mastery) * (1 - self.p_g))
            
            # Bayes rule: updated knowledge probability
            p_l_updated = (current_mastery * self.p_s / p_incorrect) if p_incorrect > 0 else 0

        # Learning transition
        new_mastery = p_l_updated + self.p_t * (1 - p_l_updated)
        
        return max(0.0, min(1.0, new_mastery))

    def predict_mastery(self, p_known, p_learn, p_guess, p_slip) -> float:
        """Legacy method for backward compatibility if needed"""
        return p_known  # Just returning current for now
