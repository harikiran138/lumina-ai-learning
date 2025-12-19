import sys
import os
import time
import numpy as np
import pandas as pd
import torch
import matplotlib.pyplot as plt

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from pathway.inference_engine import PathwayInferenceEngine

def generate_diverse_students(num_students=1000, num_skills=20, max_len=50):
    """
    Generates 1000 unique student profiles with different 'personas':
    - Struggling (Low Prob)
    - Average (Med Prob)
    - Mastery (High Prob)
    - Improver (Low start, High end)
    """
    print(f"Generating {num_students} unique student profiles...")
    students = []
    
    for i in range(num_students):
        # Assign a random 'persona'
        persona = np.random.choice(['struggling', 'average', 'master', 'improver'])
        
        seq_len = np.random.randint(20, max_len)
        skills = np.random.randint(0, num_skills, size=seq_len).tolist()
        outcomes = []
        
        # Base probability based on persona
        if persona == 'struggling':
            base_p = 0.2
            learning_rate = 0.01
        elif persona == 'average':
            base_p = 0.5
            learning_rate = 0.02
        elif persona == 'master':
            base_p = 0.85
            learning_rate = 0.01
        elif persona == 'improver':
            base_p = 0.3
            learning_rate = 0.05
            
        current_p = base_p
        for s in skills:
            # Simulate outcome
            is_correct = 1 if np.random.random() < current_p else 0
            outcomes.append(is_correct)
            
            # Simple learning curve
            current_p = min(0.99, current_p + learning_rate)
            
        students.append({
            "id": i,
            "persona": persona,
            "skills": skills,
            "correct": outcomes
        })
        
    return students

def run_benchmark():
    # 1. Setup
    engine = PathwayInferenceEngine(model_path="models/tkt_v1.pt", num_skills=20)
    students = generate_diverse_students(num_students=1000)
    
    print("\n--- Starting Evaluation ---")
    start_time = time.time()
    
    results = []
    
    # 2. Inference Loop
    for s in students:
        t0 = time.time()
        pred_mastery = engine.predict_mastery(s['skills'], s['correct'])
        dt = time.time() - t0
        
        results.append({
            "id": s['id'],
            "persona": s['persona'],
            "final_accuracy_seq": np.mean(s['correct']),
            "predicted_mastery": pred_mastery,
            "latency_ms": dt * 1000
        })
        
    total_time = time.time() - start_time
    df = pd.DataFrame(results)
    
    # 3. Report Generation
    print("\n" + "="*40)
    print("       MODEL SCALE REPORT (N=1000)")
    print("="*40)
    print(f"Total Time: {total_time:.2f}s")
    print(f"Avg Latency: {df['latency_ms'].mean():.2f} ms/req")
    print(f"P99 Latency: {df['latency_ms'].quantile(0.99):.2f} ms/req")
    print("-" * 40)
    print("Breakdown by Persona:")
    print(df.groupby('persona')[['predicted_mastery', 'final_accuracy_seq']].mean())
    print("-" * 40)
    
    # Correlation Check
    correlation = df['predicted_mastery'].corr(df['final_accuracy_seq'])
    print(f"Correlation (Simulated Truth vs Prediction): {correlation:.4f}")
    
    # Distribution
    print("\nPrediction Distribution:")
    bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
    dist = pd.cut(df['predicted_mastery'], bins=bins).value_counts().sort_index()
    print(dist)
    
    return df

if __name__ == "__main__":
    run_benchmark()
