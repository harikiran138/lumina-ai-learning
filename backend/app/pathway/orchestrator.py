import uuid
from datetime import datetime
from app.pathway.schemas import PathwayInput, PathwayOutput, PathwayAction
from app.pathway.state_builder import StateBuilder
from app.pathway.policy_engine import PolicyEngine
from app.pathway.optimizer import CurriculumOptimizer
from app.pathway.explainer import Explainer
from app.services.personalization_service import get_personalization_service
from app.services.audit_service import get_audit_service
from ai_engine.swarm.guardian import GuardianAgent

class PathwayOrchestrator:
    """
    The main control loop of the Pathway Agent.
    """
    
    def __init__(self):
        self.state_builder = StateBuilder()
        self.policy_engine = PolicyEngine()
        self.optimizer = CurriculumOptimizer.get_fallback_optimizer()
        self.explainer = Explainer()
        self.guardian = GuardianAgent()
        self.audit = get_audit_service()

    async def run_decision_cycle(self, context: PathwayInput) -> PathwayOutput:
        """
        Main orchestration loop mimicking `run_decision_cycle` from pathway_agent.md.
        Enriches context with live student intelligence from PersonalizationService.
        """
        # 0. Enrich Context
        try:
            service = get_personalization_service()
            profile = await service.get_legacy_state(context.learnerId)
            
            # Update readiness and risk from profile if they were not explicitly provided (stayed at defaults)
            if "readiness_score" in profile and context.readinessScore == 0.5:
                context.readinessScore = profile["readiness_score"]
            
            risk_summary = profile.get("risk_summary")
            if isinstance(risk_summary, dict) and context.riskLevel == "low":
                context.riskLevel = risk_summary.get("risk_level", "low")
            elif hasattr(risk_summary, "risk_level") and context.riskLevel == "low":
                context.riskLevel = risk_summary.risk_level
                
        except Exception as e:
            # Fallback to existing context values if service fails
            pass

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
        
        # 3b. Governance (Guardian Gate)
        # Check if the transition is approved based on safety and readiness
        gate = self.guardian.check_transition(state_vector.get("context", {}), action)
        if not gate["approved"]:
            action = PathwayAction.CONTINUE
            reasoning = f"Transition blocked: {gate['reason']} " + reasoning
        
        # 4. Emit
        decision = PathwayOutput(
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

        # 5. Audit
        await self.audit.log_decision(
            user_id=context.learnerId,
            decision_id=decision.decisionId,
            action=action,
            target=target_id,
            reasoning=reasoning,
            metadata={
                "original_action": action,
                "readiness": state_vector.get("context", {}).get("readiness_score"),
                "risk": state_vector.get("context", {}).get("risk_level")
            }
        )

        return decision
