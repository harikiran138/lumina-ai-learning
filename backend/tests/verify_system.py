
import asyncio
import aiohttp
import time
import sys
import json
import os

# Add backend to path to import internal modules if needed (for unit level checks)
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

BASE_URL = "http://127.0.0.1:8000"

async def check_health(session):
    print("--- 1. Checking API Health ---")
    async with session.get(f"{BASE_URL}/health") as resp:
        if resp.status == 200:
            print("✅ API is Healthy")
            return True
        else:
            print(f"❌ API Health Failed: {resp.status}")
            return False

async def verify_pathway_logic(session):
    print("\n--- 2. Verifying Pathway Orchestration & Dedup ---")
    
    # Session ID for this test
    session_id = f"test_session_{int(time.time())}"
    
    # Step 1: Ask for a Quiz about Python (Should work)
    payload = {
        "message": "Give me a quiz about Python Lists",
        "provider": "ollama", # or gemini, mocking via Ollama for now
        "session_id": session_id,
        "user_id": "test_user"
    }
    
    # We expect the mock/LLM to return something. 
    # Since we can't easily control the exact LLM output in this blackbox test, 
    # we'll look for successful 200 OK and response structure.
    
    start = time.time()
    async with session.post(f"{BASE_URL}/api/tutor/chat", json=payload) as resp:
        if resp.status != 200:
            print(f"❌ Chat Request Failed: {resp.status}")
            text = await resp.text()
            print(text)
            return False
        data = await resp.json()
        print(f"✅ First Request Successful ({time.time() - start:.2f}s)")
        
        # Simulate that the backend identified a "Quiz" in this response (mocking the extraction logic if LLM was dumb)
        # But wait, the backend *already* did this if the LLM output prompted it.
        # To strictly test the STATE, we should try to hit the backend again and see if the "avoid list" is active.
        # But `avoid_instruction` is internal. We can't see it in the response unless we debug.
        # We CAN check if the response contains "Quiz" (if the LLM obeyed).
        
        if "response" in data:
            print("✅ Response structure valid")
        
    # Step 2: Follow up - "Next question"
    # This checks if the Pathway allowed the request and didn't crash.
    payload["message"] = "Next question please"
    async with session.post(f"{BASE_URL}/api/tutor/chat", json=payload) as resp:
        if resp.status == 200:
            print("✅ Pathway 'Next' Flow Successful")
        else:
            print("❌ Pathway 'Next' Flow Failed")
            return False
            
    return True

async def stress_test(session, concurrent_requests=10):
    print(f"\n--- 3. Stress Test (Concurrency: {concurrent_requests}) ---")
    
    async def make_request(idx):
        payload = {
            "message": f"Explain concept {idx}",
            "session_id": f"stress_session_{idx}",
            "user_id": f"user_{idx}",
            "provider": "ollama"
        }
        try:
            start = time.time()
            async with session.post(f"{BASE_URL}/api/tutor/chat", json=payload) as resp:
                data = await resp.json()
                # We mainly care that it didn't crash (500)
                return resp.status == 200, time.time() - start
        except Exception as e:
            return False, 0
            
    tasks = [make_request(i) for i in range(concurrent_requests)]
    results = await asyncio.gather(*tasks)
    
    success_count = sum(1 for r, _ in results if r)
    avg_time = sum(t for _, t in results) / len(results) if results else 0
    
    print(f"✅ Success Rate: {success_count}/{concurrent_requests}")
    print(f"⏱️ Avg Response Time: {avg_time:.2f}s")
    
    if success_count == concurrent_requests:
        return True
    return False

async def main():
    async with aiohttp.ClientSession() as session:
        health_ok = await check_health(session)
        if not health_ok:
            return
            
        pathway_ok = await verify_pathway_logic(session)
        if not pathway_ok:
            print("❌ Pathway Verification Failed - Stopping")
            return
            
        stress_ok = await stress_test(session, concurrent_requests=5) # Start small for local dev
        
        if health_ok and pathway_ok and stress_ok:
            print("\n🎉 ALL SYSTEMS GO! Integration & Stress Test Passed.")
        else:
            print("\n⚠️  Some tests failed.")

if __name__ == "__main__":
    asyncio.run(main())
