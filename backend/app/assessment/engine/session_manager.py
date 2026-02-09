from typing import Optional
from app.assessment.models.schemas import (
    AssessmentSession,
    StudentResponse,
    Question,
    MasteryState,
)

# Switch to Gemini Generator
from app.assessment.llm.gemini_generator import gemini_generator as question_generator
from app.assessment.engine.adaptive_logic import adaptive_logic
from app.database.manager import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SessionManager:
    def __init__(self):
        self.in_memory_sessions = {}

    @property
    def sessions_collection(self):
        return db.get_collection("assessment_sessions")

    async def create_session(
        self, student_id: str, topic: str, initial_difficulty: float = 0.5, num_questions: int = 5
    ) -> AssessmentSession:
        """Creates a new assessment session."""
        session = AssessmentSession(
            student_id=student_id,
            topic=topic,
            current_difficulty=initial_difficulty,
            total_questions=num_questions,
            mastery_state=MasteryState(student_id=student_id),
            seen_question_ids=[],
        )

        collection = self.sessions_collection
        if collection is not None:
            await collection.insert_one(session.model_dump())
        else:
            logger.warning("Database not connected. Session persisted in memory only.")
            self.in_memory_sessions[session.id] = session

        return session

    async def get_session(self, session_id: str) -> Optional[AssessmentSession]:
        """Retrieves a session by ID."""
        collection = self.sessions_collection
        if collection is None:
            return self.in_memory_sessions.get(session_id)

        data = await collection.find_one({"id": session_id})
        if data:
            return AssessmentSession(**data)
        return None

    async def save_session(self, session: AssessmentSession):
        """Helper to save session state."""
        collection = self.sessions_collection
        if collection is not None:
            await collection.replace_one({"id": session.id}, session.model_dump())
        else:
            self.in_memory_sessions[session.id] = session

    async def get_next_question(self, session_id: str) -> Optional[Question]:
        """Generates the next question for the session and persists it."""
        session = await self.get_session(session_id)
        if not session or session.is_completed:
            return None

        question = await question_generator.generate_question(
            topic=session.topic, difficulty=session.current_difficulty
        )

        if question:
            # Append to history and save
            session.question_history.append(question)
            await self.save_session(session)

        return question

    async def submit_answer(
        self,
        session_id: str,
        question_id: str,
        selected_option_id: str,
        is_correct: bool = None,
        time_taken: float = None,
    ) -> AssessmentSession:
        """Processes a submitted answer and updates the session."""
        session = await self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        # Server-side validation
        question = next((q for q in session.question_history if q.id == question_id), None)

        calculated_is_correct = False
        if question:
            calculated_is_correct = question.correct_option_id == selected_option_id
        else:
            if is_correct is not None:
                calculated_is_correct = is_correct

        # Update difficulty
        new_difficulty = adaptive_logic.calculate_next_difficulty(
            session.current_difficulty, calculated_is_correct
        )

        # Record response
        response = StudentResponse(
            question_id=question_id,
            selected_option_id=selected_option_id,
            is_correct=calculated_is_correct,
            time_taken_seconds=time_taken,
        )

        # Update session object
        session.responses.append(response)
        session.current_difficulty = new_difficulty

        # Check completion
        if len(session.responses) >= session.total_questions:
            session.is_completed = True
            session.end_time = datetime.utcnow()
            session.final_score = adaptive_logic.calculate_final_score(session.current_difficulty)

        # Persist changes
        await self.save_session(session)

        return session

    async def complete_session(self, session_id: str) -> AssessmentSession:
        """Manually completes a session."""
        session = await self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        if not session.is_completed:
            session.is_completed = True
            session.end_time = datetime.utcnow()
            session.final_score = adaptive_logic.calculate_final_score(session.current_difficulty)
            await self.save_session(session)

        return session


session_manager = SessionManager()
