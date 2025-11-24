"""Tests for real-time analytics service"""
import pytest
import json
from datetime import datetime
from tests.models import TestUser as User
from tests.models import TestCourse as Course
from tests.models import TestSkill as Skill
from tests.models import TestSkillLevel as SkillLevel
from tests.models import TestLearningPathway as LearningPathway
from services.realtime_analytics import RealTimeAnalytics
from services.websocket_service import ConnectionManager

@pytest.fixture
def websocket_manager():
    return ConnectionManager()

@pytest.fixture
def analytics_service(websocket_manager):
    analytics = RealTimeAnalytics()
    analytics.add_subscriber(websocket_manager)
    websocket_manager.analytics = analytics
    return analytics

@pytest.fixture
def setup_test_data(test_db):
    """Setup test data for analytics testing"""
    try:
        # Create test user
        user = User(
            id="test_analytics_user",
            name="Test Analytics User",
            email="test_analytics@example.com",
            role="student"
        )
        test_db.add(user)
        test_db.flush()  # Ensure user exists before creating related data
        
        # Create test course
        course = Course(
            id="test_analytics_course",
            name="Test Analytics Course",
            description="Test course for analytics",
            teacher_id="test_teacher",
            status="active"
        )
        test_db.add(course)
        test_db.flush()  # Ensure course exists before creating related data
        
        # Create test skills
        skills = []
        for i in range(5):
            skill = Skill(
                skill_id=f"analytics_skill_{i}",
                name=f"Skill {i}",
                level=str(i + 1),
                category="test",
                created_at=datetime.utcnow()
            )
            skills.append(skill)
        test_db.add_all(skills)
        test_db.flush()  # Ensure skills exist before creating related data
        
        # Create skill levels
        skill_levels = []
        for i, skill in enumerate(skills):
            level = SkillLevel(
                id=f"level_{i}",
                student_id=user.id,
                skill_id=skill.skill_id,
                level=float(i) / 4.0,  # Levels from 0.0 to 1.0
                last_assessed=datetime.utcnow()
            )
            skill_levels.append(level)
        test_db.add_all(skill_levels)
        test_db.flush()
        
        # Create learning pathway
        pathway = LearningPathway(
            id="test_analytics_pathway",
            student_id=user.id,
            course_id=course.id,
            pathway_data=json.dumps({
                "skills": [{"id": s.skill_id, "level": s.level} for s in skills],
                "groups": [[i] for i in range(len(skills))],
                "prerequisites": {}
            }),
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        test_db.add(pathway)
        
        test_db.commit()
        
        return {
            'user': user,
            'course': course,
            'skills': skills,
            'skill_levels': skill_levels,
            'pathway': pathway
        }
    except:
        test_db.rollback()
        raise

@pytest.mark.asyncio
async def test_track_student_progress(test_db, analytics_service, setup_test_data):
    """Test real-time progress tracking"""
    user = setup_test_data['user']
    course = setup_test_data['course']
    skill = setup_test_data['skills'][0]
    
    progress_data = {
        'new_level': 0.8,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    await analytics_service.track_student_progress(
        user.id,
        course.id,
        skill.skill_id,
        progress_data
    )
    
    # Verify skill level was updated
    updated_level = test_db.query(SkillLevel).filter(
        SkillLevel.student_id == user.id,
        SkillLevel.skill_id == skill.skill_id
    ).first()
    
    assert updated_level is not None
    assert float(updated_level.level) == 0.8

@pytest.mark.asyncio
async def test_calculate_progress_analytics(test_db, analytics_service, setup_test_data):
    """Test progress analytics calculation"""
    user = setup_test_data['user']
    course = setup_test_data['course']
    skill = setup_test_data['skills'][0]
    
    analytics = await analytics_service.calculate_progress_analytics(
        user.id,
        course.id,
        skill.skill_id
    )
    
    assert analytics is not None
    assert 'total_skills' in analytics
    assert 'completion_rate' in analytics
    assert 'average_level' in analytics
    assert 'learning_rate' in analytics
    assert 'pathway_progress' in analytics

@pytest.mark.asyncio
async def test_analyze_pathway_effectiveness(test_db, analytics_service, setup_test_data):
    """Test pathway effectiveness analysis"""
    course = setup_test_data['course']
    
    analysis = await analytics_service.analyze_pathway_effectiveness(
        course.id,
        time_window=7
    )
    
    assert analysis is not None
    assert 'average_completion_time' in analysis
    assert 'average_skill_level' in analysis
    assert 'completion_rate_mean' in analysis
    assert 'total_students' in analysis

@pytest.mark.asyncio
async def test_detect_learning_patterns(test_db, analytics_service, setup_test_data):
    """Test learning pattern detection"""
    user = setup_test_data['user']
    course = setup_test_data['course']
    
    patterns = await analytics_service.detect_learning_patterns(
        user.id,
        course.id
    )
    
    assert patterns is not None
    assert 'avg_time_between_levels' in patterns
    assert 'time_consistency' in patterns
    assert 'learning_style' in patterns
    assert 'preferred_hours' in patterns

@pytest.mark.asyncio
async def test_generate_insights(test_db, analytics_service, setup_test_data):
    """Test insight generation"""
    user = setup_test_data['user']
    course = setup_test_data['course']
    
    insights = await analytics_service.generate_insights(
        user.id,
        course.id
    )
    
    assert len(insights) > 0
    for insight in insights:
        assert 'type' in insight
        assert 'message' in insight
        assert 'data' in insight

@pytest.mark.asyncio
async def test_analytics_broadcast(test_db, analytics_service, setup_test_data):
    """Test analytics broadcasting"""
    
    # Start analytics broadcast in background
    import asyncio
    broadcast_task = asyncio.create_task(
        analytics_service.start_analytics_broadcast(interval=1)
    )
    
    # Wait for a broadcast cycle
    await asyncio.sleep(2)
    
    # Cancel the broadcast task
    broadcast_task.cancel()
    try:
        await broadcast_task
    except asyncio.CancelledError:
        pass
    
    # Verify that analytics were broadcasted
    # This would typically be verified through the WebSocket manager
    # but for testing we just ensure no exceptions were raised