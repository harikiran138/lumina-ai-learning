"""
API endpoints for Phase 7: Conversational AI Tutoring System.
Provides RESTful endpoints for conversational tutoring, Q&A, and multimodal interactions.
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from services.conversational_tutor import ConversationalTutorService, ConversationContext, ConversationState
from services.nlp_engine import NLPEngine
from services.qa_engine import QAEngine
from services.optimized_embedding import OptimizedEmbeddingService
from services.vector_store import VectorStoreService
from services.skill_graph_service import SkillGraphService
from services.realtime_analytics import RealTimeAnalytics
from models_phase7 import Conversation, ConversationMessage, QuestionAnswer, VoiceInteraction, VisualAid
from db import get_db
from auth import get_current_user

logger = logging.getLogger(__name__)

# Dependency injection functions
def get_conversational_tutor() -> ConversationalTutorService:
    """Get conversational tutor service instance."""
    # In production, this would be properly injected with dependencies
    embedding_service = OptimizedEmbeddingService()
    vector_store = VectorStoreService(embedding_service)
    skill_graph = SkillGraphService()
    analytics = RealTimeAnalytics()
    return ConversationalTutorService(embedding_service, vector_store, skill_graph, analytics)

def get_nlp_engine() -> NLPEngine:
    """Get NLP engine instance."""
    embedding_service = OptimizedEmbeddingService()
    return NLPEngine(embedding_service)

def get_qa_engine() -> QAEngine:
    """Get Q&A engine instance."""
    nlp_engine = get_nlp_engine()
    embedding_service = OptimizedEmbeddingService()
    vector_store = VectorStoreService(embedding_service)
    return QAEngine(nlp_engine, vector_store, embedding_service)

# Pydantic models for request/response
class ChatMessageRequest(BaseModel):
    """Request model for chat messages."""
    message: str = Field(..., description="The student's message")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID")
    course_id: str = Field(..., description="Course ID for context")

class ChatMessageResponse(BaseModel):
    """Response model for chat messages."""
    response_text: str
    response_type: str
    confidence_score: float
    suggested_questions: List[str]
    learning_actions: List[Dict]
    visual_aids: List[Dict]
    conversation_id: str
    metadata: Dict[str, Any]

class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history."""
    conversation_id: str
    student_id: str
    course_id: str
    current_state: str
    total_interactions: int
    last_activity: datetime
    history: List[Dict]
    metadata: Dict[str, Any]

class QuestionRequest(BaseModel):
    """Request model for Q&A."""
    question: str = Field(..., description="The student's question")
    course_id: str = Field(..., description="Course ID for context")

class QuestionResponse(BaseModel):
    """Response model for Q&A."""
    answer_text: str
    confidence: float
    sources: List[str]
    follow_up_questions: List[str]
    question_analysis: Dict[str, Any]
    evaluation: Dict[str, Any]

class VoiceInteractionRequest(BaseModel):
    """Request model for voice interactions."""
    audio_data: str = Field(..., description="Base64 encoded audio data")
    conversation_id: Optional[str] = Field(None, description="Conversation ID")
    course_id: str = Field(..., description="Course ID")
    language: str = Field("en", description="Language code")

class VoiceInteractionResponse(BaseModel):
    """Response model for voice interactions."""
    transcription: str
    confidence_score: float
    conversation_response: Optional[ChatMessageResponse]
    audio_response_url: Optional[str]

class VisualAidRequest(BaseModel):
    """Request model for visual aid generation."""
    description: str = Field(..., description="Description of desired visual aid")
    aid_type: str = Field(..., description="Type of visual aid (diagram, flowchart, etc.)")
    conversation_id: Optional[str] = Field(None, description="Related conversation ID")

class VisualAidResponse(BaseModel):
    """Response model for visual aids."""
    aid_id: int
    content: str
    format: str
    description: str

# Router
router = APIRouter(prefix="/api/v1", tags=["phase7"])

# Conversational AI Endpoints

@router.post("/tutor/chat", response_model=ChatMessageResponse)
async def chat_with_tutor(
    request: ChatMessageRequest,
    background_tasks: BackgroundTasks,
    tutor: ConversationalTutorService = Depends(get_conversational_tutor),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a chat message and return tutor response."""
    try:
        student_id = current_user["id"]

        # Process the message
        response = await tutor.process_message(
            student_id=student_id,
            course_id=request.course_id,
            message=request.message,
            conversation_id=request.conversation_id
        )

        # Add conversation ID to response
        response_dict = response.__dict__ if hasattr(response, '__dict__') else response
        response_dict["conversation_id"] = request.conversation_id or f"conv_{student_id}_{int(datetime.utcnow().timestamp())}"

        # Background task to save conversation to database
        background_tasks.add_task(save_conversation_to_db, db, student_id, request, response_dict)

        return ChatMessageResponse(**response_dict)

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@router.get("/tutor/conversations/{student_id}", response_model=List[ConversationHistoryResponse])
async def get_student_conversations(
    student_id: str,
    tutor: ConversationalTutorService = Depends(get_conversational_tutor),
    current_user: Dict = Depends(get_current_user)
):
    """Get all conversations for a student."""
    # Check permissions (teacher can view student conversations, student can view own)
    if current_user["role"] not in ["teacher", "admin"] and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        conversations = await tutor.get_student_conversations(student_id)
        return [ConversationHistoryResponse(**conv) for conv in conversations]
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversations: {str(e)}")

@router.get("/tutor/conversations/{conversation_id}/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    conversation_id: str,
    tutor: ConversationalTutorService = Depends(get_conversational_tutor),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed history for a specific conversation."""
    try:
        # Get conversation from service
        history = await tutor.get_conversation_history(conversation_id)

        if not history:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Check ownership
        if current_user["role"] not in ["teacher", "admin"] and history["student_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")

        return ConversationHistoryResponse(**history)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversation history: {str(e)}")

@router.delete("/tutor/conversations/{conversation_id}")
async def end_conversation(
    conversation_id: str,
    tutor: ConversationalTutorService = Depends(get_conversational_tutor),
    current_user: Dict = Depends(get_current_user)
):
    """End a conversation."""
    try:
        # Check if user owns the conversation (simplified - would check database)
        success = await tutor.end_conversation(conversation_id)

        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return {"message": "Conversation ended successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to end conversation: {str(e)}")

# Q&A System Endpoints

@router.post("/qa/ask", response_model=QuestionResponse)
async def ask_question(
    request: QuestionRequest,
    background_tasks: BackgroundTasks,
    qa_engine: QAEngine = Depends(get_qa_engine),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a question and return an answer."""
    try:
        student_id = current_user["id"]

        # Process the question
        result = await qa_engine.process_question(
            question=request.question,
            course_id=request.course_id
        )

        # Background task to save Q&A interaction
        background_tasks.add_task(save_qa_interaction, db, student_id, request, result)

        return QuestionResponse(**result)

    except Exception as e:
        logger.error(f"Error in Q&A endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Question processing failed: {str(e)}")

@router.get("/qa/suggestions/{topic}")
async def get_question_suggestions(
    topic: str,
    course_id: str,
    count: int = 5,
    qa_engine: QAEngine = Depends(get_qa_engine),
    current_user: Dict = Depends(get_current_user)
):
    """Get suggested questions for a topic."""
    try:
        suggestions = await qa_engine.get_suggestions(topic, course_id, count)
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"Error getting suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@router.post("/qa/feedback")
async def submit_answer_feedback(
    question_answer_id: int,
    feedback: Dict[str, Any],
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit feedback on an answer."""
    try:
        # Find the Q&A record
        qa_record = db.query(QuestionAnswer).filter(
            QuestionAnswer.id == question_answer_id,
            QuestionAnswer.student_id == current_user["id"]
        ).first()

        if not qa_record:
            raise HTTPException(status_code=404, detail="Q&A record not found")

        # Update feedback
        qa_record.user_feedback = feedback
        db.commit()

        return {"message": "Feedback submitted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")

# Multimodal Endpoints

@router.post("/multimodal/voice", response_model=VoiceInteractionResponse)
async def process_voice_interaction(
    request: VoiceInteractionRequest,
    background_tasks: BackgroundTasks,
    tutor: ConversationalTutorService = Depends(get_conversational_tutor),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process voice input and return response."""
    try:
        student_id = current_user["id"]

        # Mock voice processing (would integrate with actual STT service)
        transcription = await mock_speech_to_text(request.audio_data, request.language)

        # If transcription successful, process as chat message
        conversation_response = None
        if transcription and len(transcription.strip()) > 0:
            chat_request = ChatMessageRequest(
                message=transcription,
                conversation_id=request.conversation_id,
                course_id=request.course_id
            )

            conversation_response = await tutor.process_message(
                student_id=student_id,
                course_id=request.course_id,
                message=transcription,
                conversation_id=request.conversation_id
            )

        # Background task to save voice interaction
        background_tasks.add_task(save_voice_interaction, db, student_id, request, transcription)

        # Mock TTS response URL
        audio_response_url = f"/api/v1/multimodal/tts/{student_id}" if conversation_response else None

        return VoiceInteractionResponse(
            transcription=transcription,
            confidence_score=0.85,  # Mock confidence
            conversation_response=conversation_response,
            audio_response_url=audio_response_url
        )

    except Exception as e:
        logger.error(f"Error processing voice interaction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")

@router.post("/multimodal/generate-visual", response_model=VisualAidResponse)
async def generate_visual_aid(
    request: VisualAidRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a visual aid."""
    try:
        # Mock visual aid generation (would integrate with actual generation service)
        visual_content = await mock_generate_visual_aid(request.description, request.aid_type)

        # Save to database
        visual_aid = VisualAid(
            conversation_id=request.conversation_id,
            aid_type=request.aid_type,
            description=request.description,
            content=visual_content,
            format="svg"  # Mock format
        )

        db.add(visual_aid)
        db.commit()
        db.refresh(visual_aid)

        return VisualAidResponse(
            aid_id=visual_aid.id,
            content=visual_content,
            format="svg",
            description=request.description
        )

    except Exception as e:
        logger.error(f"Error generating visual aid: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Visual aid generation failed: {str(e)}")

@router.get("/multimodal/visual-aids/{conversation_id}")
async def get_conversation_visual_aids(
    conversation_id: str,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get visual aids for a conversation."""
    try:
        # Check conversation ownership (simplified)
        visual_aids = db.query(VisualAid).filter(
            VisualAid.conversation_id == conversation_id
        ).all()

        return {
            "conversation_id": conversation_id,
            "visual_aids": [
                {
                    "id": aid.id,
                    "type": aid.aid_type,
                    "description": aid.description,
                    "format": aid.format,
                    "generated_at": aid.generated_at
                }
                for aid in visual_aids
            ]
        }

    except Exception as e:
        logger.error(f"Error getting visual aids: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve visual aids: {str(e)}")

# Analytics Endpoints

@router.get("/tutor/analytics/{student_id}")
async def get_conversation_analytics(
    student_id: str,
    tutor: ConversationalTutorService = Depends(get_conversational_tutor),
    current_user: Dict = Depends(get_current_user)
):
    """Get conversation analytics for a student."""
    # Check permissions
    if current_user["role"] not in ["teacher", "admin"] and current_user["id"] != student_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # Get conversations
        conversations = await tutor.get_student_conversations(student_id)

        # Calculate analytics
        analytics = {
            "total_conversations": len(conversations),
            "total_interactions": sum(conv.get("total_interactions", 0) for conv in conversations),
            "active_conversations": len([c for c in conversations if c.get("last_activity") and
                                       (datetime.utcnow() - c["last_activity"]).days < 7]),
            "average_session_length": 0,  # Would calculate from message timestamps
            "learning_progress": 0.0,     # Would calculate from progress scores
            "top_topics": [],             # Would extract from conversation topics
            "engagement_trends": []       # Would analyze over time
        }

        return analytics

    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analytics: {str(e)}")

# Background task functions

async def save_conversation_to_db(db: Session, student_id: str, request: ChatMessageRequest, response: Dict):
    """Save conversation interaction to database."""
    try:
        # Create or update conversation
        conversation_id = response.get("conversation_id", request.conversation_id)
        if not conversation_id:
            return

        # Check if conversation exists
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()

        if not conversation:
            # Create new conversation
            conversation = Conversation(
                id=conversation_id,
                student_id=student_id,
                course_id=request.course_id,
                state=ConversationState(response.get("metadata", {}).get("conversation_state", "initiation")),
                total_interactions=1,
                metadata=response.get("metadata", {})
            )
            db.add(conversation)
        else:
            # Update existing conversation
            conversation.total_interactions += 1
            conversation.state = ConversationState(response.get("metadata", {}).get("conversation_state", "initiation"))
            conversation.last_activity = datetime.utcnow()

        # Add messages
        student_message = ConversationMessage(
            conversation_id=conversation_id,
            message_type="student",
            content=request.message,
            metadata={"timestamp": datetime.utcnow().isoformat()}
        )

        tutor_message = ConversationMessage(
            conversation_id=conversation_id,
            message_type="tutor",
            content=response.get("response_text", ""),
            metadata=response.get("metadata", {})
        )

        db.add(student_message)
        db.add(tutor_message)
        db.commit()

    except Exception as e:
        logger.error(f"Error saving conversation to DB: {str(e)}")
        db.rollback()

async def save_qa_interaction(db: Session, student_id: str, request: QuestionRequest, result: Dict):
    """Save Q&A interaction to database."""
    try:
        qa_record = QuestionAnswer(
            student_id=student_id,
            course_id=request.course_id,
            question=request.question,
            answer=result.get("answer_text", ""),
            question_type=result.get("question_analysis", {}).get("question_type", "general"),
            confidence_score=result.get("confidence", 0.0),
            sources=result.get("sources", []),
            follow_up_questions=result.get("follow_up_questions", [])
        )

        db.add(qa_record)
        db.commit()

    except Exception as e:
        logger.error(f"Error saving Q&A interaction: {str(e)}")
        db.rollback()

async def save_voice_interaction(db: Session, student_id: str, request: VoiceInteractionRequest, transcription: str):
    """Save voice interaction to database."""
    try:
        voice_record = VoiceInteraction(
            student_id=student_id,
            conversation_id=request.conversation_id,
            audio_data=request.audio_data,
            transcription=transcription,
            confidence_score=0.85,  # Mock confidence
            language=request.language,
            duration_seconds=0.0  # Would calculate from audio data
        )

        db.add(voice_record)
        db.commit()

    except Exception as e:
        logger.error(f"Error saving voice interaction: {str(e)}")
        db.rollback()

# Mock functions for demonstration (would be replaced with actual implementations)

async def mock_speech_to_text(audio_data: str, language: str) -> str:
    """Mock speech-to-text conversion."""
    # In production, this would call actual STT service
    await asyncio.sleep(0.1)  # Simulate processing time
    return "This is a mock transcription of the audio input."

async def mock_generate_visual_aid(description: str, aid_type: str) -> str:
    """Mock visual aid generation."""
    # In production, this would call actual visual generation service
    await asyncio.sleep(0.2)  # Simulate processing time

    if aid_type == "diagram":
        return "<svg><circle cx='50' cy='50' r='40' fill='blue'/></svg>"
    elif aid_type == "flowchart":
        return "<svg><rect x='10' y='10' width='80' height='40' fill='green'/></svg>"
    else:
        return f"<svg><text x='10' y='20'>{description}</text></svg>"
