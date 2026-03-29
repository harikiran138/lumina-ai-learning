from difflib import SequenceMatcher


class GraderService:
    def __init__(self):
        self.device = "cpu"
        self.model = None
        self._util = None

    def _load_model(self):
        if self.model:
            return

        try:
            import torch
            from sentence_transformers import SentenceTransformer, util

            if torch.backends.mps.is_available():
                self.device = "mps"
            elif torch.cuda.is_available():
                self.device = "cuda"
            else:
                self.device = "cpu"

            print(f"Loading Grading model on {self.device}...")
            self.model = SentenceTransformer("all-MiniLM-L6-v2", device=self.device)
            self._util = util
            print("Grading model loaded successfully.")
        except Exception as e:
            print(f"Failed to load Grading model: {e}")
            self.model = None
            self._util = None

    def _fallback_similarity(self, student_text: str, expected_text: str) -> float:
        return SequenceMatcher(None, student_text.strip().lower(), expected_text.strip().lower()).ratio()

    def grade_submission(self, student_text: str, expected_text: str) -> dict:
        self._load_model()

        if not student_text or not expected_text:
            return {"score": 0, "feedback": "Missing content to evaluate."}

        if self.model and self._util:
            embeddings1 = self.model.encode(student_text, convert_to_tensor=True)
            embeddings2 = self.model.encode(expected_text, convert_to_tensor=True)
            cosine_score = self._util.cos_sim(embeddings1, embeddings2).item()
        else:
            cosine_score = self._fallback_similarity(student_text, expected_text)

        # Normalize score (0 to 1 -> 0 to 100)
        final_score = round(max(0, cosine_score) * 100)

        # Generate generic feedback based on score
        if final_score >= 90:
            feedback = (
                "Excellent work! Your submission demonstrates a deep understanding of the concepts."
            )
        elif final_score >= 75:
            feedback = "Good job. You captured the main ideas, but there's room for more detail."
        elif final_score >= 50:
            feedback = (
                "Satisfactory. You touched on some key points but missed significant details."
            )
        else:
            feedback = "Needs improvement. Your submission does not seem to align well with the assignment requirements."

        return {
            "score": final_score,
            "feedback": feedback,
            "details": f"Semantic match: {round(cosine_score, 2)}",
        }


# Singleton instance
grader_service = GraderService()
