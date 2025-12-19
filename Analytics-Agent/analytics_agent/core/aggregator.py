from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class EventAggregator:
    """
    Aggregates a stream of normalized events into a time-window feature vector.
    """
    
    def aggregate_window(self, normalized_events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Collapses a list of events into a single feature dictionary for the model.
        """
        if not normalized_events:
            return {
                "event_count": 0,
                "total_weighted_intensity": 0.0,
                "dominant_strategy": "none"
            }
            
        count = len(normalized_events)
        total_intensity = sum(e.get("normalized_intensity", 0) * e.get("weight", 0) for e in normalized_events)
        
        # Determine dominant event type
        type_counts = {}
        for e in normalized_events:
            t = e["event_type"]
            type_counts[t] = type_counts.get(t, 0) + 1
            
        dominant = max(type_counts, key=type_counts.get) if type_counts else "none"
        
        # Calculate success metrics for decision rules
        quiz_events = [e for e in normalized_events if e["event_type"] == "quiz_answer"]
        total_quizzes = len(quiz_events)
        if total_quizzes > 0:
            correct_count = sum(1 for e in quiz_events if e.get("payload", {}).get("is_correct", False))
            success_rate = correct_count / total_quizzes
            error_rate = 1.0 - success_rate
        else:
            success_rate = 0.0 # No data, assume neutral or handle in logic
            error_rate = 0.0

        return {
            "event_count": count,
            "total_weighted_intensity": total_intensity,
            "dominant_event": dominant,
            "success_rate": success_rate,
            "error_rate": error_rate
        }
