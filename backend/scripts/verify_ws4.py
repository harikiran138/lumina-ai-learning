import asyncio
import os
import sys
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.assessment.engine.session_manager import session_manager
from app.assessment.models.schemas import QuestionFormat, ResponseTelemetry, SubmitAnswerRequest
from app.personalization.authenticity_engine import authenticity_engine
from app.services.personalization_service import get_personalization_service

async def verify_ws4():
    print("🚀 Starting Workstream 4 Verification...")
    
    student_id = "test_student_ws4"
    topic = "Python Basics"
    
    # 1. Test Session Creation and Format Diversity
    print("\n--- Testing Session Creation & Format Selection ---")
    session = await session_manager.create_session(student_id, topic, num_questions=3)
    print(f"Created session: {session.id} for topic: {session.topic}")
    
    # 2. Get Next Question - Verify Format Support
    print("\n--- Testing Multi-Format Question Generation ---")
    question = await session_manager.get_next_question(session.id)
    print(f"Generated Question (Format: {question.format}):")
    print(f"Text: {question.text[:100]}...")
    
    # 3. Test Semantic Analysis & Authenticity
    print("\n--- Testing Semantic Analysis & Authenticity Scoring ---")
    
    # Case A: Honest, high-effort answer
    honest_answer = "A list is a mutable ordered sequence of items, while a tuple is immutable."
    telemetry_honest = ResponseTelemetry(
        paste_detected=False,
        backspace_count=2,
        think_time_seconds=15.0,
        char_count=len(honest_answer)
    )
    
    print(f"Submitting honest answer: '{honest_answer}'")
    session = await session_manager.submit_answer(
        session.id, 
        question.id, 
        selected_answer=honest_answer, 
        telemetry=telemetry_honest
    )
    
    last_response = session.responses[-1]
    print(f"Analysis Correctness: {last_response.is_correct}")
    print(f"Analysis Feedback: {last_response.analysis.feedback[:100]}...")
    
    integrity_honest = authenticity_engine.calculate_integrity_score(telemetry_honest, last_response.analysis)
    print(f"Honest Integrity Score: {integrity_honest:.2f} (Expected: >0.8)")
    
    # Case B: Low-effort/Suspicious answer (Paste detected, very fast)
    suspicious_answer = "Lists are mutable and tuples are immutable."
    telemetry_suspicious = ResponseTelemetry(
        paste_detected=True,
        backspace_count=0,
        think_time_seconds=1.0,
        char_count=len(suspicious_answer)
    )
    
    # We need a new question for the second submission test
    question_2 = await session_manager.get_next_question(session.id)
    print(f"\nNext Question (Format: {question_2.format}):")
    
    print(f"Submitting suspicious answer: '{suspicious_answer}'")
    session = await session_manager.submit_answer(
        session.id, 
        question_2.id, 
        selected_answer=suspicious_answer, 
        telemetry=telemetry_suspicious
    )
    
    last_response_2 = session.responses[-1]
    integrity_suspicious = authenticity_engine.calculate_integrity_score(telemetry_suspicious, last_response_2.analysis)
    print(f"Suspicious Integrity Score: {integrity_suspicious:.2f} (Expected: <0.5)")
    
    # 4. Verify Personalization Service Integration
    print("\n--- Verifying Personalization Service Integration ---")
    profile = await get_personalization_service().get_profile(student_id)
    topic_mastery = profile.mastery_state.get(topic)
    
    if topic_mastery:
        print(f"Topic '{topic}' Integrity Score: {topic_mastery.integrity_score:.2f}")
        print(f"Topic '{topic}' Mastery Score: {topic_mastery.score:.2f}")
    else:
        print("❌ Topic mastery not found in profile!")

    print("\n✅ Verification Script Complete.")

if __name__ == "__main__":
    asyncio.run(verify_ws4())
