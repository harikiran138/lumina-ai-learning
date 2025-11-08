"""
SQLAlchemy models for Lumina LMS
Based on the PostgreSQL vector schema
"""

from datetime import datetime
import uuid

from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, Float, ForeignKey, ARRAY, JSON, Enum, BigInteger, func
# Note: VECTOR type requires pgvector extension, using Text for now as fallback
# from sqlalchemy.dialects.postgresql import VECTOR
VECTOR = Text  # Placeholder until pgvector is properly installed
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

# Additional models for course enrollment and student tracking
class StudentCourseEnrollment(Base):
    __tablename__ = 'student_course_enrollments'
    
    student_id = Column(String(50), ForeignKey('users.id'), primary_key=True)
    course_id = Column(String(50), ForeignKey('courses.id'), primary_key=True)
    enrolled_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    status = Column(String(50), default='enrolled')  # enrolled, completed, dropped
    progress = Column(Float, default=0.0)
    
    # Relationships
    student = relationship("User")
    course = relationship("Course")
from sqlalchemy.sql import func
import enum

Base = declarative_base()

# Enum types
class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"

class CourseStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"

class GroupType(str, enum.Enum):
    general = "general"
    study_group = "study-group"
    course = "course"
    project = "project"

class MessageType(str, enum.Enum):
    text = "text"
    file = "file"
    image = "image"
    system = "system"

# Users table with vector embeddings
class User(Base):
    __tablename__ = 'users'

    id = Column(String(50), primary_key=True, default=lambda: f"user_{uuid.uuid4().hex[:8]}")
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.student)
    avatar = Column(String(10), default='U')
    color = Column(String(20), default='bg-blue-500')
    skills = Column(ARRAY(String), default=list)
    interests = Column(ARRAY(String), default=list)
    bio = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Vector embeddings for semantic search
    name_vector = Column(Text)         # Name semantic embedding
    skills_vector = Column(Text)       # Skills semantic embedding
    bio_vector = Column(Text)          # Bio semantic embedding
    combined_vector = Column(Text)     # Combined profile embedding

    # Relationships
    created_groups = relationship("Group", back_populates="creator")
    group_memberships = relationship("GroupMember", back_populates="user")
    messages = relationship("Message", back_populates="user")
    student_progress = relationship("StudentProgress", back_populates="student")
    assessment_scores = relationship("AssessmentScore", back_populates="student")
    interactions = relationship("UserInteraction", back_populates="user", foreign_keys="[UserInteraction.user_id]")

# Courses table for structured learning content
class Course(Base):
    __tablename__ = 'courses'

    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    teacher_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    status = Column(Enum(CourseStatus), nullable=False, default=CourseStatus.draft)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Vector embeddings for search and recommendations
    name_vector = Column(Text)
    description_vector = Column(Text)

    # Relationships
    teacher = relationship("User")
    lessons = relationship("Lesson", back_populates="course")
    assessments = relationship("Assessment", back_populates="course")
    student_progress = relationship("StudentProgress", back_populates="course")

# Lessons table, part of a course
class Lesson(Base):
    __tablename__ = 'lessons'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    course_id = Column(String(50), ForeignKey('courses.id'), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    order = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="lessons")
    assessments = relationship("Assessment", back_populates="lesson")

# Assessments table for quizzes, exams, etc.
class Assessment(Base):
    __tablename__ = 'assessments'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    course_id = Column(String(50), ForeignKey('courses.id'), nullable=False)
    lesson_id = Column(BigInteger, ForeignKey('lessons.id'))
    title = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False, default='quiz')  # 'quiz', 'exam', 'assignment'
    questions = Column(JSON)  # Store questions as JSON
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="assessments")
    lesson = relationship("Lesson", back_populates="assessments")
    scores = relationship("AssessmentScore", back_populates="assessment")

# Groups table with vector embeddings
class Group(Base):
    __tablename__ = 'groups'

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    type = Column(Enum(GroupType), nullable=False, default=GroupType.study_group)
    avatar = Column(String(10), default='📚')
    color = Column(String(20), default='bg-green-500')
    created_by = Column(String(50), ForeignKey('users.id'), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    last_activity = Column(TIMESTAMP(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    max_members = Column(Integer, default=50)
    is_private = Column(Boolean, default=False)

    # Vector embeddings for semantic search
    name_vector = Column(Text)         # Group name embedding
    description_vector = Column(Text)  # Description embedding
    topic_vector = Column(Text)        # Combined topic embedding

    # Metadata
    member_count = Column(Integer, default=0)
    message_count = Column(Integer, default=0)

    # Relationships
    creator = relationship("User", back_populates="created_groups")
    members = relationship("GroupMember", back_populates="group")
    messages = relationship("Message", back_populates="group")

# Group members junction table
class GroupMember(Base):
    __tablename__ = 'group_members'

    group_id = Column(String(50), ForeignKey('groups.id'), primary_key=True)
    user_id = Column(String(50), ForeignKey('users.id'), primary_key=True)
    joined_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    role = Column(String(20), default='member')  # member, moderator, admin
    is_active = Column(Boolean, default=True)

    # Relationships
    group = relationship("Group", back_populates="members")
    user = relationship("User", back_populates="group_memberships")

# Messages table with vector embeddings
class Message(Base):
    __tablename__ = 'messages'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(String(50), ForeignKey('groups.id'), nullable=False)
    user_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(Enum(MessageType), default=MessageType.text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    # Vector embedding for semantic search
    content_vector = Column(Text)      # Message content embedding

    # Metadata
    reply_to = Column(BigInteger, ForeignKey('messages.id'))
    mentions = Column(ARRAY(String(50)), default=list)
    attachments = Column(JSON, default=list)

    # Relationships
    group = relationship("Group", back_populates="messages")
    user = relationship("User", back_populates="messages")
    replies = relationship("Message", remote_side=[id])

# Student Progress table
class StudentProgress(Base):
    __tablename__ = 'student_progress'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    course_id = Column(String(50), ForeignKey('courses.id'), nullable=False)
    completed_lessons = Column(ARRAY(BigInteger), default=list)
    mastery_score = Column(Float, default=0)
    current_streak = Column(Integer, default=0)
    last_activity = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("User", back_populates="student_progress")
    course = relationship("Course", back_populates="student_progress")

# Assessment Scores table
class AssessmentScore(Base):
    __tablename__ = 'assessment_scores'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    assessment_id = Column(BigInteger, ForeignKey('assessments.id'), nullable=False)
    score = Column(Float, nullable=False)
    submitted_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    feedback = Column(Text)
    is_graded = Column(Boolean, default=False)

    # Relationships
    student = relationship("User", back_populates="assessment_scores")
    assessment = relationship("Assessment", back_populates="scores")

# Attendance table for tracking student attendance
class Attendance(Base):
    __tablename__ = 'attendance'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    course_id = Column(String(50), ForeignKey('courses.id'), nullable=False)
    lesson_id = Column(BigInteger, ForeignKey('lessons.id'))
    check_in_time = Column(TIMESTAMP(timezone=True), server_default=func.now())
    check_out_time = Column(TIMESTAMP(timezone=True))
    duration_minutes = Column(Integer)
    attendance_type = Column(String(20), default='lesson')  # 'lesson', 'office_hours', 'study_session'
    location = Column(String(100))  # physical location or 'online'
    notes = Column(Text)
    is_present = Column(Boolean, default=True)
    face_embedding = Column(Text)  # ArcFace embedding for verification
    confidence_score = Column(Float)  # confidence of face recognition

    # Relationships
    student = relationship("User")
    course = relationship("Course")
    lesson = relationship("Lesson")

# Streaks table for tracking learning streaks
class Streak(Base):
    __tablename__ = 'streaks'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    student_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    streak_type = Column(String(50), nullable=False)  # 'daily_login', 'course_completion', 'assessment_streak'
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity = Column(TIMESTAMP(timezone=True), server_default=func.now())
    streak_start_date = Column(TIMESTAMP(timezone=True))
    is_active = Column(Boolean, default=True)
    streak_metadata = Column(JSON, default=dict)  # additional streak-specific data

    # Relationships
    student = relationship("User")

# User interactions for recommendations
class UserInteraction(Base):
    __tablename__ = 'user_interactions'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    target_user_id = Column(String(50), ForeignKey('users.id'))
    target_group_id = Column(String(50), ForeignKey('groups.id'))
    target_message_id = Column(BigInteger, ForeignKey('messages.id'))
    interaction_type = Column(String(20), nullable=False)  # view, like, share, message, join
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Vector context for interaction
    context_vector = Column(Text)

    # Relationships
    user = relationship("User", back_populates="interactions", foreign_keys=[user_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
    target_group = relationship("Group")
    target_message = relationship("Message")

# Skills table for personalized learning pathways
class Skill(Base):
    __tablename__ = 'skills'

    skill_id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    level = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    skill_metadata = Column(JSON)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    course_id = Column(String(50), ForeignKey('courses.id'))

    # Relationships
    course = relationship("Course")
    prerequisites = relationship("SkillPrerequisite", foreign_keys="SkillPrerequisite.skill_id", back_populates="skill")
    required_by = relationship("SkillPrerequisite", foreign_keys="SkillPrerequisite.prerequisite_id", back_populates="prerequisite")
    skill_levels = relationship("SkillLevel", back_populates="skill")
    learning_activities = relationship("LearningActivity", back_populates="skill")
    checkpoints = relationship("LearningCheckpoint", back_populates="skill")

# SkillNode model for skill graph
class SkillNode(Base):
    __tablename__ = 'skill_nodes'

    skill_id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    level = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    prerequisites = Column(ARRAY(String(36)), default=list)
    estimated_time = Column(Integer)  # in minutes
    difficulty = Column(String(20), default='intermediate')
    learning_objectives = Column(ARRAY(String), default=list)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

# Skill prerequisites junction table
class SkillPrerequisite(Base):
    __tablename__ = 'skill_prerequisites'

    skill_id = Column(String(36), ForeignKey('skills.skill_id'), primary_key=True)
    prerequisite_id = Column(String(36), ForeignKey('skills.skill_id'), primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    skill = relationship("Skill", foreign_keys=[skill_id], back_populates="prerequisites")
    prerequisite = relationship("Skill", foreign_keys=[prerequisite_id], back_populates="required_by")

# Learning pathways table
class LearningPathway(Base):
    __tablename__ = 'learning_pathways'

    id = Column(String(36), primary_key=True)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    course_id = Column(String(50), ForeignKey('courses.id'), nullable=False)
    pathway_data = Column(JSON, nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(TIMESTAMP(timezone=True))

    # Relationships
    student = relationship("User")
    course = relationship("Course")
    checkpoints = relationship("LearningCheckpoint", back_populates="pathway")
    activities = relationship("LearningActivity", back_populates="pathway")

# Student skill levels table
class SkillLevel(Base):
    __tablename__ = 'skill_levels'

    id = Column(String(36), primary_key=True)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    skill_id = Column(String(36), ForeignKey('skills.skill_id'), nullable=False)
    level = Column(Float, nullable=False)
    confidence = Column(Float)
    last_assessed = Column(TIMESTAMP(timezone=True), server_default=func.now())
    assessment_history = Column(JSON)

    # Relationships
    student = relationship("User")
    skill = relationship("Skill", back_populates="skill_levels")

# Learning activities table
class LearningActivity(Base):
    __tablename__ = 'learning_activities'

    id = Column(String(36), primary_key=True)
    student_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    course_id = Column(String(50), ForeignKey('courses.id'), nullable=False)
    pathway_id = Column(String(36), ForeignKey('learning_pathways.id'))
    skill_id = Column(String(36), ForeignKey('skills.skill_id'))
    activity_type = Column(String(50), nullable=False)
    content_id = Column(String(36))
    performance_data = Column(JSON)
    duration_minutes = Column(Integer)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    student = relationship("User")
    course = relationship("Course")
    pathway = relationship("LearningPathway", back_populates="activities")
    skill = relationship("Skill", back_populates="learning_activities")

# Student preferences table
class StudentPreference(Base):
    __tablename__ = 'student_preferences'

    student_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    learning_style = Column(String(50))
    difficulty_preference = Column(String(50))
    engagement_pattern = Column(JSON)
    ui_preferences = Column(JSON)
    notification_settings = Column(JSON)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("User")

# Learning checkpoints table
class LearningCheckpoint(Base):
    __tablename__ = 'learning_checkpoints'

    id = Column(String(36), primary_key=True)
    pathway_id = Column(String(36), ForeignKey('learning_pathways.id'), nullable=False)
    skill_id = Column(String(36), ForeignKey('skills.skill_id'), nullable=False)
    checkpoint_data = Column(JSON, nullable=False)
    status = Column(String(50), nullable=False)
    score = Column(Float)
    feedback = Column(JSON)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    completed_at = Column(TIMESTAMP(timezone=True))

    # Relationships
    pathway = relationship("LearningPathway", back_populates="checkpoints")
    skill = relationship("Skill", back_populates="checkpoints")
