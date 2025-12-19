import time
import json
import random
import logging
from typing import List, Dict, Any
from analytics_agent.agents.analytics.agent import AnalyticsAgent

# Suppress info logs for the simulation summary
logging.getLogger("analytics_agent").setLevel(logging.ERROR)

def generate_random_scenario(learner_id: str) -> Dict[str, Any]:
    """
    Generates a random event stream for a learner.
    Returns: (events, expected_state_label)
    """
    scenario_type = random.choice(["flow", "struggle", "idle", "mixed"])
    events = []
    base_time = time.time()
    
    if scenario_type == "flow":
        # Consistent activity, correct answers
        for i in range(5):
            events.append({
                "event_type": "scroll", 
                "payload": {"velocity": random.uniform(8.0, 15.0)}, 
                "timestamp": base_time + i*10
            })
        events.append({
            "event_type": "quiz_answer", 
            "payload": {"concept_id": "c1", "is_correct": True}, 
            "timestamp": base_time + 60
        })
        
    elif scenario_type == "struggle":
        # Erratic scrolling, errors, help requests
        for i in range(5):
             events.append({
                "event_type": "scroll", 
                "payload": {"velocity": random.uniform(30.0, 60.0)}, 
                "timestamp": base_time + i*5
            })
        events.append({
            "event_type": "quiz_answer", 
            "payload": {"concept_id": "c1", "is_correct": False}, 
            "timestamp": base_time + 30
        })
        if random.random() > 0.5:
            events.append({
                "event_type": "click", 
                "payload": {"target": "help"}, 
                "timestamp": base_time + 40
            })
            
    elif scenario_type == "idle":
        # Long pauses
        events.append({
            "event_type": "pause", 
            "payload": {"duration": random.uniform(300, 600)}, 
            "timestamp": base_time
        })
        
    else: # Mixed
        events.append({
            "event_type": "scroll", 
            "payload": {"velocity": 10.0}, 
            "timestamp": base_time
        })
        events.append({
            "event_type": "pause", 
            "payload": {"duration": 60}, 
            "timestamp": base_time + 20
        })

    return {"type": scenario_type, "events": events, "learner_id": learner_id}

def main():
    print(f"--- Starting 1000-Iteration Simulation ---")
    
    results = []
    start_time = time.time()
    
    for i in range(1000):
        learner_id = f"learner_{i}"
        scenario = generate_random_scenario(learner_id)
        
        # Instantiate fresh agent per learner (stateless for this sim)
        agent = AnalyticsAgent(agent_id=f"agent_{i}", learner_id=learner_id)
        
        # Process
        output = agent.process_signals(scenario["events"], context={"time_of_day_modifier": 1.0})
        # actions are now in output.mcp_actions
        
        results.append({
            "scenario": scenario["type"],
            "engagement": output.engagement_score,
            "load": output.cognitive_load,
            "actions": len(output.mcp_actions),
            "action_types": [a["type"] for a in output.mcp_actions] # formatted as dicts now
        })
        
        if (i+1) % 100 == 0:
            print(f"Processed {i+1}/1000 simulations...")
            
    total_time = time.time() - start_time
    print(f"\n\n--- Simulation Complete in {total_time:.2f}s ---\n")
    
    # Analysis
    scenario_counts = {}
    avg_engagement = {}
    intervention_counts = 0
    
    for r in results:
        stype = r["scenario"]
        scenario_counts[stype] = scenario_counts.get(stype, 0) + 1
        
        if stype not in avg_engagement:
             avg_engagement[stype] = []
        avg_engagement[stype].append(r["engagement"])
        
        if r["actions"] > 0:
            intervention_counts += 1
            
    print("Aggregate Metrics:")
    print(f"Total Simulations: 1000")
    print(f"Interventions Triggered: {intervention_counts} ({intervention_counts/10:.1f}%)")
    print("-" * 30)
    print(f"{'Scenario':<15} | {'Count':<5} | {'Avg Engagement':<15}")
    print("-" * 30)
    
    for stype, count in scenario_counts.items():
        avg_eng = sum(avg_engagement[stype]) / len(avg_engagement[stype])
        print(f"{stype:<15} | {count:<5} | {avg_eng:.3f}")

if __name__ == "__main__":
    main()
