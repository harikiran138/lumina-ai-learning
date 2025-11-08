"""Tests for pathway generation enhancements"""

import pytest
from datetime import datetime, timedelta
from tests.pathway_generation_enhancements_test import PathwayGenerationEnhancements
from tests.skill_graph_service_test import SkillGraphService
from tests.models import TestUser as User, TestCourse as Course
from tests.models import TestSkill as Skill, TestSkillLevel as SkillLevel
from tests.models import TestStudentPreference as StudentPreference
from tests.models import TestLearningPathway as LearningPathway

def test_pathway_caching(test_db):
    """Test pathway caching functionality"""
    # Create test dependencies
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    
    # Add test data
    test_student = User(
        id="test_student_cache",
        name="Test Student Cache",
        email="test_cache@example.com",
        role="student"
    )
    test_course = Course(
        id="test_course_cache",
        name="Test Course",
        description="Test course",
        teacher_id="test_teacher",
        status="active"
    )
    test_db.add_all([test_student, test_course])
    test_db.commit()
    
    # Test pathway caching
    pathway_data = {
        "skills": [{"id": "cache_skill1", "level": 1}, {"id": "cache_skill2", "level": 2}],
        "groups": [[0], [1]],
        "prerequisites": {}
    }
    
    enhancements._cache_pathway("test_student_cache", "test_course_cache", pathway_data)
    
    # Verify cache retrieval
    cached = enhancements._get_cached_pathway("test_student_cache", "test_course_cache")
    assert cached is not None
    assert cached["skills"] == pathway_data["skills"]
    assert cached["groups"] == pathway_data["groups"]

def test_skill_grouping(test_db):
    """Test skill grouping functionality"""
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    
    # Create test skills
    skills = [
        Skill(
            skill_id=f"group_skill{i}",
            name=f"Skill {i}",
            category="math",
            level=str(i // 2)
        )
        for i in range(6)
    ]
    test_db.add_all(skills)
    test_db.commit()
    
    # Test grouping
    groups = enhancements._group_related_skills(skills)
    
    # Verify groups are properly formed
    assert len(groups) > 0
    assert all(len(group) <= 3 for group in groups)  # Max group size check
    
    # Verify related skills are grouped together
    for group in groups:
        levels = [float(skill.level) for skill in group]
        assert max(levels) - min(levels) <= 1  # Level difference check

def test_learning_objective_alignment(test_db):
    """Test alignment with learning objectives"""
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    
    # Create test data
    test_student = User(
        id="test_student",
        name="Test Student",
        email="test@example.com",
        role="student"
    )
    test_db.add(test_student)
    
    preference = StudentPreference(
        student_id="test_student",
        learning_style="sequential",
        difficulty_preference="gradual"
    )
    test_db.add(preference)
    
    skills = [
        Skill(
            skill_id=f"align_skill{i}",
            name=f"Skill {i}",
            category="math",
            level=str(i)
        )
        for i in range(1, 5)
    ]
    test_db.add_all(skills)
    test_db.commit()
    
    # Create initial pathway with skill groups
    initial_pathway = [[skills[0], skills[1]], [skills[2]], [skills[3]]]
    
    # Test alignment
    aligned = enhancements._align_with_learning_objectives(
        initial_pathway,
        "test_student"
    )
    
    # Verify sequential learning style is respected
    assert all(len(group) == 1 for group in aligned)
    
    # Verify gradual progression
    levels = [float(group[0].level) for group in aligned]
    assert all(levels[i] <= levels[i+1] for i in range(len(levels)-1))

def test_edge_case_handling(test_db):
    """Test edge case handling in pathway generation"""
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    
    # Create test data
    test_student = User(
        id="test_student_edge",
        name="Test Student",
        email="test_edge@example.com",
        role="student"
    )
    test_db.add(test_student)
    
    skills = [
        Skill(
            skill_id=f"edge_skill{i}",
            name=f"Skill {i}",
            category="math",
            level=str(i)
        )
        for i in range(1, 6)
    ]
    test_db.add_all(skills)
    
    # Add some skill levels
    skill_levels = [
        SkillLevel(
            id="edge_level1",
            student_id="test_student_edge",
            skill_id=skills[0].skill_id,
            level=1.0
        )
    ]
    test_db.add_all(skill_levels)
    test_db.commit()
    
    # Test empty pathway handling
    empty_pathway = []
    fallback = enhancements.handle_edge_cases(empty_pathway, "test_student")
    assert len(fallback) > 0
    
    # Test skill gap handling
    gapped_pathway = [[skills[0]], [skills[2]]]  # Missing skill1
    filled = enhancements.handle_edge_cases(gapped_pathway, "test_student")
    assert len(filled) >= len(gapped_pathway)
    
    # Test overloaded group handling
    overloaded = [[skills[0], skills[1], skills[2], skills[3], skills[4]]]
    balanced = enhancements.handle_edge_cases(overloaded, "test_student")
    assert all(len(group) <= 4 for group in balanced)

def test_prerequisite_resolution(test_db):
    """Test prerequisite conflict resolution"""
    skill_graph = SkillGraphService(db=test_db)
    enhancements = PathwayGenerationEnhancements(skill_graph)
    
    # Create skills with prerequisites
    skill1 = Skill(skill_id="prereq_skill1", name="Skill 1", level="1", category="math")
    skill2 = Skill(skill_id="prereq_skill2", name="Skill 2", level="2", category="math")
    skill3 = Skill(skill_id="prereq_skill3", name="Skill 3", level="3", category="math")
    
    test_db.add_all([skill1, skill2, skill3])
    test_db.commit()

    # Set up prerequisites
    skill3.prerequisites.append(skill2)
    skill2.prerequisites.append(skill1)
    test_db.commit()
    
    # Create pathway with prerequisite conflicts
    conflicted = [[skill3, skill1], [skill2]]
    
    # Resolve conflicts
    resolved = enhancements._resolve_prerequisite_conflicts(conflicted)
    
    # Verify proper ordering
    skill_order = [skill.skill_id for group in resolved for skill in group]
    
    # Check if prerequisites come before their dependent skills
    if "prereq_skill2" in skill_order and "prereq_skill3" in skill_order:
        assert skill_order.index("prereq_skill2") < skill_order.index("prereq_skill3")
    if "prereq_skill1" in skill_order and "prereq_skill2" in skill_order:
        assert skill_order.index("prereq_skill1") < skill_order.index("prereq_skill2")