import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import os

# Define a simple Policy Network
class PathwayPolicy(nn.Module):
    def __init__(self, input_dim, output_dim):
        super(PathwayPolicy, self).__init__()
        self.fc1 = nn.Linear(input_dim, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, output_dim)
        self.relu = nn.ReLU()
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.softmax(self.fc3(x))
        return x

class TrajectoryDataset(Dataset):
    def __init__(self, csv_file):
        self.data = pd.read_csv(csv_file)
        # Features: mastery, fatigue, engagement, correct (prev step)
        # We need to shift 'correct' to be Input (prev outcome) vs Output (next action) is tricky in supervised.
        # Here we try to clone the behavior of the synthetic generator or 'good' students.
        # For RL, we would simulate. For now, let's do Behavior Cloning on 'fast' learners as a starter.
        
        self.good_learners = self.data[self.data['profile'] == 'fast']
        
        # Simple features
        self.features = self.good_learners[['mastery', 'fatigue', 'engagement']].values.astype(np.float32)
        
        # Actions: Map string to int
        self.action_map = {"continue": 0, "review": 1, "advance": 2, "rest": 3}
        self.labels = self.good_learners['action'].map(self.action_map).values
        
    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]

def train():
    print("Starting training...")
    
    data_path = "data/synthetic/synthetic_trajectories.csv"
    if not os.path.exists(data_path):
        print(f"Data file {data_path} not found. Run generate_synthetic_data.py first.")
        return

    dataset = TrajectoryDataset(data_path)
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    model = PathwayPolicy(input_dim=3, output_dim=4)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()
    
    epochs = 5
    for epoch in range(epochs):
        total_loss = 0
        for features, labels in dataloader:
            optimizer.zero_grad()
            outputs = model(features)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        
        print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(dataloader):.4f}")
    
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), "models/pathway_policy_v1.pth")
    print("Model saved to models/pathway_policy_v1.pth")

if __name__ == "__main__":
    train()
