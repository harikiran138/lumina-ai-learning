import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from ai_engine.swarm.tutor import TutorAgent
from app.database.supabase_manager import supabase_db

async def verify_scoping():
    print("🚀 Starting Curriculum Scoping Verification...")
    
    # 1. Setup Test Student (Semester 1)
    student_id = "test_student_sem1"
    # Ensure student exists and is in Sem 1
    # For this script, we'll mock the database response or use a real test user if available.
    # We'll assume the student is in Semester 1 (B.Tech CSE)
    
    agent = TutorAgent()
    
    # 2. Test Allowed Topic (Programming Fundamentals - Semester 1)
    print("\n📝 Testing Allowed Topic: 'What are variables in Python?'")
    response_allowed = await agent.generate_response(
        user_id=student_id,
        message="What are variables in Python?",
        session_id="verify_test_1"
    )
    
    # Check if response contains A2UI blocks (standard behavior)
    if "flow" in response_allowed:
        print("✅ Allowed topic correctly handled.")
    else:
        print("❌ Allowed topic failed or returned error.")

    # 3. Test Disallowed Topic (Computer Networks - Semester 4/7)
    print("\n🛑 Testing Disallowed Topic: 'Can you explain BGP routing protocols?'")
    response_disallowed = await agent.generate_response(
        user_id=student_id,
        message="Can you explain BGP routing protocols?",
        session_id="verify_test_2"
    )
    
    # We expect the AI to refuse or gatekeep based on the prompt instructions
    # If the AI is well-behaved, it should mention prerequisites or future semesters.
    # Note: This depends on the LLM's adherence to the system prompt.
    print(f"AI Response Snippet: {str(response_disallowed)[:200]}...")
    
    # 4. Test Promotion Logic
    from app.store.academic_store import AcademicStore
    store = AcademicStore()
    
    print("\n⬆️ Testing Student Promotion...")
    promotion_result = await store.promote_student(student_id)
    if promotion_result:
        print(f"✅ Student promoted successfully: {promotion_result}")
    else:
        print("❌ Promotion failed (possibly already at max semester or student not found).")

if __name__ == "__main__":
    asyncio.run(verify_scoping())
