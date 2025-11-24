"""Tests for Lumnia AI Backend services"""

import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now you can import from services package
from services.analytics_service import LearningAnalytics
import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import numpy as np

@pytest.fixture(scope="session")
def test_db():
    """Create a test database"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    # Create test data
    test_student = User(
        id="test_student",
        name="Test Student",
        email="test@example.com",
        role="student"
    )
    test_course = Course(
        id="test_course",
        name="Test Course",
        description="Test course for analytics",
        teacher_id="test_teacher",
        status="active"
    )
    session.add_all([test_student, test_course])
    
    # Create student enrollment
    enrollment = StudentCourseEnrollment(
        student_id="test_student",
        course_id="test_course",
        is_active=True
    )
    session.add(enrollment)
    session.commit()
    
    def override_get_db():
        try:
            yield session
        finally:
            pass
    
    # Override the get_db dependency
    import db
    db.get_db = override_get_db
    
    return session

@pytest.fixture
def analytics_service(test_db):
    """Create analytics service instance for testing"""
    return LearningAnalytics()

@pytest.fixture
def test_session(test_db):
    """Get test database session"""
    return test_db

@pytest.fixture
def mock_student_data():
    """Mock student learning data for testing"""
    return {
        "progress": {
            "completed_lessons": [1, 2, 3],
            "mastery_scores": [75, 80, 85],
            "current_streak": 5
        },
        "assessments": [
            {
                "id": "a1",
                "score": 85,
                "topic": "math",
                "submitted_at": datetime.utcnow() - timedelta(days=5)
            },
            {
                "id": "a2",
                "score": 78,
                "topic": "algebra",
                "submitted_at": datetime.utcnow() - timedelta(days=3)
            }
        ],
        "activities": [
            {
                "id": "act1",
                "type": "lesson",
                "duration": 45,
                "completed": True,
                "created_at": datetime.utcnow() - timedelta(days=2)
            },
            {
                "id": "act2",
                "type": "practice",
                "duration": 30,
                "completed": True,
                "created_at": datetime.utcnow() - timedelta(days=1)
            }
        ]
    }

@pytest.mark.asyncio
async def test_student_analytics_calculation(analytics_service, mock_student_data):
    """Test student analytics calculation"""
    # Calculate engagement score
    engagement_score = analytics_service._calculate_engagement_score(
        mock_student_data["activities"]
    )
    assert 0 <= engagement_score <= 100

    # Test weak areas identification
    weak_areas = analytics_service._identify_weak_areas(
        mock_student_data["assessments"],
        mock_student_data["progress"]
    )
    assert isinstance(weak_areas, list)
    assert all("topic" in area for area in weak_areas)

@pytest.mark.asyncio
async def test_anomaly_detection(analytics_service, mock_student_data, test_session):
    """Test learning anomaly detection"""
    # Add test activities
    activities = [
        LearningActivity(
            id=f"activity_{i}",
            student_id="test_student",
            course_id="test_course",
            activity_type='lesson',
            duration_minutes=45,
            created_at=datetime.now()
        )
        for i in range(5)  # Create 5 normal activities
    ]

    # Add one anomalous activity (very short duration)
    activities.append(
        LearningActivity(
            id="activity_anomalous",
            student_id="test_student",
            course_id="test_course",
            activity_type='lesson',
            duration_minutes=1,
            created_at=datetime.now()
        )
    )
    
    test_session.add_all(activities)
    test_session.commit()
    
    anomalies = await analytics_service.detect_learning_anomalies(
        student_id="test_student"
    )
    
    assert "student_id" in anomalies
    assert "anomalies" in anomalies
    assert len(anomalies["anomalies"]) >= 1  # Should detect the short duration activity
    assert "recommendations" in anomalies

@pytest.mark.asyncio
async def test_class_analytics_aggregation(analytics_service, test_session):
    """Test class-level analytics aggregation"""
    # Add test students
    students = [
        User(
            id=f"student_{i}",
            name=f"Student {i}",
            email=f"student{i}@example.com",
            role="student"
        )
        for i in range(3)
    ]
    test_session.add_all(students)
    
    # Add enrollments
    enrollments = [
        StudentCourseEnrollment(
            student_id=student.id,
            course_id="test_course",
            is_active=True
        )
        for student in students
    ]
    test_session.add_all(enrollments)
    
    # Add progress data
    for student in students:
        progress = StudentProgress(
            student_id=student.id,
            course_id="test_course",
            mastery_score=float(np.random.randint(70, 95)),
            current_streak=np.random.randint(1, 10)
        )
        test_session.add(progress)
    
    test_session.commit()
    
    analytics = await analytics_service.get_class_analytics(
        course_id="test_course"
    )
    
    assert "course_id" in analytics
    assert "overview" in analytics
    assert "mastery_distribution" in analytics
    assert "engagement_patterns" in analytics
    
    # Verify overview stats
    overview = analytics["overview"]
    assert overview["total_students"] == 3
    assert 0 <= overview["average_mastery"] <= 100
    assert 0 <= overview["average_engagement"] <= 100

@pytest.mark.asyncio
async def test_caching_mechanism(analytics_service, test_session):
    """Test analytics caching functionality"""
    # Add test data
    progress = StudentProgress(
        student_id="test_student",
        course_id="test_course",
        mastery_score=85.0,
        current_streak=5
    )
    test_session.add(progress)
    test_session.commit()
    
    # First call should compute and cache
    analytics1 = await analytics_service.get_student_analytics(
        student_id="test_student"
    )
    
    assert analytics1 is not None
    assert "student_id" in analytics1
    assert analytics1["student_id"] == "test_student"
    
    # Second call within TTL should return cached data
    analytics2 = await analytics_service.get_student_analytics(
        student_id="test_student"
    )
    
    # Compare everything except timestamps
    analytics1_no_time = {k: v for k, v in analytics1.items() if k != "timestamp"}
    analytics2_no_time = {k: v for k, v in analytics2.items() if k != "timestamp"}
    assert analytics1_no_time == analytics2_no_time

@pytest.mark.asyncio
async def test_prediction_confidence(analytics_service, mock_student_data):
    """Test prediction confidence calculation"""
    features = analytics_service._prepare_prediction_features(
        mock_student_data["progress"],
        mock_student_data["assessments"]
    )
    confidence = analytics_service._calculate_prediction_confidence(features)
    assert 0 <= confidence <= 1

@pytest.mark.asyncio
async def test_learning_pattern_analysis(analytics_service, mock_student_data):
    """Test learning pattern analysis"""
    patterns = analytics_service._analyze_learning_patterns(
        mock_student_data["activities"]
    )
    assert isinstance(patterns, dict)
    assert "best_time_of_day" in patterns