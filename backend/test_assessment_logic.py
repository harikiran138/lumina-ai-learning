import asyncio
import uuid
from app.assessment.models.schemas import AssessmentSession, StudentResponse, MasteryState
from app.assessment.engine.weakness_detector import WeaknessDetector
from app.assessment.engine.stop_controller import StopController
from app.assessment.engine.feedback_engine import FeedbackEngine

def test_assessment_logic():
    print("🚀 Running Adaptive Assessment Logic Tests...")

    # 1. Test Weakness Detector
    print("\n--- Test 1: Weakness Detector ---")
    w1 = WeaknessDetector.analyze_response(is_correct=False, time_taken_seconds=5.0) # Fast + Wrong = Guessing
    w2 = WeaknessDetector.analyze_response(is_correct=False, time_taken_seconds=50.0) # Slow + Wrong = Deep Gap
    print(f"Fast & Wrong -> {w1}")
    print(f"Slow & Wrong -> {w2}")
    assert w1 == "Guessing / Rushed", "Failed to detect guessing"
    assert w2 == "Deep Concept Gap", "Failed to detect concept gap"

    # 2. Test Stop Controller
    print("\n--- Test 2: Stop Controller ---")
    # Simulate a session with 5 generic responses
    responses = [StudentResponse(question_id=str(uuid.uuid4()), is_correct=True) for _ in range(5)]
    
    session = AssessmentSession(
        student_id="test_user",
        topic="Python",
        total_questions=10,
        responses=responses,
        mastery_state=MasteryState(student_id="test_user", concept_mastery={"Python": 0.9})
    )
    
    # Should stop because mastery is high
    should_stop = StopController.should_stop(session)
    reason = StopController.get_stop_reason(session)
    print(f"Should Stop: {should_stop}")
    print(f"Reason: {reason}")
    assert should_stop == True, "Should have stopped due to high mastery"
    
    # 3. Test Feedback Engine
    print("\n--- Test 3: Feedback Engine ---")
    feedback = FeedbackEngine.generate_session_summary(session)
    print(f"Feedback: {feedback}")
    assert "Excellent work!" in feedback, "Feedback should be positive for high accuracy"

    print("\n🎉 All assessment logic tests passed successfully!")

if __name__ == "__main__":
    test_assessment_logic()
