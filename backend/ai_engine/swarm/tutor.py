from typing import Any, Dict, Optional


def build_tutor_degraded_response(
    topic: str,
    message: str,
    learner_profile: Optional[Dict[str, Any]] = None,
    profile_context: str = "",
    **_: Any,
) -> Dict[str, Any]:
    focus_topic = topic or "this concept"
    weak_topics = list((learner_profile or {}).get("weak_topics") or [])[:3]
    return {
        "meta": {
            "topic": focus_topic,
            "difficulty": "easy",
            "estimated_time_min": 2,
            "exportable": False,
            "subject_mode": "degraded_fallback",
        },
        "flow": [
            {
                "type": "concept",
                "title": f"Support for {focus_topic}",
                "summary": (
                    "The live AI provider is unavailable, so here is a safe fallback study direction."
                ),
                "key_points": [
                    f"Your latest request was: {message[:120]}",
                    f"Profile context: {profile_context[:120] or 'not provided'}",
                    f"Weak topics: {', '.join(weak_topics) if weak_topics else 'none detected'}",
                ],
            },
            {
                "type": "steps",
                "title": "What to do next",
                "steps": [
                    f"Review the core idea behind {focus_topic}.",
                    "Ask for a quiz or worked example once the provider is back.",
                    "Use your class notes to verify definitions and formulas.",
                ],
            },
        ],
    }
