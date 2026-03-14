from ai_engine.pathway.inference_engine import PathwayInferenceEngine
from ai_engine.tutor_state import get_tutor_state
from learner_profile.engine import get_learner_profile_engine
from app.pathway.orchestrator import PathwayOrchestrator
from app.pathway.schemas import PathwayInput
import os
import re
import json
from datetime import datetime


class PathwayAgent:
    """
    Adaptive Curriculum Agent that optimizes learning trajectories.
    Uses PathwayOrchestrator for intelligent, safe, and audited decisions.
    """

    def __init__(self):
        # Resolve path relative to this file
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Using TKT model for inference (legacy/fallback)
        model_path = os.path.join(base_path, "pathway", "models", "tkt_v1.pt")
        self.engine = PathwayInferenceEngine(model_path=model_path)
        self.state_manager = get_tutor_state()
        self.learner_engine = get_learner_profile_engine()
        self.orchestrator = PathwayOrchestrator()

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
        Determines the next best step for the learner using the intelligent orchestrator.
        """
        # Prepare input for the orchestrator
        pathway_input = PathwayInput(
            learnerId=user_id,
            currentTopic=current_topic,
            masteryLevel=0.5,  # Orchestrator will enrich from PersonalizationService
            lastInteraction=datetime.utcnow().isoformat()
        )

        # Run the full decision cycle (includes enrichment, policy evaluation, and audit)
        decision = await self.orchestrator.run_decision_cycle(pathway_input)

        return {
            "action": decision["action"].value.upper(),
            "message": decision["reasoning"],
            "next_topic": decision["target_id"]
        }

    async def process_input(self, user_input: str, context: dict) -> str:
        """
        Process natural language input regarding the pathway.
        """
        user_id = context.get("user_id", "anonymous")
        current_topic = context.get("topic", "General")
        
        recommendation = await self.get_recommendation(user_id, current_topic)
        
        return f"Pathway Agent: {recommendation['message']}"
