from typing import Dict, Any, Optional
from app.services.personalization_service import PersonalizationService
from app.personalization.schemas import LearningEventType, LearnerProfileRecord
from app.personalization.adaptive_engine import ActivityType
from app.assessment.models.schemas import QuestionRequest, QuestionFormat

class AdaptiveQuestionService:
    """
    Bridges the Intelligence Controller (AdaptiveEngine) with the Content Delivery (Question/Tutor services).
    This completes the 'Decide -> Generate -> Deliver' phase of the loop.
    """
    
    def __init__(self, personalization_service: PersonalizationService):
        self.ps = personalization_service
        # Other services would be injected here in a full system
        # self.question_service = question_service
        # self.tutor_service = tutor_service

    async def get_next_interactive_step(self, user_id: str, last_topic: str) -> Dict[str, Any]:
        """
        The main entry point for the frontend to ask 'What should I do next?'.
        """
        # 1. Fetch current profile
        profile = await self.ps.get_profile(user_id)
        
        # 2. Re-evaluate the state if needed
        # (This can also be done on-the-fly inside record_event)
        event_result = await self.ps.record_event(
            user_id=user_id,
            event_type=LearningEventType.PROFILE_UPDATED,
            payload={"reason": "fetching_next_active_step"},
            topic_id=last_topic
        )
        
        next_step = event_result["next_step"]
        activity_type = next_step["activity_type"]
        
        # 3. Decision Branching (The 'Deliver' Phase)
        delivery_payload = {
            "type": activity_type,
            "topic_id": next_step["topic_id"],
            "difficulty": next_step["difficulty"],
            "reason": next_step.get("reason"),
        }
        
        if activity_type == ActivityType.ASSESSMENT:
            # In a real implementation:
            # question = await self.question_service.generate_dynamic_question(
            #     topic=next_step["topic_id"],
            #     difficulty=next_step["difficulty"]
            # )
            # delivery_payload["content"] = question
            delivery_payload["action"] = "START_QUIZ"
            delivery_payload["recommendation"] = f"Take a level {round(next_step['difficulty'], 2)} quiz on {next_step['topic_id']}"
            
        elif activity_type == ActivityType.EXPLANation:
            delivery_payload["action"] = "START_EXPLANATION"
            delivery_payload["plan"] = next_step.get("explanation_plan")
            delivery_payload["recommendation"] = f"Let's review {next_step['topic_id']} using a {next_step.get('explanation_plan', {}).get('mode', 'Standard')} approach."
            
        elif activity_type == ActivityType.REMEDIATION:
            delivery_payload["action"] = "START_REMEDIATION"
            delivery_payload["recommendation"] = "You're hitting a lag zone. Let's try a visual simplified walkthrough."
            
        elif activity_type == ActivityType.CHALLENGE:
            delivery_payload["action"] = "START_CHALLENGE"
            delivery_payload["recommendation"] = "You're crushing it! Ready for a deep-dive challenge?"
            
        return delivery_payload

adaptive_question_service = None # Dependency Injection Placeholder
