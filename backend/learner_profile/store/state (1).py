from typing import Dict
from app.database.manager import db
from app.core.logging import structlog

log = structlog.get_logger()


class StateStore:
    """
    MongoDB State Manager for Learner Profiles.
    """

    def __init__(self):
        pass

    @property
    def collection(self):
        return db.get_collection("learner_profiles")

    async def get_state(self, user_id: str) -> Dict:
        if self.collection is None:
            # Fallback for disconnected state
            log.warning("learner_profile_db_disconnected", user_id=user_id)
            return self._get_default_state(user_id)

        doc = await self.collection.find_one({"user_id": user_id})
        if not doc:
            return self._get_default_state(user_id)
        return doc

    async def update_state(self, user_id: str, new_state: Dict):
        if self.collection is None:
            log.error("learner_profile_update_failed_db_disconnected", user_id=user_id)
            return

        # Ensure user_id is set
        new_state["user_id"] = user_id

        await self.collection.replace_one({"user_id": user_id}, new_state, upsert=True)

    def _get_default_state(self, user_id: str) -> Dict:
        return {
            "user_id": user_id,
            "mastery": {},
            "behavior_label": "neutral",
            "pathway_state": "exploring",
            "assignments": [],
            "notes": [],
        }
