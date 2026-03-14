from app.services.personalization_service import get_personalization_service
from app.personalization.schemas import LearningEventType, AssessmentAnswerPayload
from .models.dkt import DKTModel
import asyncio

class LearnerProfileEngine:
    """
    Core engine for user modeling and state tracking.
    Now acts as a wrapper around the canonical PersonalizationService pipeline.
    Legacy DKT estimations are preserved here mapping from the canonical event list.
    """

    def __init__(self):
        self.dkt = DKTModel()
        self.personalization_service = get_personalization_service()

    async def update_state(self, user_id: str, event: dict):
        """
        Update the learner's state based on an interaction event.
        Delegates up to PersonalizationService.
        """
        if event.get('type') == 'interaction' and 'concept_id' in event:
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
        
        tutor_proj['interaction_history'] = history
        tutor_proj['dkt_predictions'] = self.dkt.predict_mastery(history)
        
        # Map mastery array for legacy compatibility
        tutor_proj['mastery_levels'] = tutor_proj.get('mastery_scores', {})
        
        return tutor_proj

_engine_instance = None

def get_learner_profile_engine():
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = LearnerProfileEngine()
    return _engine_instance
