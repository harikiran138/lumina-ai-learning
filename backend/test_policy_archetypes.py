import asyncio
import sys
import os

# Add parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.assessment.engine.policy_engine import policy_engine, AssessmentAction
from app.assessment.models.schemas import MasteryState, StudentResponse, AnswerAnalysis

def print_decision(archetype: str, decision):
    print(f"\n--- Archetype: {archetype} ---")
    print(f"Action: {decision.action.value}")
    print(f"Target Difficulty: {decision.target_difficulty:.2f}")
    print(f"Target Concepts: {decision.target_concepts}")
    print(f"Reason: {decision.reason}")
    print(f"Final Step: {decision.is_final}")

def test_policy_logic():
    print("Testing Adaptive Policy Decisions for Archetypes...")
    
    # 1. THE FAST LEARNER: High mastery, correct answers, high confidence
    fast_learner = MasteryState(student_id="s1", concept_mastery={"Python": 0.7})
    history_fast = [
        StudentResponse(question_id="q1", is_correct=True, score=1.0, 
                        analysis=AnswerAnalysis(confidence_estimate=0.9))
    ]
    decision_fast = policy_engine.decide_next_action(fast_learner, history_fast, "Python")
    print_decision("Fast Learner", decision_fast)
    
    # 2. THE STRUGGLING LEARNER: Low mastery, incorrect, low confidence
    struggling = MasteryState(student_id="s2", concept_mastery={"Python": 0.3})
    history_struggling = [
        StudentResponse(question_id="q1", is_correct=False, score=0.0, 
                        analysis=AnswerAnalysis(confidence_estimate=0.2))
    ]
    decision_struggling = policy_engine.decide_next_action(struggling, history_struggling, "Python")
    print_decision("Struggling Learner", decision_struggling)
    
    # 3. THE FATIGUED LEARNER: Latency detection (Correct but Slow)
    fatigued = MasteryState(student_id="s3", concept_mastery={"Python": 0.5})
    history_fatigued = [
        StudentResponse(question_id="q1", is_correct=True, score=1.0, time_taken_seconds=150)
    ]
    decision_fatigued = policy_engine.decide_next_action(fatigued, history_fatigued, "Python")
    print_decision("Fatigued Learner", decision_fatigued)
    
    # 4. STABILIZED LEARNER: Performance flatline stop
    stabilized = MasteryState(student_id="s4", concept_mastery={"Python": 0.6})
    history_stab = [
        StudentResponse(question_id="q1", is_correct=True, score=0.8),
        StudentResponse(question_id="q2", is_correct=True, score=0.8),
        StudentResponse(question_id="q3", is_correct=True, score=0.8)
    ]
    decision_stab = policy_engine.decide_next_action(stabilized, history_stab, "Python")
    print_decision("Stabilized Learner", decision_stab)

if __name__ == "__main__":
    test_policy_logic()
