import logging
import json
import random
import requests
from typing import Optional
from app.assessment.models.schemas import Question, Option
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GeminiGenerator:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeminiGenerator, cls).__new__(cls)
            if not settings.ASSESSMENT_API_KEY:
                logger.warning("No ASSESSMENT_API_KEY provided. GeminiGenerator will fail.")
        return cls._instance

    def __init__(self):
        self.model_name = "gemini-1.5-flash"
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    def generate_question(self, topic: str, difficulty: float) -> Optional[Question]:
        """
        Generates a multiple-choice question using Google Gemini REST API.
        """
        difficulty_str = "easy" if difficulty < 0.4 else "medium" if difficulty < 0.7 else "hard"

        # Prompt designed for JSON output
        prompt_text = (
            f"You are an assessment expert. Generate a {difficulty_str} multiple-choice question about '{topic}'. "
            f"Return ONLY valid JSON with this exact structure, no markdown, no other text:\n"
            f'{{"text": "Actual question text here", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_index": 0, "explanation": "Brief explanation of why the correct answer is right and others are wrong."}}\n'
            f"Make sure options are plausible. correct_index must be 0, 1, 2, or 3."
        )

        headers = {"Content-Type": "application/json"}
        params = {"key": settings.ASSESSMENT_API_KEY}
        payload = {
            "contents": [{"parts": [{"text": prompt_text}]}],
            "generationConfig": {"temperature": 0.7, "responseMimeType": "application/json"},
        }

        try:
            response = requests.post(
                self.api_url, params=params, headers=headers, json=payload, timeout=30
            )

            if response.status_code != 200:
                logger.error(f"Gemini API Error: {response.status_code} - {response.text}")
                return self._fallback_question(
                    topic, difficulty, f"API Error {response.status_code}"
                )

            result = response.json()
            # Extract text from response structure
            # { "candidates": [ { "content": { "parts": [ { "text": "..." } ] } } ] }
            try:
                generated_text = result["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError):
                logger.error(f"Unexpected response format: {result}")
                return self._fallback_question(topic, difficulty, "Response Format Error")

            # Clean up markdown
            if generated_text.startswith("```json"):
                generated_text = generated_text[7:]
            if generated_text.startswith("```"):
                generated_text = generated_text[3:]
            if generated_text.endswith("```"):
                generated_text = generated_text[:-3]

            generated_text = generated_text.strip()
            logger.info(f"Gemini Generated: {generated_text}")

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
                    correct_idx = 0  # Default if out of bounds

                return Question(
                    text=q_data["text"],
                    options=options,
                    correct_option_id=options[correct_idx].id,
                    explanation=q_data.get("explanation"),
                    difficulty=difficulty,
                    topic=topic,
                )

            except json.JSONDecodeError:
                logger.error("Failed to parse JSON from Gemini")
                return self._fallback_question(topic, difficulty, "JSON Parse Error")
            except Exception as e:
                logger.error(f"Logic Error: {e}")
                return self._fallback_question(topic, difficulty, "Validation Error")

        except Exception as e:
            logger.error(f"Gemini Request Failed: {e}")
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
        import secrets

        correct_index = secrets.randbelow(4)
        return Question(
            text=question_text,
            options=options,
            correct_option_id=options[correct_index].id,
            difficulty=difficulty,
            topic=topic,
        )


# Export singleton
gemini_generator = GeminiGenerator()
