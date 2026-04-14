import math
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class FSRSState(BaseModel):
    stability: float = 2.0
    difficulty: float = 5.0
    elapsed_days: int = 0
    scheduled_days: int = 2
    last_review: datetime = Field(default_factory=datetime.utcnow)

class FSRSModel:
    """
    Simplified Free Spaced Repetition Scheduler (FSRS).
    Calculates next review intervals based on performance.
    """
    
    def __init__(self):
        # Default weights
        self.w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.26, 2.05]

    def _retrievability(self, elapsed_days: int, stability: float) -> float:
        return math.pow(1 + elapsed_days / (9 * stability), -1)

    def calculate_next(self, state: FSRSState, rating: int) -> Dict[str, Any]:
        """
        rating: 1 (Forgot), 2 (Hard), 3 (Good), 4 (Easy)
        """
        if state.elapsed_days == 0:
            # First review ever or reset
            return self._init_review(rating)

        retrievability = self._retrievability(state.elapsed_days, state.stability)
        
        # Update Difficulty
        new_difficulty = state.difficulty + (rating - 3) * -1.0 # Simple heuristic
        new_difficulty = max(1.0, min(10.0, new_difficulty))

        # Update Stability
        if rating == 1: # Forgot
            new_stability = state.stability * 0.5
        else:
            # Increase stability based on retrievability and rating
            # S' = S * (1 + exp(w) * (1-R) * ...)
            new_stability = state.stability * (1 + math.exp(self.w[8]) * (1 - retrievability) * rating)

        new_stability = max(0.1, new_stability)
        interval = math.ceil(new_stability * 9 * (1/0.9 - 1)) # Approx interval for 90% recall
        
        return {
            "stability": float(f"{new_stability:.4f}"),
            "difficulty": float(f"{new_difficulty:.4f}"),
            "scheduled_days": int(interval),
            "next_review": (datetime.utcnow() + timedelta(days=interval)).isoformat()
        }

    def _init_review(self, rating: int) -> Dict[str, Any]:
        # Simple starting points
        intervals = {1: 1, 2: 2, 3: 4, 4: 7}
        stabilities = {1: 0.5, 2: 2.0, 3: 5.0, 4: 10.0}
        
        interval = intervals.get(rating, 1)
        stability = stabilities.get(rating, 2.0)
        
        return {
            "stability": stability,
            "difficulty": 5.0,
            "scheduled_days": interval,
            "next_review": (datetime.utcnow() + timedelta(days=interval)).isoformat()
        }

fsrs_engine = FSRSModel()
