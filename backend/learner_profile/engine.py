from app.services.personalization_service import get_personalization_service
from app.personalization.schemas import LearningEventType, AssessmentAnswerPayload
import asyncio


class _HeuristicDKTModel:
    """
    Lightweight fallback used for application flows and tests when the
    full torch-based model is unavailable.
    """

    def __init__(self, num_concepts=100):
        self.num_concepts = num_concepts

    def predict_mastery(self, student_history: list) -> dict:
        baseline = {i: 0.1 for i in range(self.num_concepts)}
        if not student_history:
            return baseline

        totals = {}
        correct = {}
        for item in student_history:
            concept_id = int(item.get("concept_id", 0)) % self.num_concepts
            totals[concept_id] = totals.get(concept_id, 0) + 1
            correct[concept_id] = correct.get(concept_id, 0) + int(bool(item.get("correct")))

        for concept_id, attempts in totals.items():
            accuracy = correct.get(concept_id, 0) / attempts
            baseline[concept_id] = round(min(0.95, max(0.1, 0.2 + (0.7 * accuracy))), 4)

        return baseline

class LearnerProfileEngine:
    """
    Core engine for user modeling and state tracking.
    Now acts as a wrapper around the canonical PersonalizationService pipeline.
    Legacy DKT estimations are preserved here mapping from the canonical event list.
    """

    def __init__(self):
        self.dkt = _HeuristicDKTModel()
        self.personalization_service = get_personalization_service()
        self._local_history: dict[str, list[dict]] = {}

    async def update_state(self, user_id: str, event: dict):
        """
        Update the learner's state based on an interaction event.
        Delegates up to PersonalizationService.
        """
        if event.get('type') == 'interaction' and 'concept_id' in event:
            local_event = {
                'concept_id': int(event['concept_id']),
                'correct': bool(event.get('correct', False)),
                'timestamp': event.get('timestamp'),
            }
            self._local_history.setdefault(user_id, []).append(local_event)
            await self.personalization_service.record_event(
                user_id=user_id,
                event_type=LearningEventType.ASSESSMENT_ANSWER,
                payload=AssessmentAnswerPayload(
                    is_correct=event.get('correct', False),
                    topic=str(event['concept_id']),
                    time_taken=event.get('response_time'),
                    question_id="legacy-engine-event"
                ).model_dump(exclude_none=True),
                source="legacy_profile_engine",
                topic_id=str(event['concept_id'])
            )

    async def get_summary(self, user_id: str):
        tutor_proj = await self.personalization_service.get_tutor_projection(user_id)
        return {
            "mastery": tutor_proj.get("mastery_scores", {}),
            "load": tutor_proj.get("cognitive_load", 50),
            "behavior": tutor_proj.get("behavior_label", "neutral")
        }

    async def get_profile(self, user_id: str) -> dict:
        """
        Retrieve the full learner profile including DKT predictions.
        """
        tutor_proj = await self.personalization_service.get_tutor_projection(user_id)
        
        # Reconstruct interaction history for DKT from canonical events
        events = await self.personalization_service.store.list_events(user_id, limit=50)
        history = []
        
        for e in sorted(events, key=lambda x: x.created_at):
            if e.event_type == LearningEventType.ASSESSMENT_ANSWER and e.topic_id:
                history.append({
                    'concept_id': self.personalization_service._stable_topic_code(e.topic_id) % 100,
                    'correct': e.payload.get('is_correct', False),
                    'timestamp': e.created_at.isoformat()
                })

        local_history = self._local_history.get(user_id, [])
        if local_history:
            known = {
                (
                    str(item.get('concept_id')),
                    bool(item.get('correct')),
                    str(item.get('timestamp')),
                )
                for item in history
            }
            for item in local_history:
                marker = (
                    str(item.get('concept_id')),
                    bool(item.get('correct')),
                    str(item.get('timestamp')),
                )
                if marker not in known:
                    history.append(dict(item))
                    known.add(marker)

        mastery_scores = dict(tutor_proj.get('mastery_scores', {}))
        if local_history:
            concept_attempts: dict[str, list[bool]] = {}
            for item in local_history:
                concept_key = str(item['concept_id'])
                concept_attempts.setdefault(concept_key, []).append(bool(item.get('correct')))

            for concept_key, attempts in concept_attempts.items():
                accuracy = sum(1 for flag in attempts if flag) / len(attempts)
                mastery_scores[concept_key] = round(max(mastery_scores.get(concept_key, 0.0), 0.2 + (0.7 * accuracy)), 4)

        tutor_proj['interaction_history'] = history
        tutor_proj['dkt_predictions'] = self.dkt.predict_mastery(history)

        # Map mastery array for legacy compatibility
        tutor_proj['mastery_scores'] = mastery_scores
        tutor_proj['mastery_levels'] = mastery_scores

        return tutor_proj

_engine_instance = None

def get_learner_profile_engine():
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = LearnerProfileEngine()
    return _engine_instance
