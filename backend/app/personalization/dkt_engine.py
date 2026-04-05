from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.personalization.schemas import LearnerProfileRecord, ConceptMastery, KPISnapshot

class DKTEngine:
    """
    Deep Knowledge Tracing (DKT) Engine for long-term mastery forecasting
    and pedagogical intervention triggers.
    """

    @staticmethod
    def predict_mastery(profile: LearnerProfileRecord, concept_id: str, horizon: int = 5) -> float:
        """
        Forecasting mastery after N steps based on current growth velocity and learning persistence.
        Simple linear projection of current mastery trend, capped at 1.0.
        """
        mastery_obj = profile.mastery_state.get(concept_id, ConceptMastery())
        current_mastery = mastery_obj.score
        velocity = profile.kpi_snapshot.growth_velocity
        readiness = profile.kpi_snapshot.readiness

        # Forecast: Future = Current + (Velocity * Horizon * ReadinessFactor)
        # Using 0.1 as a baseline boost for readiness to avoid static prediction if readiness is 0
        projected = current_mastery + (velocity * horizon * (readiness + 0.1))
        return round(max(0.0, min(1.0, projected)), 4)

    @staticmethod
    def get_intervention_triggers(profile: LearnerProfileRecord) -> List[str]:
        """
        Returns a list of reasons why an intervention should be triggered based on DKT signals.
        """
        triggers = []
        kpi = profile.kpi_snapshot

        if kpi.lag_zone_score > 0.6:
            triggers.append("high_lag_detected")
        
        if kpi.growth_velocity < 0.05 and kpi.learning_score < 0.4:
            triggers.append("learning_plateau_under_mastery")
            
        if kpi.authenticity_score < 0.3:
            triggers.append("authenticity_risk")

        if kpi.persistence < 0.2 and kpi.lag_zone_score > 0.4:
            triggers.append("persistence_collapse")

        return triggers

    @staticmethod
    def identify_at_risk_concepts(profile: LearnerProfileRecord) -> List[str]:
        """
        Identifies specific concepts where the student is likely to fail next.
        """
        return [
            concept_id 
            for concept_id, mastery in profile.mastery_state.items()
            if mastery.score < 0.4 and mastery.attempts > 3
        ]
