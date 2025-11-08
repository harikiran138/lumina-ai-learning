"""Test-specific models for SQLite"""

import uuid
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

TestBase = declarative_base()

class TestSkill(TestBase):
    __tablename__ = 'test_skills'

    skill_id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    level = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    course_id = Column(String(50), ForeignKey('test_courses.id'))

    prerequisites = relationship(
        'TestSkill',
        secondary='test_skill_prerequisites',
        primaryjoin='TestSkill.skill_id==TestSkillPrerequisite.skill_id',
        secondaryjoin='TestSkill.skill_id==TestSkillPrerequisite.prerequisite_id',
        back_populates='required_by'
    )
    required_by = relationship(
        'TestSkill',
        secondary='test_skill_prerequisites',
        primaryjoin='TestSkill.skill_id==TestSkillPrerequisite.prerequisite_id',
        secondaryjoin='TestSkill.skill_id==TestSkillPrerequisite.skill_id',
        back_populates='prerequisites'
    )

class TestSkillPrerequisite(TestBase):
    __tablename__ = 'test_skill_prerequisites'

    skill_id = Column(String(36), ForeignKey('test_skills.skill_id'), primary_key=True)
    prerequisite_id = Column(String(36), ForeignKey('test_skills.skill_id'), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Add relationships
    skill = relationship("TestSkill", foreign_keys=[skill_id])
    prerequisite = relationship("TestSkill", foreign_keys=[prerequisite_id])

class TestLearningPathway(TestBase):
    __tablename__ = 'test_learning_pathways'

    id = Column(String(36), primary_key=True)
    student_id = Column(String(50), ForeignKey('test_users.id'), nullable=False)
    course_id = Column(String(50), ForeignKey('test_courses.id'), nullable=False)
    pathway_data = Column(Text)  # Store JSON as text for SQLite
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)

class TestUser(TestBase):
    __tablename__ = 'test_users'

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(10), nullable=False)

class TestCourse(TestBase):
    __tablename__ = 'test_courses'

    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    teacher_id = Column(String(50), ForeignKey('test_users.id'), nullable=False)
    status = Column(String(10), nullable=False)

class TestSkillLevel(TestBase):
    __tablename__ = 'test_skill_levels'

    id = Column(String(36), primary_key=True)
    student_id = Column(String(50), ForeignKey('test_users.id'), nullable=False)
    skill_id = Column(String(36), ForeignKey('test_skills.skill_id'), nullable=False)
    level = Column(Float, nullable=False)
    last_assessed = Column(DateTime, default=datetime.utcnow)

class TestStudentProgress(TestBase):
    __tablename__ = 'test_student_progress'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(50), ForeignKey('test_users.id'), nullable=False)
    course_id = Column(String(50), ForeignKey('test_courses.id'), nullable=False)
    mastery_score = Column(Float, nullable=False)
    current_streak = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)
    time_spent = Column(Integer)  # seconds
    attempts = Column(Integer, default=1)

class TestStudentPreference(TestBase):
    __tablename__ = 'test_student_preferences'

    student_id = Column(String(50), ForeignKey('test_users.id'), primary_key=True)
    learning_style = Column(String(50))
    difficulty_preference = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TestAssessmentScore(TestBase):
    __tablename__ = 'test_assessment_scores'

    id = Column(String(36), primary_key=True)
    student_id = Column(String(50), ForeignKey('test_users.id'), nullable=False)
    assessment_id = Column(String(36), nullable=False)
    score = Column(Float, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    feedback = Column(Text)
    is_graded = Column(Boolean, default=False)

class TestLearningActivity(TestBase):
    __tablename__ = 'test_learning_activities'

    id = Column(String(36), primary_key=True)
    student_id = Column(String(50), ForeignKey('test_users.id'), nullable=False)
    course_id = Column(String(50), ForeignKey('test_courses.id'), nullable=False)
    pathway_id = Column(String(36))
    skill_id = Column(String(36))
    activity_type = Column(String(50), nullable=False)
    content_id = Column(String(36))
    performance_data = Column(Text)  # Store JSON as text for SQLite
    duration_minutes = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class TestStudentCourseEnrollment(TestBase):
    __tablename__ = 'test_student_course_enrollments'

    student_id = Column(String(50), ForeignKey('test_users.id'), primary_key=True)
    course_id = Column(String(50), ForeignKey('test_courses.id'), primary_key=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    status = Column(String(50), default='enrolled')
    progress = Column(Float, default=0.0)
