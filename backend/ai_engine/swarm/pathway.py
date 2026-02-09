from ai_engine.pathway.inference_engine import PathwayInferenceEngine
from ai_engine.tutor_state import get_tutor_state
import os
import re
import json


class PathwayAgent:
    """
    Adaptive Curriculum Agent that optimizes learning trajectories.
    Acts as the central State Engine for the AI Tutor.
    """

    def __init__(self):
        # Resolve path relative to this file
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Using TKT model for inference
        model_path = os.path.join(base_path, "pathway", "models", "tkt_v1.pt")
        self.engine = PathwayInferenceEngine(model_path=model_path)
        self.state_manager = get_tutor_state()

    async def get_session_constraints(self, session_id: str) -> dict:
        """
        Retrieves constraints for the LLM based on session history.
        Returns: { "avoid_text": str, "difficulty": str }
        """
        # 1. Deduplication (Avoid previously asked questions)
        avoid_context = await self.state_manager.get_avoid_context(session_id)
        avoid_text = ""
        if avoid_context:
            avoid_text = (
                "\n\n[PATHWAY CONSTRAINT: You must NOT repeat these previously used items. "
                "Generates FRESH content:]\n" + avoid_context
            )

        # 2. Adaptive Difficulty (Mock for now, will use TKT later)
        # In a real implementation, self.engine.predict_mastery() would drive this.
        difficulty = "adaptive"

        return {"avoid_text": avoid_text, "difficulty": difficulty}

    async def log_interaction(self, session_id: str, ai_response: str):
        """
        Parses the AI response for A2UI components and logs them into memory.
        Uses structured extraction to find questions, flashcards, etc.
        """
        # Find all a2ui blocks
        blocks = re.findall(r"```a2ui\s*(.*?)\s*```", ai_response, re.DOTALL)

        for block_str in blocks:
            try:
                data = json.loads(block_str)
                component = data.get("component")
                props = data.get("props", {})

                if component == "Quiz":
                    q = props.get("question")
                    if q:
                        await self.state_manager.add_question(session_id, q)
                elif component == "Flashcard":
                    f = props.get("front")
                    if f:
                        await self.state_manager.add_question(session_id, f)
                elif component == "Timeline":
                    for event in props.get("events", []):
                        title = event.get("title")
                        if title:
                            await self.state_manager.add_question(session_id, title)
            except Exception:
                # Fallback to fuzzy regex if JSON parsing fails
                questions = re.findall(r'"question":\s*"([^"]+)"', block_str)
                for q in questions:
                    await self.state_manager.add_question(session_id, q)

    def get_difficulty_recommendation(self, user_id: str) -> str:
        """
        Determines difficulty based on recent user performance.
        """
        from app.store.user_data_store import UserDataStore

        user_ds = UserDataStore()
        stats = user_ds.get_recent_quiz_stats(user_id)
        avg_score = stats.get("recent_average", 0)

        if avg_score > 80:
            return "Advanced"
        elif avg_score < 50:
            return "Introductory"
        return "Intermediate"

    def recommend_next_node(self, learner_state: dict, curriculum_graph: dict) -> str:
        """
        Recommends the next concept/node based on learner state.
        """
        # Extract sequences from learner_state provided by frontend/db
        skill_seq = learner_state.get("skill_sequence", [])
        correct_seq = learner_state.get("correct_sequence", [])

        # Get mastery probability
        mastery_prob = self.engine.predict_mastery(skill_seq, correct_seq)

        if mastery_prob > 0.7:
            return "advance_next_topic"
        elif mastery_prob < 0.4:
            return "review_prerequisite"
        else:
            return "practice_current_topic"

    def process_input(self, user_input: str, context: dict) -> str:
        """
        Process natural language input regarding the pathway.
        """
        return f"Acknowledged. Adjusting pathway strategy based on: {user_input}"
