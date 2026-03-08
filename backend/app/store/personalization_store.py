import json
import os
from typing import Dict, List, Optional

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
    Canonical persistence layer for learner profiles, learning events,
    interventions, rubrics, and scorecards.

    Uses Supabase when available and falls back to local JSON persistence in
    limited-functionality environments.
    """

    def __init__(self):
        try:
            self.client = supabase_db.get_client()
        except Exception as exc:
            log.warning("personalization_store_unavailable", error=str(exc))
            self.client = None

        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.data_dir = os.path.join(base_dir, "data")
        os.makedirs(self.data_dir, exist_ok=True)
        self.file_path = os.path.join(self.data_dir, "personalization_store.json")

    def _read_fallback(self) -> Dict:
        if not os.path.exists(self.file_path):
            return {
                "profiles": {},
                "events": [],
                "interventions": [],
                "rubrics": {},
                "scorecards": {},
            }

        try:
            with open(self.file_path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except (json.JSONDecodeError, OSError) as exc:
            log.warning("personalization_fallback_read_failed", error=str(exc))
            return {
                "profiles": {},
                "events": [],
                "interventions": [],
                "rubrics": {},
                "scorecards": {},
            }

    def _write_fallback(self, payload: Dict):
        with open(self.file_path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)

    async def get_profile(self, user_id: str) -> Optional[LearnerProfileRecord]:
        if self.client:
            try:
                response = self.client.table("learner_profiles").select("*").eq("user_id", user_id).execute()
                if response.data:
                    return LearnerProfileRecord(**response.data[0])
            except Exception as exc:
                log.warning("learner_profile_fetch_failed", user_id=user_id, error=str(exc))

        payload = self._read_fallback()
        profile = payload["profiles"].get(user_id)
        if profile:
            return LearnerProfileRecord(**profile)
        return None

    async def upsert_profile(self, profile: LearnerProfileRecord) -> LearnerProfileRecord:
        record = profile.model_dump(mode="json")
        if self.client:
            try:
                existing = self.client.table("learner_profiles").select("user_id").eq("user_id", profile.user_id).execute()
                if existing.data:
                    self.client.table("learner_profiles").update(record).eq("user_id", profile.user_id).execute()
                else:
                    self.client.table("learner_profiles").insert(record).execute()
                return profile
            except Exception as exc:
                log.warning("learner_profile_upsert_failed", user_id=profile.user_id, error=str(exc))

        payload = self._read_fallback()
        payload["profiles"][profile.user_id] = record
        self._write_fallback(payload)
        return profile

    async def append_event(self, event: LearningEventRecord) -> LearningEventRecord:
        record = event.model_dump(mode="json")
        if self.client:
            try:
                self.client.table("learning_events").insert(record).execute()
                return event
            except Exception as exc:
                log.warning("learning_event_insert_failed", user_id=event.user_id, error=str(exc))

        payload = self._read_fallback()
        payload["events"].append(record)
        payload["events"] = payload["events"][-5000:]
        self._write_fallback(payload)
        return event

    async def list_events(self, user_id: str, limit: int = 100) -> List[LearningEventRecord]:
        if self.client:
            try:
                response = (
                    self.client.table("learning_events")
                    .select("*")
                    .eq("user_id", user_id)
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                return [LearningEventRecord(**item) for item in response.data]
            except Exception as exc:
                log.warning("learning_events_list_failed", user_id=user_id, error=str(exc))

        payload = self._read_fallback()
        events = [event for event in payload["events"] if event.get("user_id") == user_id]
        return [LearningEventRecord(**event) for event in events[-limit:]][::-1]

    async def upsert_intervention(
        self, recommendation: InterventionRecommendation
    ) -> InterventionRecommendation:
        record = recommendation.model_dump(mode="json")
        if self.client:
            try:
                existing = self.client.table("intervention_recommendations").select("id").eq("id", recommendation.id).execute()
                if existing.data:
                    self.client.table("intervention_recommendations").update(record).eq("id", recommendation.id).execute()
                else:
                    self.client.table("intervention_recommendations").insert(record).execute()
                return recommendation
            except Exception as exc:
                log.warning("intervention_upsert_failed", user_id=recommendation.user_id, error=str(exc))

        payload = self._read_fallback()
        interventions = payload["interventions"]
        interventions = [item for item in interventions if item.get("id") != recommendation.id]
        interventions.append(record)
        payload["interventions"] = interventions[-2000:]
        self._write_fallback(payload)
        return recommendation

    async def list_interventions(
        self, user_id: Optional[str] = None, limit: int = 100
    ) -> List[InterventionRecommendation]:
        if self.client:
            try:
                query = self.client.table("intervention_recommendations").select("*").order("created_at", desc=True).limit(limit)
                if user_id:
                    query = query.eq("user_id", user_id)
                response = query.execute()
                return [InterventionRecommendation(**item) for item in response.data]
            except Exception as exc:
                log.warning("interventions_list_failed", user_id=user_id, error=str(exc))

        payload = self._read_fallback()
        items = payload["interventions"]
        if user_id:
            items = [item for item in items if item.get("user_id") == user_id]
        return [InterventionRecommendation(**item) for item in items[-limit:]][::-1]

    async def upsert_rubric(self, rubric: RubricDefinition) -> RubricDefinition:
        record = rubric.model_dump(mode="json")
        if self.client:
            try:
                existing = self.client.table("assignment_rubrics").select("assignment_id").eq("assignment_id", rubric.assignment_id).execute()
                if existing.data:
                    self.client.table("assignment_rubrics").update(record).eq("assignment_id", rubric.assignment_id).execute()
                else:
                    self.client.table("assignment_rubrics").insert(record).execute()
                return rubric
            except Exception as exc:
                log.warning("rubric_upsert_failed", assignment_id=rubric.assignment_id, error=str(exc))

        payload = self._read_fallback()
        payload["rubrics"][rubric.assignment_id] = record
        self._write_fallback(payload)
        return rubric

    async def get_rubric(self, assignment_id: str) -> Optional[RubricDefinition]:
        if self.client:
            try:
                response = self.client.table("assignment_rubrics").select("*").eq("assignment_id", assignment_id).execute()
                if response.data:
                    return RubricDefinition(**response.data[0])
            except Exception as exc:
                log.warning("rubric_fetch_failed", assignment_id=assignment_id, error=str(exc))

        payload = self._read_fallback()
        rubric = payload["rubrics"].get(assignment_id)
        if rubric:
            return RubricDefinition(**rubric)
        return None

    async def upsert_scorecard(self, scorecard: SubmissionScorecard) -> SubmissionScorecard:
        record = scorecard.model_dump(mode="json")
        if self.client:
            try:
                existing = self.client.table("submission_scorecards").select("submission_id").eq("submission_id", scorecard.submission_id).execute()
                if existing.data:
                    self.client.table("submission_scorecards").update(record).eq("submission_id", scorecard.submission_id).execute()
                else:
                    self.client.table("submission_scorecards").insert(record).execute()
                return scorecard
            except Exception as exc:
                log.warning("scorecard_upsert_failed", submission_id=scorecard.submission_id, error=str(exc))

        payload = self._read_fallback()
        payload["scorecards"][scorecard.submission_id] = record
        self._write_fallback(payload)
        return scorecard

    async def get_scorecard(self, submission_id: str) -> Optional[SubmissionScorecard]:
        if self.client:
            try:
                response = self.client.table("submission_scorecards").select("*").eq("submission_id", submission_id).execute()
                if response.data:
                    return SubmissionScorecard(**response.data[0])
            except Exception as exc:
                log.warning("scorecard_fetch_failed", submission_id=submission_id, error=str(exc))

        payload = self._read_fallback()
        scorecard = payload["scorecards"].get(submission_id)
        if scorecard:
            return SubmissionScorecard(**scorecard)
        return None
