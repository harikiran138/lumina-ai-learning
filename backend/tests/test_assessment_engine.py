import pytest
from app.assessment.engine.knowledge_tracing import KnowledgeTracingEngine
from app.assessment.models.schemas import MasteryState

def test_bkt_initialization():
    engine = KnowledgeTracingEngine()
    assert engine.p_init == 0.5

def test_bkt_update_correct():
    engine = KnowledgeTracingEngine(p_transit=0.0) # Disable transit to test pure bayes update easiest
    # If p=0.5, slip=0.1, guess=0.2
    # P(L|Correct) = (0.5 * 0.9) / (0.5 * 0.9 + 0.5 * 0.2) = 0.45 / 0.55 ≈ 0.818
    
    mastery = MasteryState(student_id="test_student", concept_mastery={"arrays": 0.5})
    new_p = engine._update_single_concept(0.5, True)
    assert new_p > 0.5  # Should increase

def test_bkt_update_incorrect():
    engine = KnowledgeTracingEngine(p_transit=0.0)
    # P(L|Incorrect) should decrease
    new_p = engine._update_single_concept(0.5, False)
    assert new_p < 0.5

def test_update_mastery_state():
    engine = KnowledgeTracingEngine()
    mastery = MasteryState(student_id="s1")
    
    # First update - correct
    engine.update_mastery(mastery, ["loops"], True)
    assert "loops" in mastery.concept_mastery
    assert mastery.concept_mastery["loops"] > 0.5

    # Second update - incorrect
    engine.update_mastery(mastery, ["loops"], False)
    # It might still be > 0.5 depending on parameters, but should be lower than if it was correct again
