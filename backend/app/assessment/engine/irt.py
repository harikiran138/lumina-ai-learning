import math


class IRTModel:
    """
    Minimal 2PL/3PL-inspired IRT utility.
    theta: learner ability estimate (0.0–1.0)
    difficulty: item difficulty (0.0–1.0)
    discrimination: slope (defaults to 1.0)
    guessing: lower asymptote (defaults to 0.0)
    """

    @staticmethod
    def prob_correct(theta: float, difficulty: float, discrimination: float = 1.0, guessing: float = 0.0) -> float:
        theta = max(0.0, min(1.0, theta))
        difficulty = max(0.0, min(1.0, difficulty))
        discrimination = max(0.1, discrimination)
        guessing = max(0.0, min(0.35, guessing))

        logit = discrimination * (theta - difficulty)
        base = 1.0 / (1.0 + math.exp(-logit))
        return guessing + (1.0 - guessing) * base

    @staticmethod
    def update_theta(
        theta: float,
        difficulty: float,
        score: float,
        discrimination: float = 1.0,
        guessing: float = 0.0,
        lr: float = 0.2,
    ) -> float:
        score = max(0.0, min(1.0, score))
        p = IRTModel.prob_correct(theta, difficulty, discrimination, guessing)
        gradient = discrimination * (score - p)
        next_theta = theta + (lr * gradient)
        return round(max(0.05, min(0.95, next_theta)), 4)

    @staticmethod
    def confidence(theta: float, difficulty: float, discrimination: float = 1.0, guessing: float = 0.0) -> float:
        p = IRTModel.prob_correct(theta, difficulty, discrimination, guessing)
        # High confidence when probability is far from 0.5
        confidence = 1.0 - abs(0.5 - p) * 2.0
        return round(max(0.05, min(0.95, confidence)), 2)


irt_model = IRTModel()
