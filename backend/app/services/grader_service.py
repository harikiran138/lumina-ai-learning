from sentence_transformers import SentenceTransformer, util
import torch

class GraderService:
    def __init__(self):
        # Detect device: MPS for Mac, CUDA for Nvidia, CPU fallback
        if torch.backends.mps.is_available():
            self.device = "mps"
            print("🚀 Grader Service: Using Apple MPS (Metal Performance Shaders) acceleration")
        elif torch.cuda.is_available():
            self.device = "cuda"
            print("🚀 Grader Service: Using CUDA acceleration")
        else:
            self.device = "cpu"
            print("⚠️ Grader Service: Using CPU for inference (slower)")
            
        self.model = None

    def _load_model(self):
        if self.model:
            return

        print(f"Loading Grading model on {self.device}...")
        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2', device=self.device)
            print("Grading model loaded successfully.")
        except Exception as e:
            print(f"Failed to load Grading model: {e}")
            self.model = None

    def grade_submission(self, student_text: str, expected_text: str) -> dict:
        self._load_model()
        if not self.model:
            return {"score": 0, "feedback": "Grading model not available."}
        
        if not student_text or not expected_text:
             return {"score": 0, "feedback": "Missing content to evaluate."}

        # Calculate semantic similarity
        embeddings1 = self.model.encode(student_text, convert_to_tensor=True)
        embeddings2 = self.model.encode(expected_text, convert_to_tensor=True)
        
        cosine_score = util.cos_sim(embeddings1, embeddings2).item()
        
        # Normalize score (0 to 1 -> 0 to 100)
        final_score = round(max(0, cosine_score) * 100)
        
        # Generate generic feedback based on score
        if final_score >= 90:
            feedback = "Excellent work! Your submission demonstrates a deep understanding of the concepts."
        elif final_score >= 75:
            feedback = "Good job. You captured the main ideas, but there's room for more detail."
        elif final_score >= 50:
            feedback = "Satisfactory. You touched on some key points but missed significant details."
        else:
            feedback = "Needs improvement. Your submission does not seem to align well with the assignment requirements."

        return {
            "score": final_score,
            "feedback": feedback,
            "details": f"Semantic match: {round(cosine_score, 2)}"
        }

# Singleton instance
grader_service = GraderService()
