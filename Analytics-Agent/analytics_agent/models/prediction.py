from typing import Dict, Any, List
from .base_model import AnalyticsModel

class RiskModel(AnalyticsModel):
    def predict(self, features: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        # Context fields
        engagement_score = context.get("engagement_score", 0.5)
        mastery_avg = context.get("avg_mastery", 0.5)
        time_since_last = context.get("time_since_last_interaction", 0.0)
        
        # Heuristic Logic
        # 1. Base risk from low mastery (performance decline)
        dropout_risk = 0.0
        if mastery_avg < 0.4:
            dropout_risk += 0.3
            
        # 2. Engagement Risk - Only if persistent or very low
        if engagement_score < 0.2:
             # Idle behavior
             if time_since_last > 1800: # 30 minutes
                 dropout_risk += 0.5 # Serious dropout candidate
             else:
                 dropout_risk += 0.1 # Just a break, low risk
        elif engagement_score < 0.4:
             dropout_risk += 0.1

        return {
            "dropout_risk": round(min(1.0, dropout_risk), 2),
            "failure_risk": round(min(1.0, dropout_risk * 1.1 + (0.5 - mastery_avg)*0.5), 2)
        }

class StrategyDetector(AnalyticsModel):
    def predict(self, features: Dict[str, Any], context: Dict[str, Any] = None) -> Dict[str, Any]:
        dom = features.get("dominant_event", "none")
        if dom == "video_pause" or dom == "video_seek":
            strategy = "visual_learner"
        elif dom == "quiz_answer":
            strategy = "active_recall"
        else:
            strategy = "passive_reading"
            
        return {"strategy": strategy}
