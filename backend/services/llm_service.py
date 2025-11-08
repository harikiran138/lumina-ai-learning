"""
LLM service using Ollama
"""

import ollama
import asyncio
from typing import Dict, Any, Optional
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
        prompt = f"""
        Based on the following student information, generate a personalized learning pathway:

        Student ID: {student_data['student_id']}
        Current Skills: {', '.join(student_data['current_skills'])}
        Target Skills: {', '.join(student_data['target_skills'])}
        Learning Style: {student_data.get('learning_style', 'general')}

        Provide a structured pathway with courses, lessons, and estimated time.
        Format as JSON with keys: pathway (list of dicts with course_id, lessons, estimated_time), recommendations (list of strings)
        """

        response = self.generate(prompt)
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
        prompt = f"""
        Generate an assessment for the following course:

        Course: {course_data['course_id']}
        Type: {course_data['assessment_type']}
        Difficulty: {course_data['difficulty']}
        Number of questions: {course_data['num_questions']}

        For MCQ: Provide questions with 4 options and correct answer index.
        For short_answer: Provide questions with expected keywords and rubric.
        Format as JSON with keys: questions (list), difficulty, generated_at
        """

        response = self.generate(prompt)
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
        prompt = f"""
        Analyze student performance and provide adaptive suggestions:

        Student: {performance_data['student_id']}
        Performance: {performance_data['current_performance']}
        Recent Activities: {performance_data['recent_activities']}

        Suggest remediation or acceleration based on performance.
        Format as JSON with suggestions (list of dicts with type, topic, reason, resources), predicted_performance
        """

        response = self.generate(prompt)
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
