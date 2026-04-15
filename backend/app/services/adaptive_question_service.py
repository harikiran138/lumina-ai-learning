from typing import Dict, Any, Optional, List
import uuid
from datetime import datetime
from app.services.personalization_service import PersonalizationService
from app.personalization.schemas import LearningEventType, LearnerProfileRecord
from app.personalization.adaptive_engine import ActivityType, AdaptiveEngine
from app.assessment.models.schemas import QuestionRequest, QuestionFormat
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()

class AdaptiveQuestionService:
    """
    Bridges the Intelligence Controller (AdaptiveEngine) with the Content Delivery (Question/Tutor services).
    This completes the 'Decide -> Generate -> Deliver' phase of the loop.
    """
    
    def __init__(self, personalization_service: PersonalizationService):
        self.ps = personalization_service
        self.db = supabase_db

    async def get_next_interactive_step(self, user_id: str, last_topic: str) -> Dict[str, Any]:
        """
        The main entry point for the frontend to ask 'What should I do next?'.
        """
        # 1. Fetch current profile
        profile = await self.ps.get_profile(user_id)
        
        # 2. Re-evaluate the state
        # We use record_event to trigger the AdaptiveEngine update inside PersonalizationService
        profile_update = await self.ps.record_event(
            user_id=user_id,
            event_type=LearningEventType.PROFILE_UPDATED,
            payload={"reason": "fetching_next_active_step"},
            topic_id=last_topic
        )
        
        # The record_event method returns the updated profile, let's extract the recommendation
        # If record_event doesn't return the next_step directly, we call AdaptiveEngine here
        next_step = AdaptiveEngine.decide_next_step(profile, current_topic_id=last_topic)
        activity_type = next_step.activity_type
        
        # 3. Decision Branching (The 'Deliver' Phase)
        delivery_payload = {
            "type": activity_type.value if hasattr(activity_type, 'value') else activity_type,
            "topic_id": next_step.topic_id,
            "difficulty": next_step.difficulty,
            "reason": next_step.reason,
            "session_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if activity_type == ActivityType.ASSESSMENT:
            question = await self._fetch_dynamic_question(
                topic_id=next_step.topic_id,
                difficulty=next_step.difficulty
            )
            delivery_payload["content"] = question
            delivery_payload["action"] = "START_QUIZ"
            delivery_payload["recommendation"] = f"Take a level {round(next_step.difficulty, 2)} quiz on {next_step.topic_id}"
            
        elif activity_type == ActivityType.EXPLANATION:
            delivery_payload["action"] = "START_EXPLANATION"
            delivery_payload["plan"] = next_step.explanation_plan
            delivery_payload["recommendation"] = f"Let's review {next_step.topic_id} using a {next_step.explanation_plan.get('mode', 'Standard') if next_step.explanation_plan else 'Standard'} approach."
            
        elif activity_type == ActivityType.REMEDIATION:
            delivery_payload["action"] = "START_REMEDIATION"
            delivery_payload["recommendation"] = f"You're hitting a lag zone in {next_step.topic_id}. Let's try a visual simplified walkthrough."
            # In a full system, we'd fetch remediation assets here
            
        elif activity_type == ActivityType.CHALLENGE:
            delivery_payload["action"] = "START_CHALLENGE"
            delivery_payload["recommendation"] = f"You're crushing it in {next_step.topic_id}! Ready for a deep-dive challenge?"
            
        return delivery_payload

    async def _fetch_dynamic_question(self, topic_id: str, difficulty: float) -> Dict[str, Any]:
        """
        Fetches a question from the bank that matches the topic and target difficulty.
        """
        try:
            # Query question_bank if available, fallback to generation if needed
            # For now, we'll try to fetch from assessments or question table
            # Based on audit, we might not have a pool, so we generate a structured mock
            # until the content pipeline populates the DB.
            
            # Simple heuristic matching
            diff_level = "beginner" if difficulty < 0.4 else "intermediate" if difficulty < 0.7 else "advanced"
            
            # TODO: Replace with real DB query when question_bank table is populated
            # result = await self.db.fetch_one("question_bank", {"topic_id": topic_id, "difficulty_level": diff_level})
            
            return {
                "id": str(uuid.uuid4()),
                "text": f"Evaluate the core concepts of {topic_id} at a {diff_level} level.",
                "type": "MULTIPLE_CHOICE",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "difficulty_score": difficulty,
                "topic_id": topic_id
            }
        except Exception as e:
            log.error("fetch_question_failed", error=str(e), topic_id=topic_id)
            return {
                "text": "Default adaptive question",
                "options": ["A", "B"],
                "type": "BOOLEAN"
            }

def get_adaptive_question_service(ps: PersonalizationService = None) -> AdaptiveQuestionService:
    from app.services.personalization_service import get_personalization_service
    service_ps = ps or get_personalization_service()
    return AdaptiveQuestionService(service_ps)
