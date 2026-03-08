from app.assessment.models.schemas import AssessmentSession

class AssessmentMetrics:
    """
    Computes summative metrics for evaluation at the end of a session.
    """

    @staticmethod
    def calculate_metrics(session: AssessmentSession) -> dict:
        """
        Calculates accuracy, learning gains proxy, etc.
        """
        total = len(session.responses)
        if total == 0:
             return {"accuracy": 0.0, "total": 0, "correct": 0}

        correct = sum(1 for r in session.responses if r.is_correct)
        accuracy = correct / total

        return {
            "accuracy": accuracy,
            "total": total,
            "correct": correct,
            "final_ability": session.final_score if session.final_score else accuracy * session.current_difficulty
        }
