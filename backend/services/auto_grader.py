"""
Auto-grading Module for Lumina LMS
Implements rubric-based scoring using local LLM
"""

import logging
from typing import Dict, Any, List
from .llm_service import LLMService

logger = logging.getLogger(__name__)

class AutoGrader:
    """Handles automatic grading of student responses"""

    def __init__(self):
        self.llm_service = LLMService()

    async def grade_mcq(
        self,
        question: Dict[str, Any],
        student_answer: str
    ) -> Dict[str, Any]:
        """Grade multiple choice question"""
        correct_answer = question.get('correct_answer', '')
        score = 1.0 if student_answer.upper() == correct_answer.upper() else 0.0
        feedback = "Correct!" if score == 1.0 else f"Incorrect. The correct answer is {correct_answer}."
        
        return {
            "question_id": question.get('id', ''),
            "type": "mcq",
            "student_answer": student_answer,
            "correct_answer": correct_answer,
            "score": score,
            "feedback": feedback,
            "explanation": question.get('explanation', '')
        }

    async def grade_short_answer(
        self,
        question: Dict[str, Any],
        student_response: str,
        rubric: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Grade short answer using LLM with rubric"""
        
        if not rubric:
            rubric = {
                "criteria": [
                    {"name": "Relevance", "weight": 0.4, "description": "Answer addresses the question directly"},
                    {"name": "Accuracy", "weight": 0.4, "description": "Information is correct and complete"},
                    {"name": "Clarity", "weight": 0.2, "description": "Response is well-written and organized"}
                ],
                "max_score": 10
            }

        prompt = f"""
        Grade the following short answer response based on the rubric.

        Question: {question.get('question', '')}
        Key Points: {question.get('key_points', [])}
        Sample Answer: {question.get('sample_answer', '')}

        Student Response: {student_response}

        Rubric:
        {rubric}

        Provide a score out of {rubric['max_score']} and detailed feedback for each criterion.
        Format as JSON:
        {{
            "overall_score": float,
            "max_score": {rubric['max_score']},
            "criteria_scores": [
                {{"criterion": "name", "score": float, "feedback": "text"}}
            ],
            "general_feedback": "text"
        }}
        """

        try:
            response = await self.llm_service.generate_response(prompt)
            import json
            grading_result = json.loads(response)
            return {
                "question_id": question.get('id', ''),
                "type": "short_answer",
                "student_response": student_response,
                "score": grading_result.get('overall_score', 0),
                "max_score": grading_result.get('max_score', 10),
                "percentage": (grading_result.get('overall_score', 0) / grading_result.get('max_score', 10)) * 100,
                "feedback": grading_result.get('general_feedback', ''),
                "detailed_breakdown": grading_result.get('criteria_scores', [])
            }
        except Exception as e:
            logger.error(f"Short answer grading failed: {str(e)}")
            return {
                "question_id": question.get('id', ''),
                "type": "short_answer",
                "student_response": student_response,
                "score": 0,
                "max_score": 10,
                "percentage": 0,
                "feedback": "Grading failed due to technical error. Please review manually.",
                "detailed_breakdown": []
            }

    async def grade_assessment(
        self,
        assessment: Dict[str, Any],
        student_answers: Dict[str, str]
    ) -> Dict[str, Any]:
        """Grade complete assessment"""
        
        total_score = 0
        total_max_score = 0
        grades = []

        # Grade MCQs
        for mcq in assessment.get('mcq_questions', []):
            question_id = mcq.get('id', str(len(grades)))
            student_answer = student_answers.get(question_id, '')
            grade = await self.grade_mcq(mcq, student_answer)
            grades.append(grade)
            total_score += grade['score']
            total_max_score += 1  # MCQ is 1 point each

        # Grade Short Answers
        for sa in assessment.get('short_answer_questions', []):
            question_id = sa.get('id', str(len(grades)))
            student_response = student_answers.get(question_id, '')
            grade = await self.grade_short_answer(sa, student_response)
            grades.append(grade)
            total_score += grade['score']
            total_max_score += grade['max_score']

        overall_percentage = (total_score / total_max_score * 100) if total_max_score > 0 else 0

        return {
            "assessment_id": assessment.get('id', ''),
            "student_id": assessment.get('student_id', ''),
            "total_score": total_score,
            "total_max_score": total_max_score,
            "percentage": overall_percentage,
            "grades": grades,
            "recommendations": self._generate_recommendations(overall_percentage, grades)
        }

    def _generate_recommendations(self, percentage: float, grades: List[Dict]) -> List[str]:
        """Generate learning recommendations based on performance"""
        recommendations = []
        
        if percentage < 60:
            recommendations.append("Review fundamental concepts and complete additional practice exercises.")
        elif percentage < 80:
            recommendations.append("Focus on areas where you scored below 70% for targeted improvement.")
        else:
            recommendations.append("Great job! Consider advancing to more challenging material.")

        # Topic-specific recommendations
        weak_areas = [g for g in grades if g.get('percentage', 0) < 70]
        if weak_areas:
            topics = set([g.get('topic', 'General') for g in weak_areas])
            for topic in topics:
                recommendations.append(f"Strengthen understanding of {topic} through supplementary resources.")

        return recommendations
