"""
Phase 6 Database Models
Additional models for Phase 6 features.
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class RealTimeAdaptation(Base):
    """Tracks real-time pathway adaptations."""
    __tablename__ = 'realtime_adaptations'

    id = Column(String(36), primary_key=True)
    student_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    pathway_id = Column(String(36), ForeignKey('learning_pathways.id'), nullable=False)
    adaptation_type = Column(String(50), nullable=False)
    trigger_data = Column(Text)  # JSON
    applied_changes = Column(Text)  # JSON
    effectiveness_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="adaptations")
    pathway = relationship("LearningPathway", back_populates="adaptations")


class StudyGroup(Base):
    """Represents collaborative study groups."""
    __tablename__ = 'study_groups'

    id = Column(String(36), primary_key=True)
    course_id = Column(String(50), ForeignKey('courses.id'), nullable=False)
    name = Column(String(200), nullable=False)
    skill_focus = Column(String(100))
    description = Column(Text)
    max_size = Column(Integer, default=5, nullable=False)
    created_by = Column(String(50), ForeignKey('users.id'), nullable=False)
    status = Column(String(50), default='active', nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    course = relationship("Course", back_populates="study_groups")
    creator = relationship("User", back_populates="created_groups")
    members = relationship("GroupMember", back_populates="group")
    activities = relationship("GroupActivity", back_populates="group")


class GroupMember(Base):
    """Members of study groups."""
    __tablename__ = 'group_members'

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('study_groups.id'), nullable=False)
    student_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime)
    status = Column(String(50), default='active', nullable=False)
    role = Column(String(50), default='member', nullable=False)

    # Relationships
    group = relationship("StudyGroup", back_populates="members")
    student = relationship("User", back_populates="group_memberships")

    __table_args__ = (
        UniqueConstraint('group_id', 'student_id', name='unique_group_student'),
    )


class GroupActivity(Base):
    """Activities within study groups."""
    __tablename__ = 'group_activities'

    id = Column(String(36), primary_key=True)
    group_id = Column(String(36), ForeignKey('study_groups.id'), nullable=False)
    student_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    activity_type = Column(String(50), nullable=False)
    activity_data = Column(Text)  # JSON
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("StudyGroup", back_populates="activities")
    student = relationship("User", back_populates="group_activities")


class PredictiveAnalytic(Base):
    """Stores predictive analytics results."""
    __tablename__ = 'predictive_analytics'

    id = Column(String(36), primary_key=True)
    student_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    course_id = Column(String(50), ForeignKey('courses.id'), nullable=False)
    prediction_type = Column(String(50), nullable=False)
    prediction_value = Column(Float, nullable=False)
    confidence_score = Column(Float)
    feature_importance = Column(Text)  # JSON
    prediction_horizon = Column(Integer)  # days
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="predictive_analytics")
    course = relationship("Course", back_populates="predictive_analytics")


class MLModelVersion(Base):
    """Tracks versions of ML models used in the system."""
    __tablename__ = 'ml_model_versions'

    id = Column(String(36), primary_key=True)
    model_name = Column(String(100), nullable=False)
    version = Column(String(20), nullable=False)
    algorithm = Column(String(50), nullable=False)
    parameters = Column(Text)  # JSON
    performance_metrics = Column(Text)  # JSON
    training_data_size = Column(Integer)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('model_name', 'version', name='unique_model_version'),
    )


# Extensions to existing models would be added here
# These would extend the existing User, Course, LearningPathway, etc. models

# Note: In practice, these relationships would be added to the existing model files
# This file shows the new models for Phase 6 features
