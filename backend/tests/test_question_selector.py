from app.assessment.question.selector import QuestionSelector
from app.assessment.engine.policy_engine import PolicyDecision, AssessmentAction

def test_select_question_basic():
    selector = QuestionSelector()
    decision = PolicyDecision(
        action=AssessmentAction.NEXT_QUESTION,
        target_difficulty=0.2,
        target_concepts=["arrays"],
        reason="test"
    )
    
    q = selector.select_question(decision, seen_question_ids=[])
    assert q is not None
    assert "arrays" in q.metadata.concepts
    # The mock has specific difficulties, q1 is 0.2
    assert abs(q.metadata.difficulty - 0.2) < 0.2

def test_select_question_ignore_seen():
    selector = QuestionSelector()
    decision = PolicyDecision(
        action=AssessmentAction.NEXT_QUESTION,
        target_difficulty=0.2,
        target_concepts=["arrays"],
        reason="test"
    )
    
    # q1 is the best match for 0.2 difficulty arrays
    q = selector.select_question(decision, seen_question_ids=["q1"])
    assert q.id != "q1"

def test_select_question_stop():
    selector = QuestionSelector()
    decision = PolicyDecision(
        action=AssessmentAction.STOP,
        target_difficulty=0.0,
        target_concepts=[],
        reason="stop"
    )
    q = selector.select_question(decision, [])
    assert q is None
