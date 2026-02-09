from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.assessment.models.schemas import (
    Question,
    AssessmentSession,
    SubmitAnswerRequest,
    StartAssessmentRequest,
    AssessmentResult,
    AssessmentReport,
)
from app.assessment.engine.session_manager import session_manager
from typing import Optional

router = APIRouter()

# --- Imported from assessment_routes.py (Missing Endpoints) ---


@router.get("/student/{student_id}/mastery")
async def get_student_mastery(student_id: str):
    """
    Get the aggregate mastery for a student across all sessions.
    """
    from app.database.manager import db

    # Safety Check: If DB is not connected (e.g. missing ENV), return empty dict
    if not db.db:
        return {}

    try:
        # Find latest session for student
        cursor = (
            db.get_collection("assessment_sessions")
            .find({"student_id": student_id})
            .sort("timestamp", -1)
            .limit(1)
        )

        # Async cursor
        latest_session = None
        async for doc in cursor:
            latest_session = doc
            break

        if latest_session:
            return latest_session.get("mastery_state", {}).get("concept_mastery", {})
        return {}
    except Exception as e:
        print(f"Error fetching mastery: {e}")
        return {}


@router.get("/stats/teacher")
async def get_teacher_stats():
    """
    Get aggregate statistics for the teacher dashboard.
    """
    from app.store.analytics_store import AnalyticsStore

    store = AnalyticsStore()
    return await store.get_teacher_dashboard_stats()


# -----------------------------------------------------------


@router.post("/start", response_model=AssessmentSession)
async def start_assessment(request: StartAssessmentRequest):
    """
    Starts a new adaptive assessment session.
    """
    try:
        session = await session_manager.create_session(
            student_id=request.student_id, topic=request.topic, num_questions=request.num_questions
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start assessment: {str(e)}")


@router.post("/complete/{session_id}", response_model=AssessmentSession)
async def complete_assessment(session_id: str):
    """
    Manually completes an assessment session.
    """
    try:
        session = await session_manager.complete_session(session_id)
        return session
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/next-question/{session_id}", response_model=Optional[Question])
async def get_next_question(session_id: str):
    """
    Retrieves the next question for the given session.
    Returns null if the assessment is complete.
    """
    try:
        question = await session_manager.get_next_question(session_id)
        if not question:
            # Check if session is actually complete or if it's an error
            session = await session_manager.get_session(session_id)
            if session and session.is_completed:
                return None  # Assessment complete
            elif not session:
                raise HTTPException(status_code=404, detail="Session not found")
            else:
                # Should not happen if session exists and not complete
                raise HTTPException(status_code=500, detail="Failed to generate question")
        return question
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving question: {str(e)}")


@router.post("/submit", response_model=AssessmentSession)
async def submit_answer(request: SubmitAnswerRequest):
    """
    Submits an answer and updates the session difficulty.
    Validity is checked against the session history on server side.
    """
    try:
        session = await session_manager.submit_answer(
            session_id=request.session_id,
            question_id=request.question_id,
            selected_option_id=request.selected_option_id,
            time_taken=request.time_taken,
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/result/{session_id}", response_model=AssessmentResult)
async def get_result(session_id: str):
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    total_questions = len(session.responses)
    correct_answers = sum(1 for r in session.responses if r.is_correct)

    return AssessmentResult(
        session_id=session.id,
        total_questions=total_questions,
        correct_answers=correct_answers,
        final_ability_estimate=session.current_difficulty,
        message="Assessment Completed",
    )


class QuickLogRequest(BaseModel):
    user_id: str
    topic: str
    is_correct: bool
    difficulty: float = 0.5


@router.post("/quick-log")
async def log_quick_response(req: QuickLogRequest):
    """
    Logs a quick assessment result (e.g. from AI Tutor chat) to update topic mastery.
    """
    # In a real implementation, this would call session_manager or a mastery_service
    # to update the student's mastery record for the specific topic.
    # For now, we mock the logic.

    # new_mastery = mastery_service.update_mastery(req.user_id, req.topic, req.is_correct)

    return {
        "status": "ok",
        "message": "Mastery updated",
        "new_mastery": 0.8 if req.is_correct else 0.4,
    }


@router.get("/report/{session_id}", response_model=AssessmentReport)
async def get_report(session_id: str):
    """Return a richer summary report for a completed assessment.

    This uses the existing scalar-difficulty engine and response history to
    derive an overall accuracy and a coarse performance level.
    """
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    total_questions = len(session.responses)
    correct_answers = sum(1 for r in session.responses if r.is_correct)
    accuracy = (correct_answers / total_questions) if total_questions else 0.0
    ability = float(session.current_difficulty)

    # Simple level classification based on ability estimate
    if ability < 0.4:
        level = "weak"
    elif ability < 0.7:
        level = "developing"
    else:
        level = "strong"

    summary = (
        f"{correct_answers}/{total_questions} correct questions. "
        f"Estimated ability {ability:.2f} -> overall level: {level}."
        if total_questions
        else "No answers submitted for this session."
    )

    return AssessmentReport(
        session_id=session.id,
        total_questions=total_questions,
        correct_answers=correct_answers,
        accuracy=round(accuracy, 2),
        final_ability_estimate=ability,
        level=level,
        summary=summary,
    )
