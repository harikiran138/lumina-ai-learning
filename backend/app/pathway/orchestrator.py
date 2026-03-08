import uuid
from datetime import datetime
from app.pathway.schemas import PathwayInput, PathwayOutput, PathwayAction
from app.pathway.state_builder import StateBuilder
from app.pathway.policy_engine import PolicyEngine
from app.pathway.optimizer import CurriculumOptimizer
from app.pathway.explainer import Explainer

class PathwayOrchestrator:
    """
    The main control loop of the Pathway Agent.
    """
    
    def __init__(self):
        self.state_builder = StateBuilder()
        self.policy_engine = PolicyEngine()
        self.optimizer = CurriculumOptimizer.get_fallback_optimizer()
        self.explainer = Explainer()

    def run_decision_cycle(self, context: PathwayInput) -> PathwayOutput:
        """
        Main orchestration loop mimicking `run_decision_cycle` from pathway_agent.md.
        """
        # 1. Normalize (State Construction)
        state_vector = self.state_builder.build_state(context)
        
        # 2. Policy Query
        action, target_id, priority, raw_reasoning = self.policy_engine.evaluate_action(state_vector)
        
        # Overlay Curriculum if advancing
        if action == PathwayAction.ADVANCE and target_id == "NEXT_OPTIMAL_NODE":
            # Extract mastered concepts to determine what is unlocked
            mastered = [
                c["concept_id"] for c in state_vector.get("concepts", [])
                if c["norm_confidence"] > 0.85
            ]
            
            next_concept = self.optimizer.get_optimal_next_concept(mastered)
            target_id = next_concept if next_concept else "NO_FURTHER_CONTENT"
            
        # 3. Explain
        reasoning = self.explainer.generate_reasoning(action, target_id, raw_reasoning)
        
        # 4. Emit
        return PathwayOutput(
            decisionId=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            action=action,
            targetConcept=target_id,
            priority=priority,
            reasoning=reasoning,
            meta={
                "predictedReward": 0.0, # Placeholder until RL is connected
                "explorationFactor": 0.0
            }
        )
