import pytest
from services.pathway_generator import LearningPathwayGenerator

@pytest.fixture
def pathway_generator():
    return LearningPathwayGenerator()

@pytest.fixture
def sample_pathway_request():
    return {
        "student_id": "test_student_1",
        "current_skills": ["python_basics"],
        "target_skills": ["classes", "functions"],
        "learning_style": "visual",
        "difficulty": "intermediate"
    }

@pytest.mark.asyncio
async def test_generate_pathway(pathway_generator, sample_pathway_request):
    pathway = await pathway_generator.generate_pathway(**sample_pathway_request)
    assert pathway is not None
    assert "pathway" in pathway
    assert "learning_plan" in pathway
    assert "metadata" in pathway
    assert len(pathway["pathway"]) > 0

@pytest.mark.asyncio
async def test_get_next_recommended_step(pathway_generator):
    next_step = await pathway_generator.get_next_recommended_step("test_student_1", [])
    assert next_step is not None
    assert "skill" in next_step
    assert "estimated_time" in next_step

def test_filter_by_learning_style(pathway_generator):
    content = [
        {"content_type": "video", "title": "Video Lesson"},
        {"content_type": "text", "title": "Text Article"},
        {"content_type": "exercise", "title": "Interactive Exercise"}
    ]

    filtered = pathway_generator._filter_by_learning_style(content, "visual")
    assert len(filtered) > 0
    # Visual learning should prioritize video content
    assert any(item["content_type"] == "video" for item in filtered)

def test_adapt_difficulty(pathway_generator):
    content = [
        {"difficulty": "beginner", "title": "Basic Topic"},
        {"difficulty": "advanced", "title": "Advanced Topic"}
    ]

    adapted = pathway_generator._adapt_difficulty(content, "intermediate", 50.0)
    assert len(adapted) == len(content)
    # Should add adaptation metadata
    assert all("adapted_difficulty" in item for item in adapted)

def test_generate_checkpoints(pathway_generator):
    checkpoints = pathway_generator._generate_checkpoints("python_basics")
    assert len(checkpoints) > 0
    assert all("type" in cp for cp in checkpoints)
    assert all("title" in cp for cp in checkpoints)

def test_estimate_skill_time(pathway_generator):
    time_estimate = pathway_generator._estimate_skill_time("python_basics", 25.0)
    assert isinstance(time_estimate, int)
    assert time_estimate > 0

def test_score_progression(pathway_generator):
    levels = ["beginner", "intermediate", "advanced"]
    score = pathway_generator._score_progression(levels)
    assert isinstance(score, float)
    assert 0.0 <= score <= 1.0

@pytest.mark.asyncio
async def test_build_skill_graph(pathway_generator):
    skills = ["python_basics", "functions", "classes"]
    await pathway_generator._build_skill_graph(skills)
    assert len(pathway_generator.skill_graph.nodes) >= len(skills)

def test_find_optimal_path(pathway_generator):
    current_skills = ["python_basics"]
    target_skills = ["classes"]
    student_state = {
        "skill_levels": {"python_basics": 80.0},
        "completed_lessons": 5,
        "avg_mastery": 75.0,
        "current_streak": 3,
        "total_time_spent": 240,
        "learning_style": "visual",
        "recent_activities": 10
    }

    path = pathway_generator._find_optimal_path(
        current_skills, target_skills, student_state,
        "visual", "intermediate"
    )
    assert isinstance(path, list)
