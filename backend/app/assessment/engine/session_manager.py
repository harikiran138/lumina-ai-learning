from typing import Optional
from app.assessment.models.schemas import AssessmentSession, StudentResponse, Question, AssessmentResult
from app.assessment.llm.ollama_generator import ollama_generator as question_generator
from app.assessment.engine.adaptive_logic import adaptive_logic
from store.database import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SessionManager:
    def __init__(self):
        self.db = db.get_db()
        self.sessions_collection = self.db["assessment_sessions"] if self.db is not None else None

    def create_session(self, student_id: str, topic: str, initial_difficulty: float = 0.5) -> AssessmentSession:
        """Creates a new assessment session."""
        session = AssessmentSession(
            student_id=student_id,
            topic=topic,
            current_difficulty=initial_difficulty
        )
        if self.sessions_collection is not None:
            self.sessions_collection.insert_one(session.model_dump())
        else:
            logger.warning("Database not connected. Session will not be persisted.")
        
        return session

    def get_session(self, session_id: str) -> Optional[AssessmentSession]:
        """Retrieves a session by ID."""
        if self.sessions_collection is None:
            return None
        
        data = self.sessions_collection.find_one({"id": session_id})
        if data:
            return AssessmentSession(**data)
        return None

    def get_next_question(self, session_id: str) -> Optional[Question]:
        """Generates the next question for the session."""
        session = self.get_session(session_id)
        if not session or session.is_completed:
            return None
        
        question = question_generator.generate_question(
            topic=session.topic, 
            difficulty=session.current_difficulty
        )
        return question

    def submit_answer(self, session_id: str, question_id: str, selected_option_id: str, is_correct: bool) -> AssessmentSession:
        """Processes a submitted answer and updates the session."""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        # Update difficulty
        new_difficulty = adaptive_logic.calculate_next_difficulty(
            session.current_difficulty, is_correct
        )
        
        # Record response
        response = StudentResponse(
            question_id=question_id,
            selected_option_id=selected_option_id,
            is_correct=is_correct
        )
        
        # Update session object
        session.responses.append(response)
        session.current_difficulty = new_difficulty
        
        # Check completion (e.g., after 10 questions)
        if len(session.responses) >= 5: # Short assessment for testing
            session.is_completed = True
            session.end_time = datetime.utcnow()
            session.final_score = adaptive_logic.calculate_final_score(session.current_difficulty)

        # Persist changes
        if self.sessions_collection is not None:
            self.sessions_collection.replace_one({"id": session_id}, session.model_dump())

        return session

session_manager = SessionManager()
