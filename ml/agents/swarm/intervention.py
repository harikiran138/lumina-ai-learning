from typing import List

class InterventionAgent:
    """
    Predictive Support Agent for preventing learner failure.
    Analyzes behavior and performance signals to trigger interventions.
    """

    def detect_risk(self, learner_analytics: dict) -> dict:
        """
        Analyze learner data for risk factors.
        Signals: low engagement, high error rate, high cognitive load.
        """
        risk_factors = []
        
        # 1. Engagement check
        engagement = learner_analytics.get('engagement_score', 100)
        if engagement < 30:
            risk_factors.append("CRITICAL_LOW_ENGAGEMENT")
        elif engagement < 50:
            risk_factors.append("LOW_ENGAGEMENT")

        # 2. Performance check
        avg_score = learner_analytics.get('recent_average', 1.0)
        if avg_score < 0.4:
            risk_factors.append("HIGH_ERROR_RATE")

        # 3. Cognitive Load check
        load = learner_analytics.get('cognitive_load', 50)
        if load > 85:
            risk_factors.append("COGNITIVE_OVERLOAD")

        is_at_risk = len(risk_factors) > 0
        return {
            "at_risk": is_at_risk,
            "risk_factors": risk_factors,
            "severity": "high" if len(risk_factors) > 1 else "medium"
        }

    def suggest_intervention(self, risk_data: dict) -> str:
        """
        Suggest a pedagogical intervention based on risk factors.
        """
        factors = risk_data.get("risk_factors", [])
        
        if "COGNITIVE_OVERLOAD" in factors:
            return "Student is overwhelmed. Suggest taking a break or reviewing a simpler foundational concept."
        
        if "HIGH_ERROR_RATE" in factors:
            return "Student is struggling with accuracy. Recommend a Socratic review session for the current topic."
            
        if "CRITICAL_LOW_ENGAGEMENT" in factors:
            return "Student engagement is very low. Try an interactive quiz or a collaborative reflection prompt to re-engage."

        return "Continue monitoring student progress."
