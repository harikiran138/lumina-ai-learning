import torch
import torch.nn as nn
import torch.optim as optim
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.ingest_data import load_kt_data
from models.model_v2 import TKTModel
from torch.utils.data import DataLoader

def train_model():
    # 1. Load Data
    print("Loading data...")
    # Passing num_skills=20 for testing synthetic data
    dataset = load_kt_data(num_skills=20) 
    dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    # 2. Init Model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on {device}")
    
    model = TKTModel(num_skills=20, max_len=50).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.BCELoss()
    
    # 3. Training Loop
    epochs = 5
    model.train()
    
    for epoch in range(epochs):
        total_loss = 0
        steps = 0
        for batch in dataloader:
            skills = batch['skills'].to(device)
            correct = batch['correct'].to(device)
            mask = batch['mask'].to(device)
            
            optimizer.zero_grad()
            
            # Forward
            # Target is the NEXT token correct probability.
            # In BERT style MLM or causal, we basically predict correct[t] given inputs up to t.
            # However, our model simply outputs [BS, T].
            preds = model(skills, correct, mask)
            
            # Loss masking: We only care about predicting valid tokens.
            # And usually in DKT we try to predict the *next* response.
            # For simplicity in this demo v2, we treat the sequence as auto-regressive 
            # and train to reconstruct the correctness sequence (state estimation).
            
            loss = criterion(preds * mask, correct.float() * mask)
            
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            steps += 1
            
        print(f"Epoch {epoch+1}/{epochs} - Loss: {total_loss/steps:.4f}")
        
    # 4. Save
    os.makedirs("models", exist_ok=True)
    save_path = "models/tkt_v1.pt"
    torch.save(model.state_dict(), save_path)
    print(f"Model saved to {save_path}")

if __name__ == "__main__":
    train_model()
