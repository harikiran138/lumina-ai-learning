import math

class AdaptiveLogic:
    def calculate_next_difficulty(self, current_difficulty: float, is_correct: bool) -> float:
        """
        Calculates the difficulty of the next question based on the current difficulty
        and whether the last answer was correct.
        
        Simple algorithm:
        - If correct: Increase difficulty by 0.1 (capped at 1.0)
        - If incorrect: Decrease difficulty by 0.1 (floored at 0.1)
        
        Future improvement: Use IRT (Item Response Theory).
        """
        if is_correct:
            # Increase difficulty
            next_diff = min(1.0, current_difficulty + 0.1)
        else:
            # Decrease difficulty
            next_diff = max(0.1, current_difficulty - 0.1)
            
        return round(next_diff, 2)

    def calculate_final_score(self, ability_estimate: float) -> float:
        """
        Converts the final ability estimate (0.0 to 1.0) to a percentage score.
        """
        return round(ability_estimate * 100, 1)

adaptive_logic = AdaptiveLogic()
