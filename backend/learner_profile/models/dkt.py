import torch
import torch.nn as nn

class DKTModel(nn.Module):
    """
    LSTM-based Deep Knowledge Tracing
    Inputs: Sequence of (concept_id, is_correct) pairs
    Outputs: Mastery probability for the next concept
    """

    def __init__(self, num_concepts=100, hidden_size=64):
        super(DKTModel, self).__init__()
        self.num_concepts = num_concepts
        self.hidden_size = hidden_size
        
        # Embedding: concept_id * 2 (for correct/incorrect)
        self.embedding = nn.Embedding(num_concepts * 2, 64)
        self.lstm = nn.LSTM(64, hidden_size, batch_first=True)
        self.output = nn.Linear(hidden_size, num_concepts)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        """
        x: [batch, seq_len] where values are concept_id + (is_correct * num_concepts)
        """
        embeds = self.embedding(x)
        h, _ = self.lstm(embeds)
        out = self.output(h)
        return self.sigmoid(out)

    def predict_mastery(self, student_history: list) -> dict:
        """
        Predict mastery probability for concepts based on history.
        student_history: list of dicts {'concept_id': int, 'correct': bool}
        """
        if not student_history:
            return {i: 0.1 for i in range(self.num_concepts)}

        # Prepare sequence
        seq = []
        for x in student_history:
            val = x['concept_id'] + (self.num_concepts if x['correct'] else 0)
            seq.append(val)
        
        input_tensor = torch.LongTensor([seq])
        
        with torch.no_grad():
            preds = self.forward(input_tensor)
            # Get last prediction
            last_pred = preds[0, -1, :].tolist()
            
        return {i: prob for i, prob in enumerate(last_pred)}

    def predict_sequence(self, exercise_sequence: list) -> list:
        """Legacy method for backward compatibility"""
        # simplified return for now
        return [0.5] * len(exercise_sequence)
