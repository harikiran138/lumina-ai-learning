import inspect
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.assessment.models.schemas import (
    AssessmentSession,
    StudentResponse,
    Question,
    MasteryState,
    QuestionFormat,
    AnswerAnalysis,
    ResponseTelemetry,
)

# Switch to Gemini Generator
from app.assessment.llm.gemini_generator import gemini_generator as question_generator
from app.assessment.engine.adaptive_logic import adaptive_logic
from app.assessment.engine.irt import irt_model
from app.assessment.engine.remediation import build_remediation_plan
from app.assessment.question.selector import QuestionSelector
from app.database.supabase_manager import supabase_db
from datetime import datetime
import logging
from app.services.personalization_service import get_personalization_service
from app.personalization.schemas import LearningEventType, AssessmentAnswerPayload, AssessmentCompletedPayload

logger = logging.getLogger(__name__)


class SessionManager:
    def __init__(self):
        self.in_memory_sessions = {}
        self.selector = QuestionSelector()

    @property
    def sessions_collection(self):
        return supabase_db.client.table("assessment_sessions")

    def _session_record(self, session: AssessmentSession):
        return {
            "id": session.id,
            "student_id": session.student_id,
            "topic": session.topic,
            "current_difficulty": session.current_difficulty,
            "responses": [response.model_dump(mode="json") for response in session.responses],
            "question_history": [q.model_dump(mode="json") for q in session.question_history],
            "current_question": session.current_question.model_dump(mode="json") if session.current_question else None,
            "mastery_state": (
                session.mastery_state.model_dump(mode="json") if session.mastery_state else None
            ),
            "status": "completed" if session.is_completed else "active",
            "timestamp": session.start_time.isoformat(),
            "num_questions": session.total_questions,
        }

    async def create_session(
        self, student_id: str, topic: str, initial_difficulty: float = 0.5, num_questions: int = 5
    ) -> AssessmentSession:
        """Creates a new assessment session."""
        session = AssessmentSession(
            student_id=student_id,
            topic=topic,
            current_difficulty=initial_difficulty,
            total_questions=num_questions,
            mastery_state=MasteryState(student_id=student_id, concept_mastery={topic: initial_difficulty}),
            seen_question_ids=[],
        )

        try:
            self.sessions_collection.insert(self._session_record(session)).execute()
        except Exception as e:
            logger.warning(f"Database error writing session. Session persisted in memory only. Error: {e}")
            self.in_memory_sessions[session.id] = session

        return session

    async def get_session(self, session_id: str) -> Optional[AssessmentSession]:
        """Retrieves a session by ID."""
        try:
            response = self.sessions_collection.select("*").eq("id", session_id).execute()
            if response.data:
                data = response.data[0]
                
                # Deserialize complex fields
                if data.get("responses"):
                    data["responses"] = [StudentResponse(**r) for r in data["responses"]]
                if data.get("question_history"):
                    data["question_history"] = [Question(**q) for q in data["question_history"]]
                if data.get("current_question"):
                    data["current_question"] = Question(**data["current_question"])
                if data.get("mastery_state"):
                    data["mastery_state"] = MasteryState(**data["mastery_state"])

                # Normalize field names
                data["total_questions"] = data.get("num_questions", data.get("total_questions", 5))
                data["start_time"] = data.get("timestamp", data.get("start_time"))
                data["is_completed"] = data.get("status") == "completed"
                
                return AssessmentSession(**data)
        except Exception as e:
            logger.warning(f"Session deserialization failed: {e}")
        return self.in_memory_sessions.get(session_id)

    async def save_session(self, session: AssessmentSession):
        """Helper to save session state."""
        try:
            self.sessions_collection.update(self._session_record(session)).eq("id", session.id).execute()
        except Exception as e:
            logger.error(f"Failed to update session: {e}")
            self.in_memory_sessions[session.id] = session

    async def get_next_question(self, session_id: str) -> Optional[Question]:
        """Generates the next question for the session and persists it."""
        session = await self.get_session(session_id)
        if not session or session.is_completed:
            return None

        # Diversity: Select format based on history
        history_formats = [q.format for q in session.question_history]
        ideal_format = self.selector.get_ideal_format(session.current_difficulty, history_formats)
        
        # Evidence-Gap: Pass previous analysis for conditioned generation
        last_analysis = session.responses[-1].analysis if session.responses else None

        generated = question_generator.generate_question(
            topic=session.topic, 
            difficulty=session.current_difficulty,
            format=ideal_format,
            previous_analysis=last_analysis
        )
        
        # Handle async if generator was made async elsewhere (it currently isn't, but for safety)
        question = await generated if inspect.isawaitable(generated) else generated

        if question:
            session.question_history.append(question)
            session.current_question = question # Track for easier retrieval in submit
            await self.save_session(session)

        return question

    async def submit_answer(
        self,
        session_id: str,
        question_id: str,
        selected_option_id: Optional[str] = None,
        selected_answer: Optional[str] = None,
        telemetry: Optional[ResponseTelemetry] = None,
        time_taken: Optional[float] = None,
    ) -> AssessmentSession:
        """Processes a submitted answer and updates the session."""
        session = await self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        # Find the question in history
        question = next((q for q in session.question_history if q.id == question_id), None)
        if not question:
             raise ValueError("Question not found in session history")

        personalization = get_personalization_service()

        # Analysis logic
        analysis = None
        is_correct = False
        score = 0.0
        target_concepts = question.metadata.concepts if question.metadata else [session.topic]
        question_difficulty = (
            question.metadata.difficulty
            if question.metadata and question.metadata.difficulty is not None
            else question.difficulty
        )
        discrimination = (
            question.metadata.discrimination
            if question.metadata and question.metadata.discrimination is not None
            else 1.0
        )
        guessing = (
            question.metadata.guessing
            if question.metadata and question.metadata.guessing is not None
            else 0.0
        )
        theta_before = session.current_difficulty

        if question.format == QuestionFormat.MCQ:
            is_correct = question.correct_option_id == selected_option_id
            score = 1.0 if is_correct else 0.0
            selected_option = next(
                (opt for opt in question.options if opt.id == selected_option_id),
                None,
            )
            misconceptions = []
            if not is_correct and selected_option:
                misconceptions.append(f"chose:{selected_option.text}")
            analysis = AnswerAnalysis(
                correctness=score,
                concepts_demonstrated=target_concepts if is_correct else [],
                concepts_missing=target_concepts if not is_correct else [],
                misconceptions=misconceptions,
                confidence_estimate=irt_model.confidence(theta_before, question_difficulty, discrimination, guessing),
                feedback="Correct!" if is_correct else f"Hint: {question.explanation}",
            )
        else:
            # Semantic analysis for open-ended formats
            analysis = question_generator.analyze_answer(
                question=question,
                student_answer=selected_answer or ""
            )
            is_correct = analysis.correctness > 0.7
            score = analysis.correctness
            if analysis.confidence_estimate is None:
                analysis.confidence_estimate = irt_model.confidence(theta_before, question_difficulty, discrimination, guessing)

        # Update ability estimate with IRT (fallback to adaptive logic on error)
        try:
            new_difficulty = irt_model.update_theta(
                theta_before,
                question_difficulty,
                score,
                discrimination,
                guessing,
            )
        except Exception:
            new_difficulty = adaptive_logic.calculate_next_difficulty(
                session.current_difficulty, is_correct
            )

        # Update MasteryState
        for concept in target_concepts:
            current = session.mastery_state.concept_mastery.get(concept, session.current_difficulty)
            session.mastery_state.concept_mastery[concept] = round((current + score) / 2.0, 3)

        # Record response
        response = StudentResponse(
            question_id=question_id,
            selected_option_id=selected_option_id,
            selected_answer=selected_answer,
            is_correct=is_correct,
            score=score,
            analysis=analysis,
            telemetry=telemetry,
            time_taken_seconds=time_taken,
        )

        session.responses.append(response)
        session.current_difficulty = new_difficulty

        # --- Personalization Integration (WS4) ---
        try:
            payload = AssessmentAnswerPayload(
                session_id=session.id,
                topic=session.topic,
                question_id=question_id,
                is_correct=is_correct,
                time_taken=time_taken,
                analysis=analysis.model_dump() if analysis else None,
                telemetry=telemetry.model_dump() if telemetry else None,
            )
            await personalization.record_event(
                session.student_id,
                LearningEventType.ASSESSMENT_ANSWER,
                payload=payload.model_dump(exclude_none=True),
                source="session_manager",
                topic_id=session.topic,
                session_id=session.id,
            )
        except Exception as e:
            logger.warning(f"Failed to record assessment answer event: {e}")

        # Check completion
        if len(session.responses) >= session.total_questions:
            session.is_completed = True
            session.end_time = datetime.utcnow()
            session.final_score = adaptive_logic.calculate_final_score(session.current_difficulty)
            accuracy = (
                sum(1 for r in session.responses if r.is_correct) / len(session.responses)
                if session.responses
                else 0
            )
            confidence_values = [
                r.analysis.confidence_estimate
                for r in session.responses
                if r.analysis and r.analysis.confidence_estimate is not None
            ]
            confidence_avg = round(sum(confidence_values) / len(confidence_values), 2) if confidence_values else 0.5
            misconceptions = []
            for r in session.responses:
                if r.analysis and r.analysis.misconceptions:
                    misconceptions.extend(r.analysis.misconceptions)
            remediation_plan = None
            if accuracy < 0.7:
                try:
                    profile = await personalization.get_profile(session.student_id)
                    remediation_plan = build_remediation_plan(
                        session.topic,
                        profile,
                        misconceptions=misconceptions,
                    )
                except Exception:
                    remediation_plan = None
            
            # Record Assessment Completed event
            try:
                await personalization.record_event(
                    session.student_id,
                    LearningEventType.ASSESSMENT_COMPLETED,
                    payload=AssessmentCompletedPayload(
                        session_id=session.id,
                        topic=session.topic,
                        accuracy=accuracy,
                        total_questions=len(session.responses),
                        confidence_avg=confidence_avg,
                        misconceptions=misconceptions,
                        remediation_plan=remediation_plan,
                    ).model_dump(exclude_none=True),
                    source="session_manager",
                    topic_id=session.topic,
                    session_id=session.id,
                )
            except Exception as e:
                logger.warning(f"Failed to record assessment completed event: {e}")

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
