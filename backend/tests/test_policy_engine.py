from app.assessment.engine.policy_engine import PolicyEngine, AssessmentAction
from app.assessment.models.schemas import MasteryState, StudentResponse

def test_policy_initial_question():
    engine = PolicyEngine()
    state = MasteryState(student_id="s1")
    decision = engine.decide_next_action(state, [], "arrays")
    
    assert decision.action == AssessmentAction.NEXT_QUESTION
    assert decision.target_difficulty == 0.5

def test_policy_remedial_trigger():
    engine = PolicyEngine(remediation_threshold=0.4)
    # Mastery is very low
    state = MasteryState(student_id="s1", concept_mastery={"arrays": 0.2})
    history = [StudentResponse(question_id="q1", selected_answer="a", is_correct=False, time_taken_seconds=10)]
    
    decision = engine.decide_next_action(state, history, "arrays")
    assert decision.action == AssessmentAction.REMEDIAL
    assert decision.target_difficulty <= 0.2

def test_policy_mastery_stop():
    engine = PolicyEngine(mastery_threshold=0.8)
    state = MasteryState(student_id="s1", concept_mastery={"arrays": 0.85})
    history = [StudentResponse(question_id="q1", selected_answer="b", is_correct=True, time_taken_seconds=10)]
    
    decision = engine.decide_next_action(state, history, "arrays")
    assert decision.action == AssessmentAction.STOP

def test_policy_practice_zone():
    engine = PolicyEngine()
    state = MasteryState(student_id="s1", concept_mastery={"arrays": 0.5})
    # Last answer correct -> should increase difficulty
    history = [StudentResponse(question_id="q1", selected_answer="b", is_correct=True, time_taken_seconds=10)]
    
    decision = engine.decide_next_action(state, history, "arrays")
    assert decision.target_difficulty > 0.5
    assert decision.action == AssessmentAction.NEXT_QUESTION
