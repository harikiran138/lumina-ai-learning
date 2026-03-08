from app.assessment.models.schemas import AssessmentSession

class FeedbackEngine:
    """
    Generates personalized feedback and hints based on assessment performance.
    """

    @staticmethod
    def generate_session_summary(session: AssessmentSession) -> str:
        """
        Generates a summary string for the completed session.
        """
        total = len(session.responses)
        if total == 0:
            return "No questions answered."
            
        correct = sum(1 for r in session.responses if r.is_correct)
        accuracy = correct / total

        if accuracy >= 0.8:
            return f"Excellent work! You answered {correct} out of {total} correctly. You have a strong grasp of the material."
        elif accuracy >= 0.5:
            return f"Good effort. You got {correct} out of {total} correct. Reviewing the missed concepts will help solidify your understanding."
        else:
            return f"Keep practicing! You scored {correct}/{total}. We recommend revisiting the foundational materials before trying again."
