import pytest
import asyncio
from datetime import datetime
from app.pathway.schemas import PathwayInput, MasteryDetail, EngagementState, Constraints, PathwayAction

from app.pathway.orchestrator import PathwayOrchestrator

def build_mock_context(learner_id: str, fatigue: float = 0.2, config: str = "average") -> PathwayInput:
    mastery = {}
    
    if config == "struggling":
        mastery = {
            "concept_1": MasteryDetail(conceptId="concept_1", probabilityCorrect=0.8, confidence=0.9, stability=60.0),
            "concept_2": MasteryDetail(conceptId="concept_2", probabilityCorrect=0.3, confidence=0.2, stability=2.0),
        }
    elif config == "fast":
        mastery = {
            "concept_1": MasteryDetail(conceptId="concept_1", probabilityCorrect=0.95, confidence=0.95, stability=90.0),
            "concept_2": MasteryDetail(conceptId="concept_2", probabilityCorrect=0.90, confidence=0.92, stability=30.0),
        }
    else: # Average
        mastery = {
            "concept_1": MasteryDetail(conceptId="concept_1", probabilityCorrect=0.6, confidence=0.6, stability=10.0),
        }

    return PathwayInput(
        learnerId=learner_id,
        currentTimestamp=datetime.utcnow(),
        masteryState=mastery,
        engagementState=EngagementState(
            currentSessionDurationMinutes=30,
            cognitiveLoadIndex=4.0,
            fatigueLevel=fatigue
        ),
        constraints=Constraints(maxSessionTimeMinutes=60, availableEnergy=80)
    )

@pytest.mark.asyncio
async def test_pathway_logic():
    print("🚀 Running Pathway Agent Logic Tests...")
    orchestrator = PathwayOrchestrator()
    
    # Test 1: Struggling Learner (Should output REVIEW for concept_2)
    print("\n--- Test 1: Struggling Learner ---")
    struggling_context = build_mock_context(learner_id="u_struggle", config="struggling")
    decision1 = await orchestrator.run_decision_cycle(struggling_context)
    print(f"Action: {decision1.action}")
    print(f"Target: {decision1.targetConcept}")
    print(f"Reasoning: {decision1.reasoning}")
    assert decision1.action == PathwayAction.REVIEW, "Struggling learner should be set to REVIEW"
    assert decision1.targetConcept == "concept_2", "Should target the weak concept_2"

    # Test 2: Fast Learner (Should output ADVANCE)
    print("\n--- Test 2: Fast Learner ---")
    fast_context = build_mock_context(learner_id="u_fast", config="fast")
    decision2 = await orchestrator.run_decision_cycle(fast_context)
    print(f"Action: {decision2.action}")
    print(f"Target: {decision2.targetConcept}")
    print(f"Reasoning: {decision2.reasoning}")
    assert decision2.action == PathwayAction.ADVANCE, "Fast learner should be set to ADVANCE"
    
    # Test 3: Exhausted Learner (Should output REST)
    print("\n--- Test 3: Exhausted Learner ---")
    exhaust_context = build_mock_context(learner_id="u_exhausted", fatigue=0.9)
    decision3 = await orchestrator.run_decision_cycle(exhaust_context)
    print(f"Action: {decision3.action}")
    print(f"Reasoning: {decision3.reasoning}")
    assert decision3.action == PathwayAction.REST, "Exhausted learner should be set to REST"

    # Test 4: Average Learner (Should output CONTINUE)
    print("\n--- Test 4: Average Learner ---")
    avg_context = build_mock_context(learner_id="u_avg", config="average")
    decision4 = await orchestrator.run_decision_cycle(avg_context)
    print(f"Action: {decision4.action}")
    print(f"Reasoning: {decision4.reasoning}")
    assert decision4.action == PathwayAction.CONTINUE, "Average learner should CONTINUE"
    
    print("\n🎉 All tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_pathway_logic())
