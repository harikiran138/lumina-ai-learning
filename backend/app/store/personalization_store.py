from typing import Dict, List, Optional, Any
from uuid import UUID
from app.core.logging import structlog
from app.database.supabase_manager import supabase_db
from app.personalization.schemas import (
    InterventionRecommendation,
    LearnerProfileRecord,
    LearningEventRecord,
    RubricDefinition,
    SubmissionScorecard,
)

log = structlog.get_logger()


class PersonalizationStore:
    """
    Supabase persistence layer for learner profiles, learning events,
    interventions, rubrics, and scorecards.
    """

    def __init__(self, db=None):
        self.db = db or supabase_db

    def _supports_remote_user_id(self, user_id: Optional[str]) -> bool:
        if not user_id:
            return False
        try:
            UUID(str(user_id))
            return True
        except (ValueError, TypeError):
            return False

    async def get_profile(self, user_id: str) -> Optional[LearnerProfileRecord]:
        try:
            data = await self.db.fetch_one("learner_profiles", {"user_id": user_id})
            if data:
                return LearnerProfileRecord(**data)
        except Exception as exc:
            log.warning("learner_profile_fetch_failed", user_id=user_id, error=str(exc))
        return None

    async def upsert_profile(self, profile: LearnerProfileRecord) -> LearnerProfileRecord:
        record = profile.model_dump(mode="json")
        try:
            result = await self.db.upsert("learner_profiles", record, on_conflict="user_id")
            if result:
                return LearnerProfileRecord(**result)
            return profile
        except Exception as exc:
            log.warning("learner_profile_upsert_failed", user_id=profile.user_id, error=str(exc))
            return profile

    async def list_profiles(self, limit: int = 5000) -> List[LearnerProfileRecord]:
        try:
            data = await self.db.fetch_all("learner_profiles", limit=limit)
            return [LearnerProfileRecord(**item) for item in data]
        except Exception as exc:
            log.warning("learner_profiles_list_failed", limit=limit, error=str(exc))
            return []

    async def append_event(self, event: LearningEventRecord) -> LearningEventRecord:
        record = event.model_dump(mode="json")
        try:
            result = await self.db.upsert("learning_events", record, on_conflict="id")
            if result:
                return LearningEventRecord(**result)
            return event
        except Exception as exc:
            log.warning("learning_event_insert_failed", user_id=event.user_id, error=str(exc))
            return event

    async def list_events(self, user_id: str, limit: int = 100) -> List[LearningEventRecord]:
        try:
            client = self.db.get_client()
            response = await (
                client.table("learning_events")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .async_execute()
            )
            return [LearningEventRecord(**item) for item in response.data]
        except Exception as exc:
            log.warning("learning_events_list_failed", user_id=user_id, error=str(exc))
            return []

    async def upsert_intervention(
        self, recommendation: InterventionRecommendation
    ) -> InterventionRecommendation:
        record = recommendation.model_dump(mode="json")
        try:
            result = await self.db.upsert("intervention_recommendations", record, on_conflict="id")
            if result:
                return InterventionRecommendation(**result)
            return recommendation
        except Exception as exc:
            log.warning("intervention_upsert_failed", user_id=recommendation.user_id, error=str(exc))
            return recommendation

    async def list_interventions(
        self, user_id: Optional[str] = None, limit: int = 100
    ) -> List[InterventionRecommendation]:
        try:
            filters = {"user_id": user_id} if user_id else {}
            client = self.db.get_client()
            query = client.table("intervention_recommendations").select("*").order("created_at", desc=True).limit(limit)
            if user_id:
                query = query.eq("user_id", user_id)
            response = await query.async_execute()
            return [InterventionRecommendation(**item) for item in response.data]
        except Exception as exc:
            log.warning("interventions_list_failed", user_id=user_id, error=str(exc))
            return []

    async def get_intervention(self, intervention_id: str) -> Optional[InterventionRecommendation]:
        try:
            data = await self.db.fetch_one("intervention_recommendations", {"id": intervention_id})
            if data:
                return InterventionRecommendation(**data)
        except Exception as exc:
            log.warning("intervention_fetch_failed", intervention_id=intervention_id, error=str(exc))
        return None

    async def upsert_rubric(self, rubric: RubricDefinition) -> RubricDefinition:
        record = rubric.model_dump(mode="json")
        try:
            result = await self.db.upsert("assignment_rubrics", record, on_conflict="assignment_id")
            if result:
                return RubricDefinition(**result)
            return rubric
        except Exception as exc:
            log.warning("rubric_upsert_failed", assignment_id=rubric.assignment_id, error=str(exc))
            return rubric

    async def get_rubric(self, assignment_id: str) -> Optional[RubricDefinition]:
        try:
            data = await self.db.fetch_one("assignment_rubrics", {"assignment_slug": assignment_id})
            if not data:
                # Try by ID if it's a UUID
                try:
                    UUID(assignment_id)
                    data = await self.db.fetch_one("assignment_rubrics", {"id": assignment_id})
                except:
                    pass
            if data:
                return RubricDefinition(**data)
        except Exception as exc:
            log.warning("rubric_fetch_failed", assignment_id=assignment_id, error=str(exc))
        return None

    async def upsert_scorecard(self, scorecard: SubmissionScorecard) -> SubmissionScorecard:
        record = scorecard.model_dump(mode="json")
        try:
            result = await self.db.upsert("submission_scorecards", record, on_conflict="submission_id")
            if result:
                return SubmissionScorecard(**result)
            return scorecard
        except Exception as exc:
            log.warning("scorecard_upsert_failed", submission_id=scorecard.submission_id, error=str(exc))
            return scorecard

    async def get_scorecard(self, submission_id: str) -> Optional[SubmissionScorecard]:
        try:
            data = await self.db.fetch_one("submission_scorecards", {"submission_id": submission_id})
            if data:
                return SubmissionScorecard(**data)
        except Exception as exc:
            log.warning("scorecard_fetch_failed", submission_id=submission_id, error=str(exc))
        return None
