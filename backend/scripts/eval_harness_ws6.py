import asyncio
import uuid
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.pathway.orchestrator import PathwayOrchestrator
from app.pathway.schemas import PathwayInput, EngagementState, MasteryDetail, PathwayAction

async def run_evaluation():
    print("🚀 Starting Workstream 6 Evaluation Harness...")
    orchestrator = PathwayOrchestrator()
    learner_id = f"test-learner-{uuid.uuid4().hex[:8]}"

    # Scenario 1: High Mastery, High Readiness, Low Risk -> SHOULD ADVANCE
    print("\n[Scenario 1] Ideal Learner: High Mastery, High Readiness, Low Risk")
    context_ideal = PathwayInput(
        learnerId=learner_id,
        currentTimestamp=datetime.utcnow(),
        readinessScore=0.9,
        riskLevel="low",
        masteryState={
            "python-basics": MasteryDetail(conceptId="python-basics", probabilityCorrect=0.95, confidence=0.9, stability=45.0)
        },
        engagementState=EngagementState(cognitiveLoadIndex=2.0, fatigueLevel=0.1)
    )
    decision = await orchestrator.run_decision_cycle(context_ideal)
    print(f"Decision: {decision.action} | Target: {decision.targetConcept}")
    print(f"Reasoning: {decision.reasoning}")
    assert decision.action == PathwayAction.ADVANCE or decision.action == PathwayAction.CONTINUE
    
    # Scenario 2: High Mastery, Low Readiness (<0.7) -> SHOULD BE BLOCKED from ADVANCE
    print("\n[Scenario 2] Unready Learner: High Mastery, Low Readiness (0.5), Low Risk")
    context_unready = PathwayInput(
        learnerId=learner_id,
        currentTimestamp=datetime.utcnow(),
        readinessScore=0.5,
        riskLevel="low",
        masteryState={
            "python-basics": MasteryDetail(conceptId="python-basics", probabilityCorrect=0.95, confidence=0.9, stability=45.0)
        },
        engagementState=EngagementState(cognitiveLoadIndex=2.0, fatigueLevel=0.1)
    )
    decision = await orchestrator.run_decision_cycle(context_unready)
    print(f"Decision: {decision.action} | Target: {decision.targetConcept}")
    print(f"Reasoning: {decision.reasoning}")
    assert decision.action != PathwayAction.ADVANCE
    assert "readiness score" in decision.reasoning or "Transition blocked" in decision.reasoning

    # Scenario 3: High Mastery, High Readiness, High Risk -> SHOULD REVIEW
    print("\n[Scenario 3] Risky Learner: High Mastery, High Readiness, High Risk")
    context_risky = PathwayInput(
        learnerId=learner_id,
        currentTimestamp=datetime.utcnow(),
        readinessScore=0.8,
        riskLevel="high",
        masteryState={
            "python-basics": MasteryDetail(conceptId="python-basics", probabilityCorrect=0.95, confidence=0.9, stability=45.0)
        },
        engagementState=EngagementState(cognitiveLoadIndex=2.0, fatigueLevel=0.1)
    )
    decision = await orchestrator.run_decision_cycle(context_risky)
    print(f"Decision: {decision.action} | Target: {decision.targetConcept}")
    print(f"Reasoning: {decision.reasoning}")
    assert decision.action == PathwayAction.REVIEW

    print("\n✅ Workstream 6 Evaluation Successful!")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
