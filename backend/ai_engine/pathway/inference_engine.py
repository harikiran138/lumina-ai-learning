import torch
import os
from .models.model_v2 import TKTModel

class PathwayInferenceEngine:
    def __init__(self, model_path="models/tkt_v1.pt", num_skills=20):
        self.device = torch.device("cpu") # Inference on CPU usually fine for this scale
        self.max_len = 50
        
        self.model = TKTModel(num_skills=num_skills, max_len=self.max_len)
        if os.path.exists(model_path):
            state = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state)
            print(f"Inference Engine loaded model from {model_path}")
        else:
            print(f"WARNING: Model not found at {model_path}. Using initialized weights (random).")
            
        self.model.to(self.device)
        self.model.eval()
        
    def predict_mastery(self, skill_seq, correct_seq):
        """
        Returns the probability of correctness for the NEXT item.
        skill_seq: list of ints [s1, s2...]
        correct_seq: list of ints [0, 1...]
        """
        if len(skill_seq) == 0:
            return 0.5 # Cold start
            
        inputs_s = torch.tensor([skill_seq[-self.max_len:]], dtype=torch.long).to(self.device)
        inputs_c = torch.tensor([correct_seq[-self.max_len:]], dtype=torch.long).to(self.device)
        
        with torch.no_grad():
            # Model returns [1, T] probs
            probs = self.model(inputs_s, inputs_c)
            
        # The last value is the prediction for the current state (or next, depending on training).
        return probs[0, -1].item()

    def get_learner_state_vector(self, skill_seq, correct_seq):
        """
        Returns the latent state vector from the transformer.
        (For passing to Gemini as embedding context if needed)
        """
        return "Latent Vector Extraction Not Implemented (Requires hook)"
