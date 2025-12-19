import time
import json
import logging
from analytics_agent.agents.analytics.agent import AnalyticsAgent

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def main():
    print("Initializing Lumina Analytics Agent...")
    agent = AnalyticsAgent(agent_id="agent_alpha", learner_id="learner_001")
    
    # Mock Event Stream (Scenario: Learner struggling with a quiz)
    print("\n--- Simulating Event Stream (Struggling Learner) ---")
    events = [
        {"event_type": "scroll", "payload": {"velocity": 50.0}, "timestamp": time.time()}, # Fast scroll (anxious?)
        {"event_type": "scroll", "payload": {"velocity": 45.0}, "timestamp": time.time()+1},
        {"event_type": "pause", "payload": {"duration": 15}, "timestamp": time.time()+2}, # Thinking
        {"event_type": "quiz_answer", "payload": {"concept_id": "gradient_descent", "is_correct": False}, "timestamp": time.time()+20},
        {"event_type": "click", "payload": {"target": "help_button"}, "timestamp": time.time()+25}
    ]
    
    # Process
    context = {"time_of_day_modifier": 0.8} # Late night
    output = agent.process_signals(events, context)
    
    # Display Output
    print("\n--- Agent Analysis Output ---")
    print(json.dumps(output.model_dump(exclude_none=True), indent=2))
    
    # Display MCP Actions
    actions = agent.decide_mcp_actions(output)
    print(f"\n--- MCP Actions Triggered ({len(actions)}) ---")
    for action in actions:
        print(f"[{action.type.upper()}] {action.model_dump_json()}")

    # --- Scenario 2: Flow State Learner ---
    print("\n\n" + "="*50)
    print("--- Simulating Event Stream (Flow State Learner) ---")
    
    # Reset agent state slightly for demo (or create new one, but let's just reuse with new ID)
    agent = AnalyticsAgent(agent_id="agent_beta", learner_id="learner_002")
    
    events_flow = [
        {"event_type": "scroll", "payload": {"velocity": 12.0}, "timestamp": time.time()}, # Steady, controlled scroll
        {"event_type": "scroll", "payload": {"velocity": 10.0}, "timestamp": time.time()+10},
        {"event_type": "quiz_answer", "payload": {"concept_id": "gradient_descent", "is_correct": True}, "timestamp": time.time()+60},
        {"event_type": "quiz_answer", "payload": {"concept_id": "backprop", "is_correct": True}, "timestamp": time.time()+120}
    ]
    
    # Context: Cruising
    context_flow = {"time_of_day_modifier": 1.1} 
    
    # Process
    output_flow = agent.process_signals(events_flow, context_flow)
    
    # Display Output
    print("\n--- Agent Analysis Output (Flow) ---")
    print(json.dumps(output_flow.model_dump(exclude_none=True), indent=2))
    
    actions_flow = agent.decide_mcp_actions(output_flow)
    print(f"\n--- MCP Actions Triggered ({len(actions_flow)}) ---")
    for action in actions_flow:
        print(f"[{action.type.upper()}] {action.model_dump_json()}")

if __name__ == "__main__":
    main()
