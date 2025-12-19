import numpy as np
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class SignalProcessor:
    """
    Core engine for transforming raw behavioral data into normalized cognitive features.
    """
    
    def __init__(self):
        # Configuration for noise filtering
        self.idle_threshold_seconds = 300 # 5 minutes
        self.min_interaction_duration = 0.5 # milliseconds? No, seconds.
        
        # Reliability weights (0-1)
        self.source_weights = {
            "scroll": 0.4,
            "click": 0.6,
            "quiz_answer": 1.0,
            "video_pause": 0.7,
            "mouse_move": 0.3
        }

    def normalize_batch(self, events: List[Dict[str, Any]], learner_history: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Applies z-score normalization to continuous signals based on learner's history.
        """
        normalized_events = []
        
        # Example history stats (mock)
        avg_scroll_velocity = learner_history.get("avg_scroll_velocity", 10.0)
        std_scroll_velocity = learner_history.get("std_scroll_velocity", 5.0)
        
        for event in events:
            norm_event = event.copy()
            payload = event.get("payload", {})
            
            # Normalize scroll velocity if present
            if event["event_type"] == "scroll" and "velocity" in payload:
                raw_val = payload["velocity"]
                if std_scroll_velocity > 0:
                    z_score = (raw_val - avg_scroll_velocity) / std_scroll_velocity
                    norm_event["normalized_intensity"] = float(np.clip(z_score, -3, 3)) # Clip outliers
                else:
                    norm_event["normalized_intensity"] = 0.0
            
            # Default for categorical events
            else:
                 norm_event["normalized_intensity"] = 1.0 # Standard impact
                 
            # Apply weight
            weight = self.source_weights.get(event["event_type"], 0.5)
            norm_event["weight"] = weight
            
            normalized_events.append(norm_event)
            
        return normalized_events

    def filter_noise(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Removes noise events (e.g., idle periods, jitter).
        """
        filtered = []
        for event in events:
            # Check for idle timeout (if event represents a duration)
            if event["event_type"] == "pause":
                duration = event.get("payload", {}).get("duration", 0)
                if duration > self.idle_threshold_seconds:
                    logger.debug(f"Filtered idle event: {duration}s")
                    continue
            
            # Check for jitter (micro-movements)
            # Implementation detail: skip very short durations if relevant
            
            filtered.append(event)
            
        return filtered
