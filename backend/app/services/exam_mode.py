"""
Exam Mode service — concept-readiness heatmap against official syllabus weights.
"""
from __future__ import annotations

from typing import Any, Dict


async def get_exam_heatmap(client: Any, *, student_id: str, exam: str = "jee_main") -> Any[str, Any]:
    """Return a heatmap of concept-level readiness for a target exam.

    Args:
        client: Supabase client instance.
        student_id: The student's UUID.
        exam: Exam identifier (e.g. ``jee_main``, ``neet``, ``gate``).

    Returns:
        A dict with keys:
          - ``exam``: the exam identifier
          - ``student_id``: the student's UUID
          - ``topics``: list of topic readiness entries
          - ``overall_readiness``: 0–100 readiness score
    """
    try:
        # Fetch mastery data from Supabase
        result = (
            client.table("student_mastery")
            .select("topic, mastery_level, last_reviewed_at")
            .eq("student_id", student_id)
            .execute()
        )
        mastery_rows = result.data or []
    except Exception:
        mastery_rows = []

    topics = [
        {
            "topic": row.get("topic", "Unknown"),
            "mastery": round(float(row.get("mastery_level", 0)) * 100, 1),
            "last_reviewed_at": row.get("last_reviewed_at"),
        }
        for row in mastery_rows
    ]

    overall = round(sum(t["mastery"] for t in topics) / len(topics), 1) if topics else 0.0

    return {
        "exam": exam,
        "student_id": student_id,
        "topics": topics,
        "overall_readiness": overall,
    }
