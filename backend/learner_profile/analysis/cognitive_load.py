import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List

import numpy as np

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

    def _parse_timestamp(self, value):
        if isinstance(value, datetime):
            return self._to_utc_naive(value)
        if not value:
            return datetime.now(timezone.utc).replace(tzinfo=None)
        if isinstance(value, str):
            normalized = value.replace("Z", "+00:00")
            try:
                return self._to_utc_naive(datetime.fromisoformat(normalized))
            except ValueError:
                match = re.match(
                    r"^(?P<head>.+?\.)?(?P<fraction>\d+)(?P<tz>[+-]\d{2}:\d{2})$",
                    normalized,
                )
                if match:
                    head = match.group("head") or ""
                    fraction = match.group("fraction")
                    tz = match.group("tz")
                    padded = fraction[:6].ljust(6, "0")
                    if not head.endswith("."):
                        head = f"{head}."
                    return self._to_utc_naive(datetime.fromisoformat(f"{head}{padded}{tz}"))
        return datetime.now(timezone.utc).replace(tzinfo=None)

    def _to_utc_naive(self, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value
        return value.astimezone(timezone.utc).replace(tzinfo=None)

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
        response_times = [
            e.get("response_time")
            or e.get("time_taken")
            or e.get("time_taken_seconds")
            or self.optimal_response_time
            for e in recent_events
        ]
        avg_response_time = np.mean(response_times)
        
        # If avg response time >> optimal, likely overloaded
        time_factor = min(1.0, avg_response_time / (self.optimal_response_time * 2))

        # 2. Error pattern analysis
        errors = sum(
            1
            for e in recent_events
            if e.get("is_error", False) or e.get("is_correct") is False
        )
        error_factor = errors / len(recent_events)

        # 3. Fatigue analysis (based on session duration if available)
        # Assuming events are sorted by time
        if len(recent_events) > 1:
            end_time = self._parse_timestamp(recent_events[-1].get("timestamp", datetime.now()))
            start_time = self._parse_timestamp(recent_events[0].get("timestamp", datetime.now()))
            duration = (end_time - start_time).total_seconds()
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
