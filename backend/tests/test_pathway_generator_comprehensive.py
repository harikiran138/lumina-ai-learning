"""Tests for pathway generator"""
import pytest
from datetime import datetime
from tests.models import TestUser as User
from tests.models import TestCourse as Course
from tests.models import TestSkill as Skill
from tests.models import TestLearningPathway as LearningPathway
from tests.models import TestStudentPreference as StudentPreference
from tests.pathway_generation_enhancements_test import PathwayGenerationEnhancements
from tests.skill_graph_service_test import SkillGraphService

@pytest.fixture
def setup_test_data(test_db):
    """Setup test data including users, courses, skills and preferences"""
    # Create test user
    user = User(
        id="test_user",
        name="Test User",
        email="test@example.com",
        role="student"
    )
    
    # Create test course
    course = Course(
        id="test_course",
        name="Test Course",
        description="Test course description",
        teacher_id="test_teacher",
        status="active"
    )
    
    # Create test skills
    skills = [
        Skill(
            skill_id=f"skill_{i}",
            name=f"Skill {i}",
            level=str(i),
            category="test",
            created_at=datetime.utcnow()
        )
        for i in range(1, 6)  # 5 skills with increasing levels
    ]
    
    # Create student preferences
    preferences = StudentPreference(
        student_id="test_user",
        learning_style="visual",
        difficulty_preference="gradual",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Add all to database
    test_db.add_all([user, course, preferences] + skills)
    test_db.commit()
    
    return {
        'user': user,
        'course': course,
        'skills': skills,
        'preferences': preferences
    }

def test_comprehensive_pathway_generation(test_db, setup_test_data):
    """Test complete pathway generation process"""
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    
    # Set up skill prerequisites
    skills = setup_test_data['skills']
    for i in range(len(skills) - 1):
        skill_graph.add_skill(skills[i])
        skill_graph.add_skill(skills[i + 1])
        skill_graph.add_prerequisite(skills[i].skill_id, skills[i + 1].skill_id)
    
    # Generate initial pathway
    initial_pathway = [
        [skills[0]],  # Start with first skill
        [skills[1], skills[2]],  # Group compatible skills
        [skills[3]],
        [skills[4]]  # End with most advanced skill
    ]
    
    # Test edge case handling
    handled_pathway = enhancements.handle_edge_cases(
        initial_pathway,
        setup_test_data['user'].id
    )
    
    assert handled_pathway is not None
    assert len(handled_pathway) > 0
    
    # Verify skill gaps are filled
    all_skills = {skill.skill_id for group in handled_pathway for skill in group}
    assert len(all_skills) >= len(initial_pathway)
    
    # Test learning objective alignment
    aligned_pathway = enhancements._align_with_learning_objectives(
        handled_pathway,
        setup_test_data['user'].id
    )
    
    assert aligned_pathway is not None
    assert len(aligned_pathway) > 0
    
    # Test pathway caching
    pathway_data = {
        "skills": [{"id": s.skill_id, "level": s.level} for s in skills],
        "groups": [[i] for i in range(len(skills))],
        "prerequisites": {}
    }
    
    enhancements._cache_pathway(
        setup_test_data['user'].id,
        setup_test_data['course'].id,
        pathway_data
    )
    
    cached = enhancements._get_cached_pathway(
        setup_test_data['user'].id,
        setup_test_data['course'].id
    )
    
    assert cached is not None
    assert cached["skills"] == pathway_data["skills"]
    assert cached["groups"] == pathway_data["groups"]

def test_skill_grouping_strategies(test_db, setup_test_data):
    """Test different skill grouping strategies"""
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    skills = setup_test_data['skills']
    
    # Add skills to graph
    for skill in skills:
        skill_graph.add_skill(skill)
    
    # Test related skill grouping
    groups = enhancements._group_related_skills(skills[:3])  # Use first 3 skills
    assert len(groups) > 0
    assert all(isinstance(group, list) for group in groups)
    
    # Verify group sizes are manageable
    assert all(len(group) <= 3 for group in groups)
    
    # Test prerequisite-based grouping
    skill_graph.add_prerequisite(skills[0].skill_id, skills[1].skill_id)
    prereq_groups = enhancements._group_related_skills([skills[0], skills[1]])
    assert len(prereq_groups) > 0

def test_learning_objective_adaptation(test_db, setup_test_data):
    """Test pathway adaptation based on learning objectives"""
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    skills = setup_test_data['skills']
    
    initial_pathway = [[skill] for skill in skills]  # Start sequential
    
    # Test sequential learning style
    preferences = setup_test_data['preferences']
    preferences.learning_style = "sequential"
    test_db.add(preferences)
    test_db.commit()
    
    sequential = enhancements._align_with_learning_objectives(
        initial_pathway,
        setup_test_data['user'].id
    )
    assert all(len(group) == 1 for group in sequential)
    
    # Test global learning style
    preferences.learning_style = "global"
    test_db.add(preferences)
    test_db.commit()
    
    global_pathway = enhancements._align_with_learning_objectives(
        initial_pathway,
        setup_test_data['user'].id
    )
    assert any(len(group) > 1 for group in global_pathway)

def test_difficulty_progression(test_db, setup_test_data):
    """Test difficulty progression handling"""
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    skills = setup_test_data['skills']
    
    # Test gradual progression
    preferences = setup_test_data['preferences']
    preferences.difficulty_preference = "gradual"
    test_db.add(preferences)
    test_db.commit()
    
    pathway = [[skills[0]], [skills[2]]]  # Skip level 2
    gradual = enhancements._ensure_gradual_progression(pathway)
    assert len(gradual) > len(pathway)  # Should add intermediate steps
    
    # Test challenging progression
    preferences.difficulty_preference = "challenging"
    test_db.add(preferences)
    test_db.commit()
    
    challenging = enhancements._prioritize_challenging_skills(pathway)
    assert len(challenging) > 0
    
    # Verify challenge pairs are appropriate
    for group in challenging:
        if len(group) > 1:
            levels = [float(skill.level) for skill in group]
            assert max(levels) - min(levels) <= 1.5  # Max difficulty gap

def test_edge_case_handling(test_db, setup_test_data):
    """Test various edge cases in pathway generation"""
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    
    # Test empty pathway handling
    empty_pathway = []
    fallback = enhancements.handle_edge_cases(
        empty_pathway,
        setup_test_data['user'].id
    )
    assert len(fallback) > 0

    # Test overloaded groups
    skills = setup_test_data['skills']
    overloaded = [skills[:5]]  # Put 5 skills in one group
    balanced = enhancements._balance_skill_groups(overloaded)
    assert all(len(group) <= 3 for group in balanced)
    
    # Test prerequisite conflicts
    skills = setup_test_data['skills'][:3]  # Use first 3 skills
    for skill in skills:
        skill_graph.add_skill(skill)
    
    # Create conflicting prerequisites
    skill_graph.add_prerequisite(skills[0].skill_id, skills[1].skill_id)
    skill_graph.add_prerequisite(skills[1].skill_id, skills[2].skill_id)
    
    conflicted = [[skills[2], skills[0]], [skills[1]]]
    resolved = enhancements._resolve_prerequisite_conflicts(conflicted)
    
    # Verify resolved pathway respects prerequisites
    skill_order = [skill.skill_id for group in resolved for skill in group]
    for i in range(len(skill_order) - 1):
        current = skill_order[i]
        next_skill = skill_order[i + 1]
        # Check that current is not a prerequisite of next_skill
        next_prereqs = skill_graph.get_prerequisites(next_skill)
        assert current not in [p.skill_id for p in next_prereqs]
