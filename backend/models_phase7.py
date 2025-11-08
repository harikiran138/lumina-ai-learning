"""
Database models for Phase 7: Conversational AI Tutoring System.
Extends existing models with conversation, NLP analysis, and multimodal features.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON, Enum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class ConversationState(enum.Enum):
    """States for conversation flow."""
    INITIATION = "initiation"
    EXPLORATION = "exploration"
    DEEP_DIVE = "deep_dive"
    PRACTICE = "practice"
    REVIEW = "review"
    CLOSURE = "closure"

class IntentType(enum.Enum):
    """Types of student intents."""
    QUESTION_ASKING = "question_asking"
    EXPLANATION_REQUEST = "explanation_request"
    PRACTICE_REQUEST = "practice_request"
    CONCEPT_CLARIFICATION = "concept_clarification"
    HELP_REQUEST = "help_request"
    GENERAL_CHAT = "general_chat"

class SentimentType(enum.Enum):
    """Sentiment categories."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class ComplexityLevel(enum.Enum):
    """Content complexity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# Conversation Management Tables

class Conversation(Base):
    """Main conversation sessions table."""
    __tablename__ = "conversations"

    id = Column(String(50), primary_key=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(50), nullable=False)
    current_topic = Column(String(200))
    state = Column(Enum(ConversationState), default=ConversationState.INITIATION)
    learning_objectives = Column(JSON)  # List of learning objectives
    confidence_level = Column(Float, default=0.5)
    total_interactions = Column(Integer, default=0)
    last_activity = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    metadata = Column(JSON)  # Additional conversation metadata

    # Relationships
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")
    analyses = relationship("ConversationAnalysis", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation(id='{self.id}', student_id='{self.student_id}', state='{self.state.value}')>"

class ConversationMessage(Base):
    """Individual messages within conversations."""
    __tablename__ = "conversation_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(50), ForeignKey("conversations.id"), nullable=False)
    message_type = Column(String(20), nullable=False)  # 'student' or 'tutor'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=func.now())
    metadata = Column(JSON)  # Message metadata (emotions, confidence, etc.)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    analysis = relationship("MessageAnalysis", back_populates="message", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ConversationMessage(id={self.id}, type='{self.message_type}', conversation='{self.conversation_id}')>"

class MessageAnalysis(Base):
    """NLP analysis results for individual messages."""
    __tablename__ = "message_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("conversation_messages.id"), nullable=False)
    intent = Column(Enum(IntentType))
    intent_confidence = Column(Float)
    sentiment = Column(Enum(SentimentType))
    sentiment_score = Column(Float)
    complexity_level = Column(Enum(ComplexityLevel))
    complexity_score = Column(Float)
    key_concepts = Column(JSON)  # Extracted concepts
    follow_up_needed = Column(Boolean, default=False)
    suggested_actions = Column(JSON)  # List of suggested actions
    analysis_timestamp = Column(DateTime, default=func.now())

    # Relationships
    message = relationship("ConversationMessage", back_populates="analysis")

    def __repr__(self):
        return f"<MessageAnalysis(id={self.id}, intent='{self.intent.value if self.intent else None}', confidence={self.intent_confidence})>"

class ConversationAnalysis(Base):
    """Overall conversation analysis and insights."""
    __tablename__ = "conversation_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(50), ForeignKey("conversations.id"), nullable=False)
    progress_score = Column(Float, default=0.0)
    sentiment_trend = Column(String(20))  # 'improving', 'declining', 'stable'
    complexity_trend = Column(String(20))  # 'increasing', 'decreasing', 'stable'
    insights = Column(JSON)  # List of insights
    key_topics = Column(JSON)  # Topics discussed
    learning_patterns = Column(JSON)  # Identified patterns
    analysis_timestamp = Column(DateTime, default=func.now())

    # Relationships
    conversation = relationship("Conversation", back_populates="analyses")

    def __repr__(self):
        return f"<ConversationAnalysis(id={self.id}, conversation='{self.conversation_id}', progress={self.progress_score})>"

# Q&A System Tables

class QuestionAnswer(Base):
    """Q&A interactions and responses."""
    __tablename__ = "question_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(50), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    question_type = Column(String(50))  # 'factual', 'explanatory', 'procedural', etc.
    confidence_score = Column(Float)
    sources = Column(JSON)  # Source content IDs
    follow_up_questions = Column(JSON)  # Suggested follow-ups
    user_feedback = Column(JSON)  # User feedback on answer quality
    created_at = Column(DateTime, default=func.now())

    # Relationships
    evaluation = relationship("AnswerEvaluation", back_populates="question_answer", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<QuestionAnswer(id={self.id}, student='{self.student_id}', type='{self.question_type}')>"

class AnswerEvaluation(Base):
    """Quality evaluation of answers."""
    __tablename__ = "answer_evaluations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question_answer_id = Column(Integer, ForeignKey("question_answers.id"), nullable=False)
    quality_score = Column(Float)
    relevance_score = Column(Float)
    completeness_score = Column(Float)
    clarity_score = Column(Float)
    suggestions = Column(JSON)  # Improvement suggestions
    evaluated_at = Column(DateTime, default=func.now())

    # Relationships
    question_answer = relationship("QuestionAnswer", back_populates="evaluation")

    def __repr__(self):
        return f"<AnswerEvaluation(id={self.id}, quality={self.quality_score})>"

# Multimodal Interaction Tables

class VoiceInteraction(Base):
    """Voice-based interactions."""
    __tablename__ = "voice_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String(50), ForeignKey("conversations.id"))
    audio_data = Column(Text)  # Base64 encoded audio or file path
    transcription = Column(Text)
    confidence_score = Column(Float)
    language = Column(String(10), default="en")
    duration_seconds = Column(Float)
    created_at = Column(DateTime, default=func.now())

    def __repr__(self):
        return f"<VoiceInteraction(id={self.id}, student='{self.student_id}', duration={self.duration_seconds})>"

class VisualAid(Base):
    """Generated visual aids and diagrams."""
    __tablename__ = "visual_aids"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(50), ForeignKey("conversations.id"))
    question_answer_id = Column(Integer, ForeignKey("question_answers.id"))
    aid_type = Column(String(50))  # 'diagram', 'flowchart', 'equation', etc.
    description = Column(Text)
    content = Column(Text)  # SVG, image data, or generation prompt
    format = Column(String(20))  # 'svg', 'png', 'latex', etc.
    generated_at = Column(DateTime, default=func.now())

    def __repr__(self):
        return f"<VisualAid(id={self.id}, type='{self.aid_type}', format='{self.format}')>"

# Learning Dialogue Tables

class LearningDialogue(Base):
    """Structured learning conversations."""
    __tablename__ = "learning_dialogues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(50), nullable=False)
    topic = Column(String(200), nullable=False)
    dialogue_type = Column(String(50))  # 'concept_explanation', 'problem_solving', 'review'
    objectives = Column(JSON)  # Learning objectives
    completed_objectives = Column(JSON)  # Completed objectives
    status = Column(String(20), default="active")  # 'active', 'completed', 'paused'
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
    metadata = Column(JSON)

    # Relationships
    steps = relationship("DialogueStep", back_populates="dialogue", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LearningDialogue(id={self.id}, student='{self.student_id}', topic='{self.topic}', status='{self.status}')>"

class DialogueStep(Base):
    """Individual steps within learning dialogues."""
    __tablename__ = "dialogue_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dialogue_id = Column(Integer, ForeignKey("learning_dialogues.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    step_type = Column(String(50))  # 'explanation', 'question', 'practice', 'feedback'
    content = Column(Text, nullable=False)
    expected_response = Column(Text)
    student_response = Column(Text)
    evaluation = Column(JSON)  # Response evaluation
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)

    # Relationships
    dialogue = relationship("LearningDialogue", back_populates="steps")

    def __repr__(self):
        return f"<DialogueStep(id={self.id}, dialogue={self.dialogue_id}, step={self.step_number}, type='{self.step_type}')>"

# Enhanced User Preferences

class UserConversationPreferences(Base):
    """User preferences for conversational interactions."""
    __tablename__ = "user_conversation_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, unique=True)
    communication_style = Column(String(20), default="balanced")  # 'formal', 'casual', 'balanced'
    verbosity_level = Column(String(20), default="medium")  # 'brief', 'medium', 'detailed'
    pace_preference = Column(String(20), default="medium")  # 'slow', 'medium', 'fast'
    visual_learning = Column(Boolean, default=True)
    voice_interaction = Column(Boolean, default=False)
    language = Column(String(10), default="en")
    timezone = Column(String(50))
    notification_preferences = Column(JSON)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<UserConversationPreferences(user_id='{self.user_id}', style='{self.communication_style}')>"

# Analytics and Insights Tables

class ConversationAnalytics(Base):
    """Analytics data for conversations."""
    __tablename__ = "conversation_analytics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(50), ForeignKey("conversations.id"), nullable=False)
    metric_type = Column(String(50))  # 'engagement', 'learning_velocity', 'sentiment_trend'
    metric_value = Column(Float)
    time_window = Column(String(20))  # 'message', 'session', 'day', 'week'
    calculated_at = Column(DateTime, default=func.now())

    def __repr__(self):
        return f"<ConversationAnalytics(id={self.id}, type='{self.metric_type}', value={self.metric_value})>"

class LearningInsight(Base):
    """Generated learning insights."""
    __tablename__ = "learning_insights"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    insight_type = Column(String(50))  # 'strength', 'weakness', 'pattern', 'recommendation'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Float)
    related_conversations = Column(JSON)  # Conversation IDs
    related_topics = Column(JSON)  # Topic names
    actionable = Column(Boolean, default=True)
    generated_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime)  # When insight becomes stale

    def __repr__(self):
        return f"<LearningInsight(id={self.id}, student='{self.student_id}', type='{self.insight_type}', title='{self.title}')>"

# Extend existing User model with conversation preferences
# Note: This would be handled by Alembic migration to add columns to existing users table

# Migration helper functions
def create_phase7_tables(engine):
    """Create all Phase 7 tables."""
    Base.metadata.create_all(engine)

def drop_phase7_tables(engine):
    """Drop all Phase 7 tables."""
    Base.metadata.drop_all(engine)

# Table creation order for proper foreign key relationships
PHASE7_TABLES = [
    Conversation,
    ConversationMessage,
    MessageAnalysis,
    ConversationAnalysis,
    QuestionAnswer,
    AnswerEvaluation,
    VoiceInteraction,
    VisualAid,
    LearningDialogue,
    DialogueStep,
    UserConversationPreferences,
    ConversationAnalytics,
    LearningInsight
]
