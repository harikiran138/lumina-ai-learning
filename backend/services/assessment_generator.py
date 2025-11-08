"""
Auto-assessment Generator Module for Lumina LMS
Generates MCQs and short-answer questions using local LLM
"""

import logging
from typing import List, Dict, Any
from .llm_service import LLMService

logger = logging.getLogger(__name__)

class AssessmentGenerator:
    """Handles automatic generation of assessments using LLM"""

    def __init__(self):
        self.llm_service = LLMService()

    async def generate_mcq_questions(
        self,
        course_id: str,
        lesson_id: str = None,
        topic: str = "",
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict[str, Any]]:
        """Generate multiple choice questions"""

        prompt = f"""
        Generate {num_questions} multiple choice questions for the topic: {topic}
        Difficulty level: {difficulty}
        Course: {course_id}
        Lesson: {lesson_id if lesson_id else 'General'}

        Each question should have:
        - A clear question
        - 4 options (A, B, C, D)
        - The correct answer
        - A brief explanation

        Format as JSON array of objects with keys: question, options, correct_answer, explanation
        """

        try:
            response = await self.llm_service.generate_response(prompt)
            # Parse JSON response
            import json
            questions = json.loads(response)
            return questions
        except Exception as e:
            logger.error(f"MCQ generation failed: {str(e)}")
            return []

    async def generate_short_answer_questions(
        self,
        course_id: str,
        lesson_id: str = None,
        topic: str = "",
        num_questions: int = 3,
        difficulty: str = "medium"
    ) -> List[Dict[str, Any]]:
        """Generate short answer questions"""

        prompt = f"""
        Generate {num_questions} short answer questions for the topic: {topic}
        Difficulty level: {difficulty}
        Course: {course_id}
        Lesson: {lesson_id if lesson_id else 'General'}

        Each question should have:
        - A clear question
        - Expected answer length (1-3 sentences)
        - Key points to cover
        - Sample answer

        Format as JSON array of objects with keys: question, expected_length, key_points, sample_answer
        """

        try:
            response = await self.llm_service.generate_response(prompt)
            import json
            questions = json.loads(response)
            return questions
        except Exception as e:
            logger.error(f"Short answer generation failed: {str(e)}")
            return []

    async def generate_assessment(
        self,
        course_id: str,
        lesson_id: str = None,
        assessment_type: str = "mixed",
        num_questions: int = 10,
        difficulty: str = "medium"
    ) -> Dict[str, Any]:
        """Generate complete assessment"""

        mcq_count = num_questions // 2 if assessment_type == "mixed" else (num_questions if assessment_type == "mcq" else 0)
        sa_count = num_questions - mcq_count

        mcqs = []
        if mcq_count > 0:
            mcqs = await self.generate_mcq_questions(course_id, lesson_id, "", mcq_count, difficulty)

        short_answers = []
        if sa_count > 0:
            short_answers = await self.generate_short_answer_questions(course_id, lesson_id, "", sa_count, difficulty)

        return {
            "course_id": course_id,
            "lesson_id": lesson_id,
            "assessment_type": assessment_type,
            "difficulty": difficulty,
            "mcq_questions": mcqs,
            "short_answer_questions": short_answers,
            "total_questions": len(mcqs) + len(short_answers)
        }
