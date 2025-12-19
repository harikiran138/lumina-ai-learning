from sentence_transformers import SentenceTransformer, util
import torch

class QAScorer:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)

    def calculate_similarity(self, extracted_answer: str, key_answer: str) -> float:
        """
        Calculates semantic similarity between extracted text and key answer.
        Returns score between 0.0 and 1.0 (or higher if scaled).
        """
        if not extracted_answer or not key_answer:
            return 0.0

        # Compute embeddings
        embedding_1 = self.model.encode(extracted_answer, convert_to_tensor=True)
        embedding_2 = self.model.encode(key_answer, convert_to_tensor=True)

        # Compute cosine similarity
        cosine_score = util.pytorch_cos_sim(embedding_1, embedding_2)
        
        return cosine_score.item()

    def grade_submission(self, extracted_text: str, questions: list) -> dict:
        """
        Grades a submission. 
        Assuming questions list contains dicts with {'question': '...', 'answer_key': '...'}
        
        This simple version assumes `extracted_text` is the full blob and checks if answers appear.
        A smarter version would need to segment the text by question.
        
        For now, let's assume we extract answers per question via some heuristic/LLM.
        """
        # Placeholder for LLM extraction logic
        # extracted_answers = extract_answers_llm(extracted_text, [q['question'] for q in questions])
        
        # Mock extracted answers for demonstration
        results = []
        total_score = 0
        
        for q in questions:
            key = q.get('answer_key', '')
            # Heuristic: check if key works roughly match
            score = self.calculate_similarity(extracted_text, key) # Comparing full text to key is naive but runs
            results.append({
                "question": q.get('question'),
                "score": score,
                "feedback": "Good match" if score > 0.7 else "Review needed"
            })
            total_score += score
            
        return {
            "results": results,
            "average_score": total_score / len(questions) if questions else 0
        }
