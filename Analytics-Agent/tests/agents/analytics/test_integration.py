import pytest
from analytics_agent.agents.analytics.agent import AnalyticsAgent

def test_full_pipeline_integration():
    agent = AnalyticsAgent("test_agent", "user_1")
    
    # Input with variety
    events = [
        {"event_type": "scroll", "payload": {"velocity": 10.0}},
        {"event_type": "quiz_answer", "payload": {"concept_id": "c1", "is_correct": True}}
    ]
    
    output = agent.process_signals(events, context={})
    
    # Verify core fields populated by models
    assert output.engagement_score > 0
    assert output.mastery_update is not None
    assert output.mastery_update.concept == "c1"
    assert output.mastery_update.probability > 0.1 # Should have increased
    assert output.mastery_update.delta > 0
    
    # Recommend action?
    # Cognitive load might be optimal, so no overload action
    assert "reduce_difficulty" not in output.recommended_action
