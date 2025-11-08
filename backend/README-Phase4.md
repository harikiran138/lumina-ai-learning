# Phase 4 Documentation

## Database Migrations

### New Tables
- `skills`: Core skills/concepts that students can learn
- `skill_prerequisites`: Prerequisite relationships between skills
- `learning_pathways`: Generated learning paths for students
- `checkpoints`: Progress points within learning pathways
- `skill_levels`: Student achievement levels for skills
- `learning_activities`: Educational activities tied to skills
- `student_preferences`: Student learning style and pace preferences

### Running Migrations
```bash
cd backend
alembic upgrade head
```

To verify migrations:
```bash
alembic current
```

## Core Components

### SkillGraphService
Manages the skill prerequisite graph using NetworkX:
- Add/remove skills and prerequisites
- Find optimal learning paths
- Validate skill relationships
- Prevent prerequisite cycles

Example usage:
```python
from services.skill_graph_service import SkillGraphService

# Initialize service
skill_graph = SkillGraphService()

# Add skills
skill_graph.add_skill(SkillNode(id=1, name="Python Basics", level=1))
skill_graph.add_skill(SkillNode(id=2, name="Functions", level=2))

# Add prerequisite relationship
skill_graph.add_prerequisite(1, 2)  # Python Basics -> Functions

# Get learning path
path = skill_graph.get_skill_path(1, 2)
```

### PathwayGenerator
Generates personalized learning pathways:
- Uses skill graph for dependencies
- Adapts to learning styles
- Handles difficulty progression
- Creates assessment checkpoints
- Groups related skills
- Aligns with learning objectives

Example usage:
```python
from services.pathway_generator import PathwayGenerator

generator = PathwayGenerator(skill_graph)
pathway = generator.generate_pathway(
    student_id="student_1",
    target_skills=[3],  # Target skill IDs
    current_skills=[1],  # Already achieved skill IDs
    preferences=student_preferences
)
```

### PersonalizationEngine
ML-enhanced pathway optimization:
- Uses scikit-learn for pathway scoring
- Caches generated pathways
- Handles edge cases gracefully
- Adapts to student progress

Example usage:
```python
from services.personalization_engine import PersonalizationEngine

engine = PersonalizationEngine()
scored_pathway = await engine.generate_learning_pathway(
    student_id="student_1",
    target_skill_id=3,
    force_refresh=False
)
```

## Testing

Run the test suite:
```bash
cd backend
pytest tests/ -v --cov=services
```

Key test files:
- `tests/test_skill_graph_service.py`
- `tests/test_pathway_generator.py`

## Phase 5 Preparation

The following components are ready for Phase 5 integration:
1. Skill graph data structure
2. ML-based pathway scoring
3. Caching system for pathways
4. Learning style adaptation logic

Phase 5 will focus on:
1. Real-time pathway updates
2. Advanced analytics
3. Integration with external learning resources