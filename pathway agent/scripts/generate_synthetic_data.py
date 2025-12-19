import random
import json
import os
import numpy as np

OUTPUT_DIR = "data/synthetic"
os.makedirs(OUTPUT_DIR, exist_ok=True)

ACTIONS = ["continue", "review", "advance", "rest"]
CONCEPTS = [f"c_{i}" for i in range(10)]

class Learner:
    def __init__(self, profile_name):
        self.profile = profile_name
        self.mastery = {c: 0.1 for c in CONCEPTS}
        self.fatigue = 0.0
        self.engagement = 1.0
        self.current_concept_idx = 0
        
        # Profile params
        if profile_name == "fast":
            self.learning_rate = 0.3
            self.fatigue_rate = 0.05
        elif profile_name == "slow":
            self.learning_rate = 0.05
            self.fatigue_rate = 0.1
        elif profile_name == "fatigued":
            self.learning_rate = 0.1
            self.fatigue_rate = 0.3
        elif profile_name == "guesser":
            self.learning_rate = 0.01
            self.fatigue_rate = 0.05
        elif profile_name == "inconsistent":
            self.learning_rate = 0.15 # Variance applied later
            self.fatigue_rate = 0.1
        else:
            self.learning_rate = 0.1
            self.fatigue_rate = 0.1

    def step(self, action):
        concept = CONCEPTS[self.current_concept_idx]
        
        # Apply action effects
        if action == "rest":
            self.fatigue = max(0, self.fatigue - 0.4)
            self.engagement += 0.1
        elif action == "review":
            self.mastery[concept] += self.learning_rate * 0.5 * (1 - self.fatigue)
            self.fatigue += self.fatigue_rate * 0.8
        elif action == "continue":
            # Practice current
            gain = self.learning_rate * (1 - self.fatigue)
            if self.profile == "inconsistent":
                gain *= random.uniform(0, 2)
            self.mastery[concept] += gain
            self.fatigue += self.fatigue_rate
        elif action == "advance":
            if self.current_concept_idx < len(CONCEPTS) - 1:
                self.current_concept_idx += 1
            self.fatigue += self.fatigue_rate * 1.2

        # Clamp
        self.mastery[concept] = min(1.0, max(0.0, self.mastery[concept]))
        self.fatigue = min(1.0, max(0.0, self.fatigue))
        self.engagement = min(1.0, max(0.0, self.engagement))

        # Outcome (simulated assessment)
        if self.profile == "guesser":
            correct = random.random() > 0.5
        else:
            prob = self.mastery[concept] * (1 - self.fatigue * 0.5)
            correct = random.random() < prob

        return {
            "concept": concept,
            "mastery": self.mastery[concept],
            "fatigue": self.fatigue,
            "engagement": self.engagement,
            "correct": correct
        }

def generate_episodes(n_students=100):
    data = []
    profiles = ["fast", "slow", "fatigued", "guesser", "inconsistent"]
    
    for i in range(n_students):
        profile = random.choice(profiles)
        student = Learner(profile)
        trajectory = []
        
        for t in range(50): # 50 steps per student
            # Simple policy for data generation
            if student.fatigue > 0.8:
                action = "rest"
            elif student.mastery[CONCEPTS[student.current_concept_idx]] > 0.8:
                action = "advance"
            else:
                action = random.choice(["continue", "review"])
            
            outcome = student.step(action)
            step_data = {
                "student_id": i,
                "profile": profile,
                "step": t,
                "action": action,
                **outcome
            }
            trajectory.append(step_data)
        
        data.extend(trajectory)
    
    return data

if __name__ == "__main__":
    print("Generating synthetic data...")
    data = generate_episodes(500)
    
    output_file = os.path.join(OUTPUT_DIR, "synthetic_trajectories.json")
    with open(output_file, "w") as f:
        json.dump(data, f, indent=2)
    
    # Also save as CSV for easier inspection
    import pandas as pd
    df = pd.DataFrame(data)
    df.to_csv(os.path.join(OUTPUT_DIR, "synthetic_trajectories.csv"), index=False)
    
    print(f"Generated {len(data)} steps of synthetic data in {OUTPUT_DIR}")
