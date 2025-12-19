import logging
import requests
import json
import random
from typing import Optional
from app.assessment.models.schemas import Question, Option
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OllamaGenerator:
    _instance = None
    _base_url = "http://localhost:11434/api/generate"
    _model = "llama3" 

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OllamaGenerator, cls).__new__(cls)
        return cls._instance

    def _check_connection(self) -> bool:
        """Checks if Ollama is accessible."""
        try:
            # Simple check to see if we can reach the tags endpoint or just a fast generation
            # Tags endpoint: http://localhost:11434/api/tags
            res = requests.get("http://localhost:11434/api/tags", timeout=2)
            if res.status_code == 200:
                return True
        except Exception:
            pass
        return False

    def generate_question(self, topic: str, difficulty: float) -> Optional[Question]:
        """
        Generates a multiple-choice question using local Ollama instance.
        """
        # 1. Connection Check (Fast fail fallback)
        if not self._check_connection():
            logger.warning("Ollama not reachable. Using fallback.")
            return self._fallback_question(topic, difficulty, "Ollama connection failed")

        difficulty_str = "easy" if difficulty < 0.4 else "medium" if difficulty < 0.7 else "hard"
        
        # Prompt designed for JSON output
        prompt = (
            f"You are an assessment expert. Generate a {difficulty_str} multiple-choice question about '{topic}'. "
            f"Return ONLY valid JSON with this exact structure, no markdown, no other text:\n"
            f'{{"text": "Actual question text here", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_index": 0}}\n'
            f"Make sure options are plausible. correct_index must be 0, 1, 2, or 3."
        )

        payload = {
            "model": self._model,
            "prompt": prompt,
            "stream": False,
            "format": "json" # Force JSON mode if model supports it
        }

        try:
            response = requests.post(self._base_url, json=payload, timeout=30)
            if response.status_code != 200:
                logger.error(f"Ollama API Error: {response.status_code} - {response.text}")
                return self._fallback_question(topic, difficulty, "API Error")
            
            data = response.json()
            generated_text = data.get("response", "")
            logger.info(f"Ollama Generated: {generated_text}")
            
            # Parse JSON
            try:
                q_data = json.loads(generated_text)
                
                # Sanity Check
                if "text" not in q_data or "options" not in q_data or "correct_index" not in q_data:
                    raise ValueError("Missing fields in JSON")
                
                if not isinstance(q_data["options"], list) or len(q_data["options"]) < 2:
                    raise ValueError("Invalid options list")

                options = []
                # Create option objects
                for txt in q_data["options"]:
                    options.append(Option(text=str(txt)))
                
                correct_idx = int(q_data["correct_index"])
                if correct_idx < 0 or correct_idx >= len(options):
                    correct_idx = 0 # Default if out of bounds

                return Question(
                    text=q_data["text"],
                    options=options,
                    correct_option_id=options[correct_idx].id,
                    difficulty=difficulty,
                    topic=topic
                )

            except json.JSONDecodeError:
                logger.error("Failed to parse JSON from Ollama")
                return self._fallback_question(topic, difficulty, "JSON Parse Error")
            except Exception as e:
                logger.error(f"Logic Error: {e}")
                return self._fallback_question(topic, difficulty, "Validation Error")

        except Exception as e:
            logger.error(f"Ollama Request Failed: {e}")
            return self._fallback_question(topic, difficulty, str(e))

    def _fallback_question(self, topic: str, difficulty: float, reason: str = "") -> Question:
        """
        Fallback generator.
        """
        print(f"Fallback triggered due to: {reason}")
        question_text = f"What is a key concept in {topic}? (Difficulty: {difficulty:.1f}) [Fallback due to: {reason}]"
        options = [
            Option(text=f"Concept A related to {topic}"),
            Option(text=f"Concept B related to {topic}"),
            Option(text=f"Concept C related to {topic}"),
            Option(text=f"Concept D related to {topic}"),
        ]
        correct_index = random.randint(0, 3)
        return Question(
            text=question_text,
            options=options,
            correct_option_id=options[correct_index].id,
            difficulty=difficulty,
            topic=topic
        )

# Export singleton
ollama_generator = OllamaGenerator()
