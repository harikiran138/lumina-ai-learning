import pytest
from analytics_agent.models.engagement import EngagementModel
from analytics_agent.models.cognitive import CognitiveLoadModel
from analytics_agent.models.knowledge import KnowledgeTracer
from analytics_agent.models.prediction import RiskModel

def test_engagement_model():
    model = EngagementModel()
    # Moderate activity
    features = {"total_weighted_intensity": 2.5, "event_count": 5}
    res = model.predict(features)
    assert res["score"] > 0.5
    
    # No activity
    res_idle = model.predict({"total_weighted_intensity": 0, "event_count": 0})
    assert res_idle["score"] == 0.1

def test_cognitive_load_model():
    model = CognitiveLoadModel()
    
    # High load scenario
    features = {"dominant_event": "quiz_answer", "total_weighted_intensity": 6.0}
    context = {"time_of_day_modifier": 1.0}
    res = model.predict(features, context)
    assert res["load_index"] >= 0.8
    
    # Fatigue scenario
    context_fatigue = {"time_of_day_modifier": 0.5, "session_duration": 4000}
    res_fatigue = model.predict(features, context_fatigue)
    assert res_fatigue["fatigue_detected"] is True

def test_knowledge_tracer():
    kt = KnowledgeTracer()
    
    # Correct answer -> increase
    ctx_correct = {"concept_id": "c1", "is_correct": True, "current_p_mastery": 0.5}
    res1 = kt.predict({}, ctx_correct)
    assert res1["delta"] > 0
    assert res1["probability"] > 0.5
    
    # Incorrect -> decrease (or smaller increase depending on params, usually decrease/stagnate)
    ctx_wrong = {"concept_id": "c1", "is_correct": False, "current_p_mastery": 0.5}
    res2 = kt.predict({}, ctx_wrong)
    assert res2["probability"] < 0.5 

def test_risk_model():
    risk = RiskModel()
    ctx = {"engagement_score": 0.2, "avg_mastery": 0.3} # High risk
    res = risk.predict({}, ctx)
    assert res["dropout_risk"] >= 0.7
