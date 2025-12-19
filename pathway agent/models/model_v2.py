import torch
import torch.nn as nn
import math

class TKTModel(nn.Module):
    """
    Transformer-based Knowledge Tracing Model.
    Predicts probability of correctness for the NEXT interaction.
    Input: Sequence of (Skill, Correctness) pairs.
    Output: Probability current skill is mastered (or will be answered correctly).
    """
    def __init__(self, num_skills, d_model=128, nhead=4, num_layers=2, max_len=50, dropout=0.1):
        super(TKTModel, self).__init__()
        self.d_model = d_model
        self.max_len = max_len
        
        # Embeddings
        # Skill ID embedding
        self.skill_embedding = nn.Embedding(num_skills + 1, d_model) # +1 for padding
        
        # Interaction embedding (Skill + Outcome)
        # We model input as: Embedding(Skill) + Embedding(Outcome)
        # Outcome is 0 (wrong), 1 (correct), 2 (padding)
        self.outcome_embedding = nn.Embedding(3, d_model)
        
        # Positional embedding
        self.pos_encoder = nn.Parameter(torch.zeros(1, max_len, d_model))
        
        # Transformer
        encoder_layers = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward=256, dropout=dropout, batch_first=True)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layers, num_layers)
        
        # Prediction Body
        self.fc_out = nn.Linear(d_model, 1)
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, skills, correct, mask=None):
        """
        skills: [BS, T]
        correct: [BS, T] (0 or 1)
        mask: [BS, T] (1 for valid, 0 for pad)
        """
        batch_size, seq_len = skills.size()
        
        # Input Embedding: Combine Skill + Outcome
        # Ideally, to predict Time T, we use history 0...T-1.
        # Here we train using Causal Masking.
        
        k_emb = self.skill_embedding(skills) # [BS, T, D]
        o_emb = self.outcome_embedding(correct) # [BS, T, D] (Correctness of CURRENT step)
        
        # Note: In standard DKT/SASRec, we predict y_{t+1} given x_{0...t}.
        # For simplicity, we assume the input sequence is the HISTORY.
        
        x = k_emb + o_emb
        x = x + self.pos_encoder[:, :seq_len, :]
        
        # Causal Mask (prevent looking ahead)
        src_mask = torch.triu(torch.ones(seq_len, seq_len) * float('-inf'), diagonal=1).to(skills.device)
        
        # Forward Pass
        # Pass src_key_padding_mask if dealing with pads
        pad_mask = (mask == 0) if mask is not None else None
        
        output = self.transformer_encoder(x, mask=src_mask, src_key_padding_mask=pad_mask)
        
        # Prediction
        logits = self.fc_out(output) # [BS, T, 1]
        probs = self.sigmoid(logits)
        
        return probs.squeeze(-1)
