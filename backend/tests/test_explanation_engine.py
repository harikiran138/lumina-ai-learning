import pytest
import asyncio
from datetime import datetime
from app.personalization.schemas import (
    LearnerProfileRecord, 
    ExplanationProfile, 
    ExplanationPlan,
    ExplanationStrategyState,
    LearningEventType
)
from app.personalization.explanation_planner import ExplanationPlanner
from app.services.personalization_service import get_personalization_service

@pytest.mark.asyncio
async def test_explanation_planner_selection():
    # Setup a profile with one very effective mode
    profile = LearnerProfileRecord(
        user_id="test_user_planner",
        explanation_profile=ExplanationProfile(
            strategies={
                "Analogy": ExplanationStrategyState(mode_name="Analogy", effectiveness_score=0.9, total_uses=10),
                "Joke": ExplanationStrategyState(mode_name="Joke", effectiveness_score=0.2, total_uses=10)
            }
        )
    )
    
    # Run 100 simulations
    selections = []
    for _ in range(100):
        plan = ExplanationPlanner.generate_plan(profile)
        selections.append(plan.mode)
    
    analogy_count = selections.count("Analogy")
    joke_count = selections.count("Joke")
    
    print(f"\nSelections: Analogy={analogy_count}, Joke={joke_count}")
    
    # With epsilon=0.1, Analogy (the best) should be chosen ~90% + (~1.25% from random) of the time
    assert analogy_count > 80
    assert joke_count < 15

@pytest.mark.asyncio
async def test_explanation_reward_loop():
    service = get_personalization_service()
    user_id = "test_user_reward"
    
    # 1. Create initial profile
    profile = await service.get_profile(user_id)
    
    # 2. Simulate a tutor interaction with a plan
    plan = ExplanationPlan(
        objective="explain",
        strategy="step_by_step",
        mode="Story",
        vocabulary_band="simple",
        depth="concise",
        pace="slow"
    )
    
    await service.record_event(
        user_id,
        LearningEventType.TUTOR_INTERACTION,
        payload={
            "message": "tell me a story about loops",
            "explanation_plan": plan.model_dump()
        }
    )
    
    # 3. Verify last_plan is set
    profile = await service.get_profile(user_id)
    assert profile.explanation_profile.last_plan is not None
    assert profile.explanation_profile.last_plan.mode == "Story"
    
    # 4. Simulate a SUCCESSFUL assessment answer
    initial_score = profile.explanation_profile.strategies.get("Story", ExplanationStrategyState(mode_name="Story")).effectiveness_score
    
    await service.record_event(
        user_id,
        LearningEventType.ASSESSMENT_ANSWER,
        payload={"is_correct": True},
        topic_id="variable_scope"
    )
    
    # 5. Verify effectiveness increased
    profile = await service.get_profile(user_id)
    new_score = profile.explanation_profile.strategies["Story"].effectiveness_score
    assert new_score > initial_score
    print(f"\nStory Effectiveness: {initial_score} -> {new_score}")
    
    # 6. Simulate a FAILURE
    await service.record_event(
        user_id,
        LearningEventType.ASSESSMENT_ANSWER,
        payload={"is_correct": False},
        topic_id="variable_scope"
    )
    
    profile = await service.get_profile(user_id)
    final_score = profile.explanation_profile.strategies["Story"].effectiveness_score
    assert final_score < new_score
    print(f"Story Effectiveness after failure: {new_score} -> {final_score}")
