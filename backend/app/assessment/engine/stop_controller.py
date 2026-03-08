from app.assessment.models.schemas import AssessmentSession

class StopController:
    """
    Determines when an adaptive assessment should terminate.
    """

    @staticmethod
    def should_stop(session: AssessmentSession, mastery_threshold: float = 0.85, max_questions: int = 10) -> bool:
        """
        Evaluates stop conditions:
        1. Reached max questions limit (fatigue/time constraint).
        2. Demonstrated high mastery (efficiency).
        """
        # 1. Hard limits
        if len(session.responses) >= max_questions:
            return True

        if len(session.responses) >= session.total_questions:
             return True

        # 2. Mastery condition (Stop early if crushing it)
        # Assuming we check the session's overall moving average accuracy or ability estimate
        if session.mastery_state and session.mastery_state.concept_mastery:
             # Check if average mastery across tested concepts is very high
             avg_mastery = sum(session.mastery_state.concept_mastery.values()) / max(len(session.mastery_state.concept_mastery), 1)
             # Require at least a few questions to prove mastery
             if avg_mastery >= mastery_threshold and len(session.responses) >= 3:
                 return True
                 
        return False

    @staticmethod
    def get_stop_reason(session: AssessmentSession, mastery_threshold: float = 0.85, max_questions: int = 10) -> str:
        if len(session.responses) >= max_questions or len(session.responses) >= session.total_questions:
             return "Question limit reached."
             
        if session.mastery_state and session.mastery_state.concept_mastery:
             avg_mastery = sum(session.mastery_state.concept_mastery.values()) / max(len(session.mastery_state.concept_mastery), 1)
             if avg_mastery >= mastery_threshold and len(session.responses) >= 3:
                 return "Demonstrated sufficient mastery."
                 
        return "In progress"
