import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict

class CognitiveLoadEstimator:
    """
    Real-time mental effort estimation.
    Indicators:
    - Response time (too fast = guessing; too slow = overload)
    - Error patterns (repeated same error = confusion)
    - Session duration (fatigue)
    """

    def __init__(self, optimal_response_time=30):
        self.optimal_response_time = optimal_response_time

    def estimate_load(self, recent_events: List[Dict]) -> float:
        """
        Cognitive Load Index: [0, 100]
        0-30: Underutilized (bored)
        30-70: Optimal zone
        70-100: Overloaded
        """
        if not recent_events:
            return 50.0

        # 1. Response time analysis
        response_times = [e.get('response_time', self.optimal_response_time) for e in recent_events]
        avg_response_time = np.mean(response_times)
        
        # If avg response time >> optimal, likely overloaded
        time_factor = min(1.0, avg_response_time / (self.optimal_response_time * 2))

        # 2. Error pattern analysis
        errors = sum(1 for e in recent_events if e.get('is_error', False))
        error_factor = errors / len(recent_events)

        # 3. Fatigue analysis (based on session duration if available)
        # Assuming events are sorted by time
        if len(recent_events) > 1:
            duration = (recent_events[-1].get('timestamp', datetime.now()) - 
                        recent_events[0].get('timestamp', datetime.now())).total_seconds()
            fatigue_factor = min(1.0, duration / 3600)  # 60 min = max fatigue
        else:
            fatigue_factor = 0.0

        # Composite score
        load = (
            time_factor * 0.4 +
            error_factor * 0.35 +
            fatigue_factor * 0.25
        ) * 100

        return float(np.clip(load, 0, 100))
