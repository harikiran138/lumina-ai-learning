from ai_engine.pathway.inference_engine import PathwayInferenceEngine
import os

class PathwayAgent:
    """
    Adaptive Curriculum Agent that optimizes learning trajectories.
    """
    def __init__(self):
        # Resolve path relative to this file
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        # Using TKT model for inference
        model_path = os.path.join(base_path, "pathway", "models", "tkt_v1.pt")
        self.engine = PathwayInferenceEngine(model_path=model_path)

    def recommend_next_node(self, learner_state: dict, curriculum_graph: dict) -> str:
        """
        Recommends the next concept/node based on learner state.
        """
        # Extract sequences from learner_state provided by frontend/db
        skill_seq = learner_state.get("skill_sequence", [])
        correct_seq = learner_state.get("correct_sequence", [])
        
        # Get mastery probability
        mastery_prob = self.engine.predict_mastery(skill_seq, correct_seq)
        
        # Simple logic: if mastery > 0.7, advance; else review
        # In a real graph, we'd pick specific IDs. Here we return a strategy string.
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
        # Placeholder for LLM-based pathway negotiation
        return f"Acknowledged. Adjusting pathway strategy based on: {user_input}"
