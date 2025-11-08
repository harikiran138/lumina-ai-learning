"""
Tests for Assessment System
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from services.assessment_generator import AssessmentGenerator
from services.auto_grader import AutoGrader
from services.llm_service import LLMService


class TestAssessmentGenerator:
    """Test cases for assessment generation."""

    @pytest.fixture
    def generator(self):
        """Create assessment generator instance."""
        return AssessmentGenerator()

    @pytest.mark.asyncio
    async def test_generate_mcq_questions_success(self, generator):
        """Test successful MCQ generation."""
        with patch.object(generator.llm_service, 'generate_response', new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = '''[
                {
                    "question": "What is Python?",
                    "options": ["A programming language", "A snake", "A database", "A web browser"],
                    "correct_answer": "A",
                    "explanation": "Python is a high-level programming language."
                }
            ]'''

            questions = await generator.generate_mcq_questions(
                course_id="cs101",
                topic="Python Basics",
                num_questions=1,
                difficulty="easy"
            )

            assert len(questions) == 1
            assert questions[0]["question"] == "What is Python?"
            assert len(questions[0]["options"]) == 4
            assert questions[0]["correct_answer"] == "A"
            mock_generate.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_mcq_questions_failure(self, generator):
        """Test MCQ generation failure handling."""
        with patch.object(generator.llm_service, 'generate_response', new_callable=AsyncMock) as mock_generate:
            mock_generate.side_effect = Exception("LLM Error")

            questions = await generator.generate_mcq_questions(
                course_id="cs101",
                topic="Python Basics",
                num_questions=1,
                difficulty="easy"
            )

            assert questions == []

    @pytest.mark.asyncio
    async def test_generate_short_answer_questions_success(self, generator):
        """Test successful short answer generation."""
        with patch.object(generator.llm_service, 'generate_response', new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = '''[
                {
                    "question": "Explain what a variable is in programming.",
                    "expected_length": "2-3 sentences",
                    "key_points": ["storage", "data", "memory"],
                    "sample_answer": "A variable is a storage location in memory that holds data."
                }
            ]'''

            questions = await generator.generate_short_answer_questions(
                course_id="cs101",
                topic="Variables",
                num_questions=1,
                difficulty="medium"
            )

            assert len(questions) == 1
            assert "variable" in questions[0]["question"].lower()
            assert questions[0]["expected_length"] == "2-3 sentences"
            mock_generate.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_assessment_mixed(self, generator):
        """Test complete assessment generation with mixed questions."""
        with patch.object(generator, 'generate_mcq_questions', new_callable=AsyncMock) as mock_mcq, \
             patch.object(generator, 'generate_short_answer_questions', new_callable=AsyncMock) as mock_sa:

            mock_mcq.return_value = [{"question": "MCQ 1", "options": ["A", "B"], "correct_answer": "A"}]
            mock_sa.return_value = [{"question": "SA 1", "expected_length": "2 sentences"}]

            assessment = await generator.generate_assessment(
                course_id="cs101",
                assessment_type="mixed",
                num_questions=2,
                difficulty="medium"
            )

            assert assessment["course_id"] == "cs101"
            assert assessment["assessment_type"] == "mixed"
            assert len(assessment["mcq_questions"]) == 1
            assert len(assessment["short_answer_questions"]) == 1
            assert assessment["total_questions"] == 2


class TestAutoGrader:
    """Test cases for auto-grading functionality."""

    @pytest.fixture
    def grader(self):
        """Create auto-grader instance."""
        return AutoGrader()

    @pytest.mark.asyncio
    async def test_grade_mcq_correct(self, grader):
        """Test grading correct MCQ answer."""
        question = {
            "id": "q1",
            "correct_answer": "A",
            "explanation": "Correct explanation"
        }

        result = await grader.grade_mcq(question, "A")

        assert result["score"] == 1.0
        assert result["feedback"] == "Correct!"
        assert result["correct_answer"] == "A"

    @pytest.mark.asyncio
    async def test_grade_mcq_incorrect(self, grader):
        """Test grading incorrect MCQ answer."""
        question = {
            "id": "q1",
            "correct_answer": "A",
            "explanation": "Correct explanation"
        }

        result = await grader.grade_mcq(question, "B")

        assert result["score"] == 0.0
        assert "Incorrect" in result["feedback"]
        assert result["correct_answer"] == "A"

    @pytest.mark.asyncio
    async def test_grade_short_answer_success(self, grader):
        """Test successful short answer grading."""
        question = {
            "id": "q1",
            "question": "What is a variable?",
            "key_points": ["storage", "data"],
            "sample_answer": "A variable stores data."
        }

        with patch.object(grader.llm_service, 'generate_response', new_callable=AsyncMock) as mock_generate:
            mock_generate.return_value = '''{
                "overall_score": 8.5,
                "max_score": 10,
                "criteria_scores": [
                    {"criterion": "Relevance", "score": 8.0, "feedback": "Good relevance"},
                    {"criterion": "Accuracy", "score": 9.0, "feedback": "Accurate information"}
                ],
                "general_feedback": "Well done!"
            }'''

            result = await grader.grade_short_answer(question, "A variable is a storage location for data.")

            assert result["score"] == 8.5
            assert result["max_score"] == 10
            assert result["percentage"] == 85.0
            assert result["feedback"] == "Well done!"
            assert len(result["detailed_breakdown"]) == 2

    @pytest.mark.asyncio
    async def test_grade_short_answer_failure(self, grader):
        """Test short answer grading failure handling."""
        question = {"id": "q1", "question": "What is a variable?"}

        with patch.object(grader.llm_service, 'generate_response', new_callable=AsyncMock) as mock_generate:
            mock_generate.side_effect = Exception("LLM Error")

            result = await grader.grade_short_answer(question, "Some answer")

            assert result["score"] == 0
            assert result["max_score"] == 10
            assert result["percentage"] == 0
            assert "technical error" in result["feedback"].lower()

    @pytest.mark.asyncio
    async def test_grade_assessment_complete(self, grader):
        """Test grading complete assessment."""
        assessment = {
            "id": "assess_1",
            "student_id": "student_1",
            "mcq_questions": [
                {"id": "mcq1", "correct_answer": "A"}
            ],
            "short_answer_questions": [
                {"id": "sa1", "question": "Explain variables"}
            ]
        }

        student_answers = {
            "mcq1": "A",
            "sa1": "Variables store data."
        }

        with patch.object(grader, 'grade_mcq', new_callable=AsyncMock) as mock_mcq, \
             patch.object(grader, 'grade_short_answer', new_callable=AsyncMock) as mock_sa:

            mock_mcq.return_value = {"score": 1.0, "max_score": 1}
            mock_sa.return_value = {"score": 8.0, "max_score": 10, "percentage": 80.0}

            result = await grader.grade_assessment(assessment, student_answers)

            assert result["total_score"] == 9.0
            assert result["total_max_score"] == 11
            assert result["percentage"] == pytest.approx(81.82, rel=1e-2)
            assert len(result["grades"]) == 2
            assert len(result["recommendations"]) > 0

    def test_generate_recommendations_high_score(self, grader):
        """Test recommendations for high scores."""
        grades = [{"percentage": 90}]
        recommendations = grader._generate_recommendations(90, grades)

        assert any("Great job" in rec for rec in recommendations)

    def test_generate_recommendations_low_score(self, grader):
        """Test recommendations for low scores."""
        grades = [{"percentage": 50}]
        recommendations = grader._generate_recommendations(50, grades)

        assert any("Review fundamental concepts" in rec for rec in recommendations)


class TestLLMService:
    """Test cases for LLM service."""

    @pytest.fixture
    def llm_service(self):
        """Create LLM service instance."""
        return LLMService()

    @pytest.mark.asyncio
    async def test_generate_response_async(self, llm_service):
        """Test async response generation."""
        with patch.object(llm_service, 'generate', return_value="Test response") as mock_generate:
            result = await llm_service.generate_response("Test prompt")

            assert result == "Test response"
            mock_generate.assert_called_once_with("Test prompt", {})

    def test_generate_sync(self, llm_service):
        """Test synchronous generation."""
        with patch.object(llm_service.client, 'generate') as mock_generate:
            mock_generate.return_value = {"response": "Sync response"}

            result = llm_service.generate("Test prompt")

            assert result == "Sync response"
            mock_generate.assert_called_once()

    def test_chat_completion(self, llm_service):
        """Test chat completion."""
        with patch.object(llm_service.client, 'chat') as mock_chat:
            mock_chat.return_value = {"message": {"content": "Chat response"}}

            result = llm_service.chat([{"role": "user", "content": "Hello"}])

            assert result == "Chat response"
            mock_chat.assert_called_once()
