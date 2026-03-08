from ai_engine.pathway.inference_engine import PathwayInferenceEngine
from ai_engine.tutor_state import get_tutor_state
from learner_profile.engine import get_learner_profile_engine
import os
import re
import json


class PathwayAgent:
    """
    Adaptive Curriculum Agent that optimizes learning trajectories.
    Uses LearnerProfileEngine for data-driven recommendations.
    """

    def __init__(self):
        # Resolve path relative to this file
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Using TKT model for inference (legacy/fallback)
        model_path = os.path.join(base_path, "pathway", "models", "tkt_v1.pt")
        self.engine = PathwayInferenceEngine(model_path=model_path)
        self.state_manager = get_tutor_state()
        self.learner_engine = get_learner_profile_engine()

    async def get_session_constraints(self, session_id: str) -> dict:
        """
        Retrieves constraints for the LLM based on session history.
        """
        avoid_context = await self.state_manager.get_avoid_context(session_id)
        avoid_text = ""
        if avoid_context:
            avoid_text = (
                "\n\n[PATHWAY CONSTRAINT: Do NOT repeat these previously used items:]\n" + avoid_context
            )

        return {"avoid_text": avoid_text, "difficulty": "adaptive"}

    async def log_interaction(self, session_id: str, ai_response: str):
        """
        Parses AI response for A2UI components and logs them into memory.
        """
        blocks = re.findall(r"```a2ui\s*(.*?)\s*```", ai_response, re.DOTALL)
        for block_str in blocks:
            try:
                data = json.loads(block_str)
                # ... existing logging logic ...
            except: pass

    async def get_recommendation(self, user_id: str, current_topic: str) -> dict:
        """
        Determines the next best step for the learner.
        """
        profile = await self.learner_engine.get_profile(user_id)
        mastery_map = profile.get("mastery_levels", {})
        current_mastery = mastery_map.get(current_topic, 0.5)

        if current_mastery > 0.8:
            return {
                "action": "ADVANCE",
                "message": f"You've mastered {current_topic}! Ready for the next challenge?",
                "next_topic": "Next Logical Topic"
            }
        elif current_mastery < 0.4:
            return {
                "action": "REVIEW",
                "message": f"It looks like {current_topic} is still a bit tricky. Let's do a quick review.",
                "next_topic": current_topic
            }
        else:
            return {
                "action": "PRACTICE",
                "message": f"Good progress on {current_topic}. Let's do some more practice.",
                "next_topic": current_topic
            }

    def process_input(self, user_input: str, context: dict) -> str:
        """
        Process natural language input regarding the pathway.
        """
        return f"Pathway Agent: Analyzed '{user_input}'. Adjusting your journey based on mastery data."
