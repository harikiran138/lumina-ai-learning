"""
LLM service using Ollama
"""

import ollama
import asyncio
from typing import Dict, Any
from config import settings


class LLMService:
    def __init__(self):
        self.client = ollama.Client(host=settings.OLLAMA_BASE_URL)
        self.model = settings.OLLAMA_MODEL

    def generate(self, prompt: str, **kwargs) -> str:
        """Generate text from prompt"""
        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            **kwargs
        )
        return response['response']

    async def generate_response(self, prompt: str, **kwargs) -> str:
        """Async generate response"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate, prompt, kwargs)

    def chat(self, messages: list, **kwargs) -> str:
        """Chat completion"""
        response = self.client.chat(
            model=self.model,
            messages=messages,
            **kwargs
        )
        return response['message']['content']

    def generate_pathway(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate learning pathway"""
        # In a real implementation, parse JSON response
        # For now, return mock data
        return {
            "pathway": [
                {
                    "course_id": "cs_101",
                    "lessons": ["lesson_1", "lesson_2"],
                    "estimated_time": "2 weeks"
                }
            ],
            "recommendations": ["Start with basics", "Practice daily"]
        }

    def generate_assessment(self, course_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate assessment questions"""
        # Mock response
        if course_data['assessment_type'] == 'mcq':
            questions = [
                {
                    "question": "What is a variable?",
                    "options": ["Storage", "Function", "Loop", "Class"],
                    "correct_answer": 0,
                    "explanation": "Variables store data"
                }
            ]
        else:
            questions = [
                {
                    "question": "Explain inheritance",
                    "expected_keywords": ["extends", "parent"],
                    "rubric": ["Clear explanation", "Examples"]
                }
            ]

        return {
            "questions": questions,
            "difficulty": course_data['difficulty'],
            "generated_at": "now"
        }

    def adaptive_learning(self, performance_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate adaptive learning suggestions"""
        # Mock
        return {
            "suggestions": [
                {
                    "type": "remediation",
                    "topic": "variables",
                    "reason": "Low quiz score",
                    "resources": ["video.mp4", "exercises.pdf"]
                }
            ],
            "predicted_performance": 0.85
        }


# Global instance
llm_service = LLMService()
