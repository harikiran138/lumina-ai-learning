from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.pathway.schemas import PathwayInput, PathwayOutput
from app.pathway.orchestrator import PathwayOrchestrator
from app.core.logging import structlog

log = structlog.get_logger()

# We maintain a single instance of the orchestrator for the lifecycle of the app
# In a real environment with a heavy RL model we would load the tensor weights here.
orchestrator = PathwayOrchestrator()

router = APIRouter(prefix="/pathway", tags=["pathway"])

@router.post("/decision", response_model=PathwayOutput)
async def get_next_decision(context: PathwayInput) -> PathwayOutput:
    """
    Evaluates the learner's context and decides the next best action.
    """
    try:
        log.info("pathway_decision_requested", learner_id=context.learnerId)
        decision = orchestrator.run_decision_cycle(context)
        log.info("pathway_decision_made", action=decision.action, target=decision.targetConcept)
        return decision
        
    except Exception as e:
        log.error("pathway_decision_failed", error=str(e), learner_id=context.learnerId)
        raise HTTPException(status_code=500, detail="Failed to compute pathway decision. Check logs.")
