from fastapi import APIRouter, HTTPException, Body
from typing import Optional
from app.assessment.engine.knowledge_tracing import KnowledgeTracingEngine
from app.assessment.engine.policy_engine import PolicyEngine, AssessmentAction
from app.assessment.question.selector import QuestionSelector
from app.assessment.engine.session_manager import SessionManager
from app.assessment.models.schemas import StudentResponse
from pydantic import BaseModel

class StartAssessmentRequest(BaseModel):
    student_id: str

class SubmitAnswerRequest(BaseModel):
    selected_answer: str
    time_taken: float = 0.0

router = APIRouter()

# Instantiate singletons for now
session_manager = SessionManager()
bkt_engine = KnowledgeTracingEngine()
policy_engine = PolicyEngine()
question_selector = QuestionSelector() # uses mock DB by default

@router.get("/student/{student_id}/mastery")
async def get_student_mastery(student_id: str):
    """
    Get the aggregate mastery for a student across all sessions.
    For simplicity in this BKT implementation, we might just fetch the latest session's mastery 
    or aggregated if we stored it separately. 
    Since our SessionManager creates new MasteryState per session in the simple version, 
    we need to find the latest session.
    """
    from app.database.manager import db
    # Find latest session for student
    cursor = db.get_collection("assessment_sessions").find(
        {"student_id": student_id}
    ).sort("timestamp", -1).limit(1)
    
    # Async cursor
    latest_session = None
    async for doc in cursor:
        latest_session = doc
        break
        
    if latest_session:
        return latest_session.get("mastery_state", {}).get("concept_mastery", {})
    return {}

@router.get("/stats/teacher")
async def get_teacher_stats():
    """
    Get aggregate statistics for the teacher dashboard.
    Calculates average mastery across all sessions.
    """
    from app.database.manager import db
    
    # Simple aggregation: Average mastery of all latest sessions
    pipeline = [
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": "$student_id",
            "latest_mastery": {"$first": "$mastery_state.concept_mastery"}
        }},
        {"$project": {
            "avg_mastery": {"$avg": {"$objectToArray": "$latest_mastery.v"}} # Complex because map
        }}
    ]
    
    # Simplified approach: Just get all sessions and avg in python for MVP
    # This avoids complex Mongo aggregation on dynamic keys if not set up perfectly
    cursor = db.get_collection("assessment_sessions").find({})
    
    total_mastery = 0
    count = 0
    
    async for session in cursor:
        mastery_map = session.get("mastery_state", {}).get("concept_mastery", {})
        if mastery_map:
             avg_session = sum(mastery_map.values()) / len(mastery_map)
             total_mastery += avg_session
             count += 1
             
    if count == 0:
        return {"avg_mastery": 0, "total_students": 0}
        
    return {
        "avg_mastery": (total_mastery / count) * 100, # Return percentage
        "total_students": count
    }

@router.post("/start")
async def start_assessment(req: StartAssessmentRequest):
    session = await session_manager.create_session(req.student_id)
    return {"session_id": session.session_id, "message": "Assessment started"}

@router.get("/{session_id}/next-question")
async def get_next_question(session_id: str):
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.is_completed:
        return {"status": "completed", "reason": session.completion_reason}
        
    # 2. Get Next Action from Policy Engine
    # Convert history dicts back to Schema objects if needed, but our engine handles dicts fine?
    # Actually PolicyEngine expects objects.
    history_objs = [StudentResponse(**h) for h in session.history]
    decision_action = policy_engine.decide_next_action(
        session.mastery_state, 
        history_objs,
        active_concept="arrays" # TODO: Make this dynamic from request or session
    )

    if decision_action.action == AssessmentAction.STOP:
        session.is_completed = True
        session.completion_reason = decision_action.reason
        await session_manager.save_session(session)
        return {"status": "completed", "reason": decision_action.reason}

    # 3. Select Question
    question = question_selector.select_question(decision_action, session.seen_question_ids)
    
    if not question:
        # Fallback stop if no questions found
        session.is_completed = True
        session.completion_reason = "No more suitable questions found."
        await session_manager.save_session(session)
        return {"status": "completed", "reason": session.completion_reason}

    # 4. Update Session State (Current Question)
    session.current_question = question
    session.seen_question_ids.append(question.id)
    await session_manager.save_session(session)
    
    return {
        "status": "in_progress",
        "question": question
    }

@router.post("/{session_id}/submit-answer")
async def submit_answer(session_id: str, req: SubmitAnswerRequest):
    session = await session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    question = session.current_question
    if not question:
        raise HTTPException(status_code=400, detail="No active question to answer")

    # 1. Grade Answer
    is_correct = (req.selected_answer == question.correct_answer)
    
    # 2. Update Mastery (BKT)
    # The BKT engine updates the MasteryState object in-place
    bkt_engine.update_mastery(session.mastery_state, question.metadata.concepts, is_correct)
    
    # 3. Record Response
    response_entry = StudentResponse(
        question_id=question.id,
        selected_answer=req.selected_answer,
        is_correct=is_correct,
        time_taken_seconds=req.time_taken
    )
    session.history.append(response_entry.dict())
    
    # Clear current question so they can't answer again
    session.current_question = None
    
    # 4. Save Session
    await session_manager.save_session(session)
    
    return {
        "is_correct": is_correct,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "mastery_update": session.mastery_state.concept_mastery
    }
