import pytest
import sys
import os

# Add the project root to the path so we can import the module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

from analytics_agent.agents.analytics.agent import AnalyticsAgent
from analytics_agent.agents.analytics.schema import AnalyticsOutput

def test_agent_initialization():
    agent = AnalyticsAgent(agent_id="agent_001", learner_id="learner_123")
    assert agent.agent_id == "agent_001"
    assert agent.learner_id == "learner_123"
    assert agent.engagement_state.score == 0.5

def test_process_signals_mock():
    agent = AnalyticsAgent(agent_id="test_agent", learner_id="test_learner")
    
    # Mock input signals (valid schema)
    signals = [{"event_type": "scroll", "payload": {"velocity": 100}}]
    
    output = agent.process_signals(signals)
    
    assert isinstance(output, AnalyticsOutput)
    # Engagement model return > 0.1 for active events
    assert output.engagement_score > 0.1
    # Confidence from EngagementModel is 0.85
    assert output.confidence == 0.85
    # Action list might be empty if optimal
    assert isinstance(output.recommended_action, list)

def test_mcp_decision():
    agent = AnalyticsAgent(agent_id="test_agent", learner_id="test_learner")
    
    # Manually trigger a high load state in the schema to test logic
    output = AnalyticsOutput(
        engagement_score=0.5,
        engagement_trend="stable",
        cognitive_load="overload", # <--- Trigger
        fatigue_detected=True,
        confidence=0.9
    )
    
    # Update internal state to match the output scenario (since logic uses internal state)
    agent.cognitive_state.load_index = 0.9
    
    # Define mock features causing overload
    mock_features = {"error_rate": 0.5, "success_rate": 0.5}

    # Pass mock features
    actions = agent.decide_mcp_actions(output, mock_features)
    assert len(actions) == 1
    assert actions[0].type == "difficulty_adjustment"
    assert actions[0].direction == "decrease"
