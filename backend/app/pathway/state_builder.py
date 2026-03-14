import math
from datetime import datetime
from typing import Dict, List, Any
from app.pathway.schemas import PathwayInput, MasteryDetail

def normalize_stability(days: float) -> float:
    """Log-scale: tanh(x / 30) (saturates at ~1 month)"""
    if days is None:
        return 0.0
    return math.tanh(days / 30.0)

def normalize_recency(hours: float, decay_lambda: float = 0.05) -> float:
    """Exponential Decay: e^{-\lambda x} (Recency factor)"""
    if hours is None:
        return 0.0
    return math.exp(-decay_lambda * hours)

def normalize_cognitive_load(load_index: float) -> float:
    """Min-Max: (x - 1) / 9"""
    if load_index is None:
        return 0.5 # Neutral
    # constrain between 1 and 10 to avoid bounds issues
    load_index = max(1.0, min(10.0, load_index))
    return (load_index - 1.0) / 9.0

def normalize_session_time(minutes: float) -> float:
    """Min-Max (Capped at 120): min(x, 120) / 120"""
    if minutes is None:
        return 0.0
    return min(minutes, 120.0) / 120.0

class StateBuilder:
    """
    Constructs and normalizes the state vector S_t for the Pathway Agent.
    """
    
    @staticmethod
    def build_state(context: PathwayInput) -> Dict[str, Any]:
        """
        Takes raw PathwayInput and builds a normalized feature dictionary.
        In a full RL pipeline, this dictionary would be flattened into a NumPy array or PyTorch tensor.
        """
        now = context.currentTimestamp or datetime.utcnow()
        
        # 1. Session & Engagement Constraints (Handling missing data)
        session_mins = context.engagementState.currentSessionDurationMinutes or 0
        fatigue = context.engagementState.fatigueLevel
        if fatigue is None:
             fatigue = min(1.0, session_mins / 90.0)
             
        cog_load = context.engagementState.cognitiveLoadIndex
        
        # 2. Normalized Engagement Features
        encoded_engagement = {
            "norm_session_time": normalize_session_time(session_mins),
            "norm_cognitive_load": normalize_cognitive_load(cog_load),
            "norm_fatigue": min(max(fatigue, 0.0), 1.0)
        }
        
        # 3. Handle Constraints
        time_budget_mins = 60 # Default
        if context.constraints and context.constraints.maxSessionTimeMinutes:
             time_budget_mins = context.constraints.maxSessionTimeMinutes
             
        encoded_context = {
            "time_remaining_ratio": 1.0 - normalize_session_time(session_mins / max(time_budget_mins, 1.0) * 120),
            "readiness_score": context.readinessScore,
            "risk_level": 1.0 if context.riskLevel == "critical" else 0.7 if context.riskLevel == "high" else 0.4 if context.riskLevel == "medium" else 0.0
        }

        # 4. Mastery State (Aggregated or Concept-Specific)
        # For this vector representation, we aggregate the summary statistics of the concepts
        # as well as keep a detailed list for target selection
        encoded_concepts = []
        for concept_id, detail in context.masteryState.items():
            
            recency_hours = 0.0
            if detail.lastInteraction:
                delta = now - detail.lastInteraction
                recency_hours = delta.total_seconds() / 3600.0
                
            norm_conf = detail.confidence if detail.confidence is not None else 0.5
            norm_stab = normalize_stability(detail.stability) if detail.stability is not None else 0.0
            norm_rec = normalize_recency(recency_hours)
            
            encoded_concepts.append({
                "concept_id": concept_id,
                "norm_confidence": norm_conf,
                "norm_stability": norm_stab,
                "norm_recency": norm_rec,
                "prob_correct": detail.probabilityCorrect
            })
            
        # 5. History / Recent Performance Encoding
        encoded_history = []
        recent = context.recentPerformance or []
        for record in recent[-10:]: # keep last 10
            outcome_val = 0.0
            if record.outcome == "correct":
                outcome_val = 1.0
            elif record.outcome == "partial":
                outcome_val = 0.5
                
            encoded_history.append(outcome_val)
            
        # Pad history to ensure fixed length (10) for tensor stability
        while len(encoded_history) < 10:
             encoded_history.insert(0, 0.5) # Neutral pad
             
        # Combine all features into the flat state dictionary S_t
        return {
            "engagement": encoded_engagement,
            "context": encoded_context,
            "concepts": encoded_concepts,
            "history": encoded_history
        }
