from typing import Optional
from app.assessment.models.schemas import (
    AssessmentSession,
    StudentResponse,
    Question,
    AssessmentResult,
    MasteryState,
)

# Switch to Gemini Generator
from app.assessment.llm.gemini_generator import gemini_generator as question_generator
from app.assessment.engine.adaptive_logic import adaptive_logic
from app.store.database import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SessionManager:
    def __init__(self):
        self.db = db.get_db()
        self.sessions_collection = self.db["assessment_sessions"] if self.db is not None else None
        self.in_memory_sessions = {}

    def create_session(
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
        if self.sessions_collection is not None:
            self.sessions_collection.insert_one(session.model_dump())
        else:
            logger.warning("Database not connected. Session persisted in memory only.")
            self.in_memory_sessions[session.id] = session

        return session

    def get_session(self, session_id: str) -> Optional[AssessmentSession]:
        """Retrieves a session by ID."""
        if self.sessions_collection is None:
            return self.in_memory_sessions.get(session_id)

        data = self.sessions_collection.find_one({"id": session_id})
        if data:
            return AssessmentSession(**data)
        return None

    def save_session(self, session: AssessmentSession):
        """Helper to save session state."""
        if self.sessions_collection is not None:
            self.sessions_collection.replace_one({"id": session.id}, session.model_dump())
        else:
            self.in_memory_sessions[session.id] = session

    def get_next_question(self, session_id: str) -> Optional[Question]:
        """Generates the next question for the session and persists it."""
        session = self.get_session(session_id)
        if not session or session.is_completed:
            return None

        # Check if there is already a pending question (questions generated > responses)
        # If the last question hasn't been answered, return it instead of generating a new one?
        # For simplicity, we assume one-at-a-time flow.

        question = question_generator.generate_question(
            topic=session.topic, difficulty=session.current_difficulty
        )

        if question:
            # Append to history and save
            session.question_history.append(question)
            self.save_session(session)

        return question

    def submit_answer(
        self,
        session_id: str,
        question_id: str,
        selected_option_id: str,
        is_correct: bool = None,
        time_taken: float = None,
    ) -> AssessmentSession:
        """Processes a submitted answer and updates the session."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        # Server-side validation
        # Find the question in history
        question = next((q for q in session.question_history if q.id == question_id), None)

        calculated_is_correct = False
        if question:
            # Support both ID-based options and simple text match if option_id matches answer text (legacy)
            calculated_is_correct = question.correct_option_id == selected_option_id
        else:
            # Fallback if not found (shouldn't happen if flow is correct)
            # If client sent is_correct, use it (dev mode), else False
            if is_correct is not None:
                calculated_is_correct = is_correct
            else:
                logger.warning(
                    f"Question {question_id} not found in session history for validation."
                )

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

        # Update session object (in memory)
        session.responses.append(response)
        session.current_difficulty = new_difficulty

        # Check completion
        if len(session.responses) >= session.total_questions:  # Use session-specific limit
            session.is_completed = True
            session.end_time = datetime.utcnow()
            session.final_score = adaptive_logic.calculate_final_score(session.current_difficulty)

        # Persist changes
        self.save_session(session)

        return session

    def complete_session(self, session_id: str) -> AssessmentSession:
        """Manually completes a session."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        if not session.is_completed:
            session.is_completed = True
            session.end_time = datetime.utcnow()
            session.final_score = adaptive_logic.calculate_final_score(session.current_difficulty)
            self.save_session(session)

        return session


session_manager = SessionManager()
