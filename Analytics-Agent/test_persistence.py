
import time
import logging
from analytics_agent.agents.analytics.agent import AnalyticsAgent
from analytics_agent.agents.analytics.schema import AnalyticsOutput

def test_persistent_idle_logic():
    print("--- Testing Persistent Idle Logic ---")
    
    agent = AnalyticsAgent("agent_perm_test", "learner_X")
    
    # 1. First interaction (Current time)
    # Simulate low engagement but short time
    print("\n1. Simulation: Short Idle (Just started)")
    events_idle = [{"event_type": "scroll", "timestamp": time.time(), "payload": {"velocity": 1.0}}] # Very passive
    
    output = agent.process_signals(events_idle)
    print(f"Engagement: {output.engagement_score}")
    print(f"Risk Assessment: {output.risk_assessment}")
    
    # Assert risk is low because time is short
    if output.risk_assessment.dropout_risk > 0.4:
        print("FAIL: Risk too high for short idle.")
    else:
        print("PASS: Risk low for short idle.")
        
    # 2. Simulate Time Jump (Persisting Idle)
    # Manually backdate the last_interaction_timestamp to 31 minutes ago
    print("\n2. Simulation: Persistent Idle (> 30 mins ago)")
    agent.engagement_state.last_interaction_timestamp = time.time() - 1900 # 31 mins
    
    # Process same idle events (learner comes back or cron job runs analysis on empty stream?)
    # If standard processing runs, it updates timestamp. So we simulate the 'check' 
    # But wait, process_signals updates the timestamp at the end. 
    # The logic calculates time_diff BEFORE updating.
    
    output = agent.process_signals(events_idle)
    print(f"Engagement: {output.engagement_score}")
    print(f"Risk Assessment: {output.risk_assessment}")
    
    # Assert risk jumps
    if output.risk_assessment.dropout_risk > 0.4: # Base 0.4 + 0.1? No, 0.1 + 0.5 = 0.6
        print("PASS: Risk spiked due to persistence.")
    else:
        print(f"FAIL: Risk did not spike (Risk={output.risk_assessment.dropout_risk}).")

if __name__ == "__main__":
    test_persistent_idle_logic()
