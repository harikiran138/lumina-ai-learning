from fastapi import APIRouter, HTTPException, Depends
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
from app.database.supabase_manager import supabase_db
from app.routers.auth import get_current_user
from app.personalization.schemas import LearningEventType
from app.services.personalization_service import get_personalization_service

router = APIRouter()

# --- Imported from assessment_routes.py (Missing Endpoints) ---


@router.get("/student/{student_id}/mastery")
async def get_student_mastery(student_id: str):
    """
    Get the aggregate mastery for a student across all sessions.
    """
    try:
        # Find latest session for student
        response = supabase_db.client.table("assessment_sessions").select("*").eq("student_id", student_id).order("timestamp", desc=True).limit(1).execute()
        
        latest_session = None
        if response.data:
            latest_session = response.data[0]

        if latest_session:
            return latest_session.get("mastery_state", {}).get("concept_mastery", {})
        return {}
    except Exception as e:
        import structlog
        structlog.get_logger().error("mastery_fetch_failed", error=str(e))
        return {}


@router.get("/student/mastery")
async def get_current_student_mastery(current_user: dict = Depends(get_current_user)):
    """
    Compatibility endpoint for the authenticated student's mastery view.
    """
    return await get_student_mastery(current_user["id"])


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
        await get_personalization_service().record_event(
            session.student_id,
            LearningEventType.ASSESSMENT_COMPLETED,
            payload={
                "session_id": session.id,
                "topic": session.topic,
                "accuracy": (
                    sum(1 for r in session.responses if r.is_correct) / len(session.responses)
                    if session.responses
                    else 0
                ),
                "total_questions": len(session.responses),
            },
            source="assessment_router",
            topic_id=session.topic,
            session_id=session.id,
        )
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
        response = session.responses[-1] if session.responses else None
        await get_personalization_service().record_event(
            session.student_id,
            LearningEventType.ASSESSMENT_ANSWER,
            payload={
                "session_id": session.id,
                "topic": session.topic,
                "question_id": request.question_id,
                "is_correct": response.is_correct if response else False,
                "time_taken": request.time_taken,
            },
            source="assessment_router",
            topic_id=session.topic,
            session_id=session.id,
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
    personalization = get_personalization_service()
    await personalization.record_event(
        req.user_id,
        LearningEventType.ASSESSMENT_ANSWER,
        payload={
            "topic": req.topic,
            "question_id": "quick-log",
            "is_correct": req.is_correct,
            "time_taken": None,
            "difficulty": req.difficulty,
        },
        source="assessment_quick_log",
        topic_id=req.topic,
    )
    profile = await personalization.get_profile(req.user_id)
    topic_state = profile.mastery_state.get(req.topic)
    new_mastery = round(topic_state.score, 4) if topic_state else (0.8 if req.is_correct else 0.4)

    return {
        "status": "ok",
        "message": "Mastery updated",
        "new_mastery": new_mastery,
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
