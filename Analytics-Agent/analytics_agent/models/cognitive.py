from typing import Dict, Any
import logging
from .base_model import AnalyticsModel

logger = logging.getLogger(__name__)

class CognitiveLoadModel(AnalyticsModel):
    """
    Estimates cognitive load and fatigue.
    """
    
    def predict(self, features: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        if not context:
            context = {}
            
        # Features
        dominant_event = features.get("dominant_event", "none")
        intensity = features.get("total_weighted_intensity", 0.0)
        
        # Context
        time_of_day_mod = context.get("time_of_day_modifier", 1.0)
        
        # Logic
        # Rapid, intense visualization interaction -> High Load
        # Passive scrolling -> Low Load
        
        load_index = 0.3 # Baseline
        
        if dominant_event == "quiz_answer" or intensity > 5.0:
            load_index = 0.8
        elif dominant_event == "scroll" and intensity < 2.0:
            load_index = 0.2
            
        # Adjust for circadian rhythm (mock)
        adjusted_load = min(1.0, load_index * (2.0 - time_of_day_mod))
        
        # Fatigue detection
        fatigue = False
        if adjusted_load > 0.9 or (context.get("session_duration", 0) > 3600): # > 1 hour
            fatigue = True
            
        return {
            "load_index": round(adjusted_load, 2),
            "fatigue_detected": fatigue,
            "flow_state": (0.6 <= adjusted_load <= 0.8) and not fatigue
        }
