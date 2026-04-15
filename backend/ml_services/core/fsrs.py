from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, Union


@dataclass
class FSRSState:
    stability: float
    difficulty: float
    elapsed_days: int = 0


class FSRSModel:
    """
    Lightweight FSRS-compatible scheduler used by the current app service.
    """

    def calculate_next(self, state: FSRSState, grade: int) -> Dict[str, Union[float, int, str]]:
        stability = max(0.1, float(state.stability or 1.0))
        difficulty = min(10.0, max(1.0, float(state.difficulty or 3.0)))
        elapsed = max(0, int(state.elapsed_days or 0))

        if grade <= 1:
            scheduled_days = 1
            stability = max(0.5, stability * 0.7)
            difficulty = min(10.0, difficulty + 0.8)
        elif grade == 2:
            scheduled_days = max(2, int(round(stability * 2.0)))
            stability = max(0.75, stability * 1.05)
            difficulty = min(10.0, difficulty + 0.2)
        elif grade == 3:
            scheduled_days = max(3, int(round(stability * 4.5 + max(elapsed, 0))))
            stability = stability * 1.35
            difficulty = max(1.0, difficulty - 0.15)
        else:
            scheduled_days = max(5, int(round(stability * 7.0 + max(elapsed, 0))))
            stability = stability * 1.6
            difficulty = max(1.0, difficulty - 0.3)

        next_review = datetime.now(timezone.utc) + timedelta(days=scheduled_days)
        return {
            "stability": round(stability, 4),
            "difficulty": round(difficulty, 4),
            "scheduled_days": scheduled_days,
            "next_review": next_review.isoformat(),
        }
