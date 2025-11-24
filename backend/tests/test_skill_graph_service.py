import pytest
from services.skill_graph_service import SkillGraphService
from models import SkillNode

@pytest.fixture
def skill_graph_service():
    return SkillGraphService()

@pytest.fixture
def sample_skills():
    return [
        SkillNode(skill_id="1", name="Python Basics", level="beginner"),
        SkillNode(skill_id="2", name="Functions", level="intermediate"),
        SkillNode(skill_id="3", name="Classes", level="advanced"),
        SkillNode(skill_id="4", name="Error Handling", level="intermediate")
    ]

def test_add_skill(skill_graph_service, sample_skills):
    skill = sample_skills[0]
    skill_graph_service.add_skill(skill)
    assert skill.skill_id in skill_graph_service.graph.nodes

def test_add_prerequisite(skill_graph_service, sample_skills):
    skill1, skill2 = sample_skills[0], sample_skills[1]
    skill_graph_service.add_skill(skill1)
    skill_graph_service.add_skill(skill2)
    skill_graph_service.add_prerequisite(skill1.skill_id, skill2.skill_id)
    assert skill_graph_service.graph.has_edge(skill1.skill_id, skill2.skill_id)

def test_get_prerequisites(skill_graph_service, sample_skills):
    # Create a chain: Python Basics -> Functions -> Classes
    for skill in sample_skills[:3]:
        skill_graph_service.add_skill(skill)
    skill_graph_service.add_prerequisite(sample_skills[0].skill_id, sample_skills[1].skill_id)
    skill_graph_service.add_prerequisite(sample_skills[1].skill_id, sample_skills[2].skill_id)

    prereqs = skill_graph_service.get_prerequisites(sample_skills[2].skill_id)
    assert len(prereqs) == 2
    assert sample_skills[0].skill_id in prereqs
    assert sample_skills[1].skill_id in prereqs

def test_get_skill_path(skill_graph_service, sample_skills):
    # Create a graph with multiple paths
    for skill in sample_skills:
        skill_graph_service.add_skill(skill)

    # Path 1: Python Basics -> Functions -> Classes
    skill_graph_service.add_prerequisite(sample_skills[0].skill_id, sample_skills[1].skill_id)
    skill_graph_service.add_prerequisite(sample_skills[1].skill_id, sample_skills[2].skill_id)

    # Path 2: Python Basics -> Error Handling -> Classes
    skill_graph_service.add_prerequisite(sample_skills[0].skill_id, sample_skills[3].skill_id)
    skill_graph_service.add_prerequisite(sample_skills[3].skill_id, sample_skills[2].skill_id)

    path = skill_graph_service.get_skill_path(sample_skills[0].skill_id, sample_skills[2].skill_id)
    assert path is not None
    assert len(path) == 3  # shortest path: 1 -> 2 -> 3
    assert path[0] == sample_skills[0].skill_id
    assert path[-1] == sample_skills[2].skill_id

def test_detect_cycles(skill_graph_service, sample_skills):
    # Add skills in a cycle
    for skill in sample_skills[:3]:
        skill_graph_service.add_skill(skill)

    skill_graph_service.add_prerequisite(sample_skills[0].skill_id, sample_skills[1].skill_id)
    skill_graph_service.add_prerequisite(sample_skills[1].skill_id, sample_skills[2].skill_id)

    with pytest.raises(ValueError):
        # This would create a cycle
        skill_graph_service.add_prerequisite(sample_skills[2].skill_id, sample_skills[0].skill_id)

def test_validate_skill_levels(skill_graph_service, sample_skills):
    skill1, skill2 = sample_skills[0], sample_skills[2]  # level 1 and level 3
    skill_graph_service.add_skill(skill1)
    skill_graph_service.add_skill(skill2)

    # Should not allow prerequisite from higher to lower level
    with pytest.raises(ValueError):
        skill_graph_service.add_prerequisite(skill2.skill_id, skill1.skill_id)
