from .store.state import StateStore
from .models.bkt import BKTModel
from .models.dkt import DKTModel
from .analysis.cognitive_load import CognitiveLoadEstimator
import asyncio

class LearnerProfileEngine:
    """
    Core engine for user modeling and state tracking.
    Integrates BKT, DKT, and Cognitive Load estimation.
    """

    def __init__(self):
        self.state_store = StateStore()
        self.bkt = BKTModel()
        self.dkt = DKTModel()
        self.cognitive_load_estimator = CognitiveLoadEstimator()

    async def update_state(self, user_id: str, event: dict):
        """
        Update the learner's state based on an interaction event.
        Event structure: {'type': str, 'concept_id': int, 'correct': bool, 'response_time': float, ...}
        """
        current_state = await self.state_store.get_state(user_id)
        
        # 1. Update BKT mastery
        if event.get('type') == 'interaction' and 'concept_id' in event:
            concept_id = str(event['concept_id'])
            mastery_scores = current_state.get('mastery_scores', {})
            current_mastery = mastery_scores.get(concept_id, self.bkt.p_l0)
            
            new_mastery = self.bkt.update_mastery(current_mastery, event.get('correct', False))
            mastery_scores[concept_id] = new_mastery
            current_state['mastery_scores'] = mastery_scores

        # 2. Update interaction history for DKT
        history = current_state.get('interaction_history', [])
        if event.get('type') == 'interaction':
            history.append({
                'concept_id': event.get('concept_id'),
                'correct': event.get('correct'),
                'timestamp': event.get('timestamp')
            })
            # Keep history manageable
            current_state['interaction_history'] = history[-50:]

        # 3. Estimate Cognitive Load
        recent_events = current_state['interaction_history'][-5:]
        current_state['cognitive_load'] = self.cognitive_load_estimator.estimate_load(recent_events)

        # 4. Update behavior labels
        if "behavior" in event:
            current_state["behavior_label"] = event["behavior"]

        await self.state_store.update_state(user_id, current_state)

    async def get_summary(self, user_id: str):
        profile = await self.get_profile(user_id)
        return {
            "mastery": profile["mastery_levels"],
            "load": profile["cognitive_load"],
            "behavior": profile["behavior_label"]
        }

    async def get_profile(self, user_id: str) -> dict:
        """
        Retrieve the full learner profile including DKT predictions.
        """
        state = await self.state_store.get_state(user_id)
        
        # Add DKT predictions to the profile for the pathway agent
        history = state.get('interaction_history', [])
        state['dkt_predictions'] = self.dkt.predict_mastery(history)
        
        return state

_engine_instance = None

def get_learner_profile_engine():
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = LearnerProfileEngine()
    return _engine_instance
