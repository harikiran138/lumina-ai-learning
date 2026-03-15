from typing import List, Optional, Dict, Any

from app.pathway.optimizer import CurriculumOptimizer
from app.personalization.schemas import LearnerProfileRecord


def build_remediation_plan(
    topic: str,
    profile: LearnerProfileRecord,
    misconceptions: Optional[List[str]] = None,
    course_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates a simple remediation plan using knowledge graph + profile evidence.
    """
    misconceptions = misconceptions or []

    weak_concepts: List[str] = []
    if topic:
        weak_concepts.append(topic)
    weak_concepts.extend([m for m in misconceptions if m not in weak_concepts])
    weak_concepts.extend([w for w in profile.weak_topics if w not in weak_concepts])

    mastered = [
        concept
        for concept, mastery in profile.mastery_state.items()
        if mastery.score >= 0.75
    ]

    optimizer = CurriculumOptimizer(course_id) if course_id else CurriculumOptimizer.get_fallback_optimizer()
    next_concept = optimizer.get_optimal_next_concept(mastered)

    return {
        "weak_concepts": weak_concepts[:5],
        "recommended_concepts": [next_concept] if next_concept else [],
        "source": "assessment_engine",
    }
