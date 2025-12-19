import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.assessment.engine.session_manager import session_manager
from app.assessment.models.schemas import Question, AssessmentSession

def test_assessment_flow():
    print("Testing Adaptive Assessment Flow...")
    
    # 1. Start Session
    try:
        session = session_manager.create_session(student_id="test_student", topic="Python Programming")
        print(f"[PASS] Created session: {session.id} (Difficulty: {session.current_difficulty})")
    except Exception as e:
        print(f"[FAIL] Failed to create session: {e}")
        return

    # 2. Get Question
    try:
        question = session_manager.get_next_question(session.id)
        if question:
            print(f"[PASS] Generated question: {question.text[:50]}...")
            print(f"       Options: {[o.text for o in question.options]}")
        else:
            print("[FAIL] Failed to generate question (None returned)")
            return
    except Exception as e:
        print(f"[FAIL] Error generating question: {e}")
        return

    # 3. Submit Answer (Correct)
    try:
        # Simulate selecting the correct option
        # In our generator callback, we don't know which is correct easily without peeking.
        # But we can look at the question object.
        correct_opt_id = question.correct_option_id
        
        session = session_manager.submit_answer(
            session_id=session.id,
            question_id=question.id,
            selected_option_id=correct_opt_id,
            is_correct=True # We are simulating the check
        )
        print(f"[PASS] Submitted correct answer. New Difficulty: {session.current_difficulty}")
        
        if session.current_difficulty > 0.5:
             print("[PASS] Difficulty increased as expected.")
        else:
             print("[FAIL] Difficulty did not increase.")
             
    except Exception as e:
        print(f"[FAIL] Error submitting answer: {e}")
        return

    # 4. Submit Answer (Incorrect)
    try:
        # Get next question
        q2 = session_manager.get_next_question(session.id)
        
        session = session_manager.submit_answer(
            session_id=session.id,
            question_id=q2.id,
            selected_option_id="wrong", 
            is_correct=False
        )
        print(f"[PASS] Submitted incorrect answer. New Difficulty: {session.current_difficulty}")
        
        if session.current_difficulty < 0.6: # prev was 0.6 (0.5+0.1)
             print("[PASS] Difficulty decreased as expected.")
        else:
             print("[FAIL] Difficulty did not decrease.")

    except Exception as e:
        print(f"[FAIL] Error in second step: {e}")

    print("Test Complete.")

if __name__ == "__main__":
    test_assessment_flow()
