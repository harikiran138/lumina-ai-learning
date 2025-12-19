import os
import torch
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
from learner_profile.models.behavior import BehaviorModel # Example integration
# Reusing logic from the project but encapsulating here
# In a real monorepo we'd share the lib, but here I'll re-implement the wrapper to be self-contained in backend

class QAScorer:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        # Lazy load to avoid overhead if not used
        self.model_name = model_name
        self.model = None

    def _load(self):
        if not self.model:
            from sentence_transformers import SentenceTransformer, util
            self.model = SentenceTransformer(self.model_name)
            self.util = util

    def calculate_similarity(self, extracted_answer: str, key_answer: str) -> float:
        self._load()
        if not extracted_answer or not key_answer:
            return 0.0
        embedding_1 = self.model.encode(extracted_answer, convert_to_tensor=True)
        embedding_2 = self.model.encode(key_answer, convert_to_tensor=True)
        cosine_score = self.util.pytorch_cos_sim(embedding_1, embedding_2)
        return cosine_score.item()

class HandwritingAgent:
    """
    Agent responsible for analyzing handwriting and grading answers.
    """
    def __init__(self):
        self.model_name = "microsoft/trocr-base-handwritten"
        self.processor = None
        self.model = None
        self.scorer = QAScorer()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def _load_model(self):
        if not self.model:
            print(f"HandwritingAgent loading {self.model_name}...")
            try:
                self.processor = TrOCRProcessor.from_pretrained(self.model_name)
                self.model = VisionEncoderDecoderModel.from_pretrained(self.model_name)
                self.model.to(self.device)
                self.model.eval()
            except Exception as e:
                print(f"HandwritingAgent Warning: Could not load model: {e}")

    def analyze(self, image_path: str, answer_key: str = None) -> dict:
        """
        Analyzes an image file. 
        """
        self._load_model()
        
        extracted_text = ""
        if self.model and self.processor:
            try:
                image = Image.open(image_path).convert("RGB")
                pixel_values = self.processor(image, return_tensors="pt").pixel_values.to(self.device)
                
                with torch.no_grad():
                    generated_ids = self.model.generate(pixel_values)
                    extracted_text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            except Exception as e:
                extracted_text = f"Error during extraction: {str(e)}"
        else:
            extracted_text = "Model unavailable (Mock Mode)"

        result = {
            "extracted_text": extracted_text,
            "score": None,
            "feedback": "Analysis Complete"
        }
        
        if answer_key:
            score = self.scorer.calculate_similarity(extracted_text, answer_key)
            result["score"] = score
            result["feedback"] = f"Alignment: {score:.2f}"
            
        return result
