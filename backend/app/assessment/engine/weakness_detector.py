from typing import Optional, Dict

class WeaknessDetector:
    """
    Analyzes student responses to identify specific learning weaknesses or test-taking behaviors.
    """

    @staticmethod
    def analyze_response(is_correct: bool, time_taken_seconds: Optional[float], expected_time: float = 30.0) -> Optional[str]:
        """
        Classifies the response pattern based on correctness and time taken.
        Returns a string classifying the weakness, or None if no specific weakness is detected.
        """
        if is_correct:
            return None # No weakness on correct answers (ignoring lucky guesses for now)

        if time_taken_seconds is None:
            return "Concept Gap" # Default if no timing info

        # Heuristic 1: Fast + Wrong = Guessing / Impulsivity
        if time_taken_seconds < (expected_time * 0.3):
            return "Guessing / Rushed"

        # Heuristic 2: Slow + Wrong = Deep Concept Gap / Confusion
        if time_taken_seconds > (expected_time * 1.5):
            return "Deep Concept Gap"

        # Default
        return "Concept Gap"
