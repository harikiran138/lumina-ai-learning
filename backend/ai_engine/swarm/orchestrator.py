from typing import Any, Dict, Optional

from app.store.ai_tutor_store import AITutorStore
from ai_engine.swarm.pathway import PathwayAgent


def _infer_mode(message: str) -> str:
    lowered = (message or "").lower()
    if any(token in lowered for token in ("quiz", "mcq", "test me", "multiple choice")):
        return "quiz"
    if any(token in lowered for token in ("code", "debug", "python", "javascript", "java", "sql")):
        return "code"
    if any(token in lowered for token in ("hint", "guide me", "don't tell me", "dont tell me")):
        return "interactive"
    return "explain"


class Orchestrator:
    """
    Runtime adapter that routes tutor requests through the maintained service layer.
    """

    def __init__(self, provider: str = "auto"):
        self.provider = provider
        self.tutor_store = AITutorStore()
        self.pathway_agent = PathwayAgent()

    async def route_request(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        learner_profile: Optional[Dict[str, Any]] = None,
    ) -> Any:
        safe_context = context or {}
        filters = safe_context.get("filters") or {}
        merged_context = {
            **filters,
            "topic": safe_context.get("topic") or filters.get("topic"),
            "subject": filters.get("subject"),
        }
        history = safe_context.get("history") or []
        student_id = safe_context.get("user_id")

        lowered = (message or "").lower()
        if any(token in lowered for token in ("next topic", "what next", "study next", "next step")):
            return self.pathway_agent.recommend_next_node(
                learner_profile or {},
                {"topic": safe_context.get("topic")},
            )

        return await self.tutor_store.get_response(
            prompt=message,
            history=history,
            context=merged_context,
            mode=_infer_mode(message),
            student_id=student_id,
        )
