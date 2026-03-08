from typing import Dict

from app.core.logging import structlog
from app.services.personalization_service import get_personalization_service
from app.store.personalization_store import PersonalizationStore

log = structlog.get_logger()


class StateStore:
    """
    Backward-compatible learner profile adapter.

    Older parts of the codebase expect a loose state dictionary. This adapter
    reads and writes through the canonical personalization store so newer work
    can build on one profile source of truth.
    """

    def __init__(self):
        self.service = get_personalization_service()
        self.store = PersonalizationStore()

    async def get_state(self, user_id: str) -> Dict:
        try:
            return await self.service.get_legacy_state(user_id)
        except Exception as exc:
            log.warning("legacy_state_fetch_failed", user_id=user_id, error=str(exc))
            return self._get_default_state(user_id)

    async def update_state(self, user_id: str, new_state: Dict):
        try:
            profile = await self.service.get_profile(user_id)
            mastery_scores = new_state.get("mastery_scores") or new_state.get("mastery") or {}
            for topic_id, score in mastery_scores.items():
                topic_id = str(topic_id)
                mastery = profile.mastery_state.get(topic_id)
                if mastery:
                    mastery.score = float(score)
                else:
                    from app.personalization.schemas import ConceptMastery

                    profile.mastery_state[topic_id] = ConceptMastery(score=float(score))

            profile.behavior_signals["behavior_label"] = new_state.get(
                "behavior_label", profile.behavior_signals.get("behavior_label", "neutral")
            )
            profile.metadata["pathway_state"] = new_state.get(
                "pathway_state", profile.metadata.get("pathway_state", "exploring")
            )
            profile.metadata["skill_sequence"] = new_state.get(
                "skill_sequence", profile.metadata.get("skill_sequence", [])
            )
            profile.metadata["correct_sequence"] = new_state.get(
                "correct_sequence", profile.metadata.get("correct_sequence", [])
            )
            profile.metadata["notes"] = new_state.get("notes", profile.metadata.get("notes", []))
            profile.assignment_summary["recent_assignments"] = new_state.get(
                "assignments", profile.assignment_summary.get("recent_assignments", [])
            )
            profile.weak_topics = new_state.get("weak_topics", profile.weak_topics)
            await self.store.upsert_profile(profile)
        except Exception as exc:
            log.error("legacy_state_update_failed", user_id=user_id, error=str(exc))

    def _get_default_state(self, user_id: str) -> Dict:
        return {
            "user_id": user_id,
            "mastery": {},
            "mastery_scores": {},
            "behavior_label": "neutral",
            "pathway_state": "exploring",
            "assignments": [],
            "notes": [],
            "weak_topics": [],
            "recent_average": 0,
            "skill_sequence": [],
            "correct_sequence": [],
        }
