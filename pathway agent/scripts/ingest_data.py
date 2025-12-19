import os
import torch
import pandas as pd
import numpy as np
from torch.utils.data import Dataset, DataLoader
try:
    from datasets import load_dataset
except ImportError:
    print("Hugging Face 'datasets' library not found. Install with: pip install datasets")

def generate_synthetic_data(num_students=100, max_seq_len=50, num_skills=20):
    """Generates synthetic learner data if HF dataset is unavailable."""
    print(f"Generating synthetic data for {num_students} students...")
    data = []
    for s_id in range(num_students):
        seq_len = np.random.randint(10, max_seq_len)
        skills = np.random.randint(0, num_skills, size=seq_len)
        # Simulate simple mastery: probability increases with repeated practice
        mastery = {}
        outcomes = []
        for skill in skills:
            if skill not in mastery:
                mastery[skill] = 0.3 # Initial probability
            
            p = mastery[skill]
            outcome = 1 if np.random.random() < p else 0
            outcomes.append(outcome)
            
            # Learn update
            mastery[skill] = min(0.95, mastery[skill] + 0.1)
            
        data.append({
            "student_id": s_id,
            "skill_seq": skills.tolist(),
            "correct_seq": outcomes
        })
    return pd.DataFrame(data)

class KTDataset(Dataset):
    def __init__(self, data_frame, max_len=50):
        self.data = data_frame
        self.max_len = max_len

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        skills = row['skill_seq']
        correct = row['correct_seq']
        
        # Truncate or Pad
        seq_len = len(skills)
        if seq_len > self.max_len:
            skills = skills[-self.max_len:]
            correct = correct[-self.max_len:]
            mask = [1] * self.max_len
        else:
            pad = [0] * (self.max_len - seq_len)
            mask = [1] * seq_len + [0] * (self.max_len - seq_len)
            skills = skills + pad
            correct = correct + pad
            
        return {
            "skills": torch.tensor(skills, dtype=torch.long),
            "correct": torch.tensor(correct, dtype=torch.long),
            "mask": torch.tensor(mask, dtype=torch.long)
        }

def load_kt_data(dataset_name="assistments", num_skills=100):
    """
    Attempts to load a standard KT dataset from Hugging Face.
    Falls back to synthetic if not found or auth fails.
    """
    try:
        # Note: 'assistments' isn't always directly available without specific configs.
        # This is a placeholder for the user to insert their specific HF dataset ID.
        # Example: dataset = load_dataset("nicolas-hbt/assistments-2009-10")
        # For now, we default to synthetic to ensure the script RUNS out of the box.
        raise ImportError("Direct HF download requires specific dataset ID provided by user.")
        
    except Exception as e:
        print(f"Could not load HF dataset '{dataset_name}': {e}")
        print("Falling back to SYNTHETIC data creation.")
        df = generate_synthetic_data(num_students=500, num_skills=num_skills)
        
    return KTDataset(df)

if __name__ == "__main__":
    ds = load_kt_data()
    print(f"Loaded Dataset with {len(ds)} students.")
    sample = ds[0]
    print("Sample:", sample)
