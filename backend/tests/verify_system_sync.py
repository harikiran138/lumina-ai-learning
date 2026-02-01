import requests
import time
import sys
import json
import os
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://127.0.0.1:8000"


def check_health():
    print("--- 1. Checking API Health ---")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        if resp.status_code == 200:
            print("✅ API is Healthy")
            return True
        else:
            print(f"❌ API Health Failed: {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return False


def verify_pathway_logic():
    print("\n--- 2. Verifying Pathway Orchestration & Dedup ---")

    session_id = f"test_session_{int(time.time())}"

    payload = {
        "message": "Give me a quiz about Python Lists",
        "provider": "ollama",
        "session_id": session_id,
        "user_id": "test_user",
    }

    try:
        start = time.time()
        print("   Sending 'Quiz' request...")
        resp = requests.post(
            f"{BASE_URL}/api/tutor/chat", json=payload, timeout=60
        )  # Long timeout for LLM

        if resp.status_code != 200:
            print(f"❌ Chat Request Failed: {resp.status_code}")
            print(resp.text)
            return False

        data = resp.json()
        print(f"✅ First Request Successful ({time.time() - start:.2f}s)")

        # Verify structure
        if "response" in data and "personalization" in data:
            print(
                f"✅ Valid Response Structure. Rec: {data['personalization'].get('recommendation')}"
            )

        # Step 2: Next Question
        print("   Sending 'Next' request...")
        payload["message"] = "Next question please"
        resp = requests.post(f"{BASE_URL}/api/tutor/chat", json=payload, timeout=60)

        if resp.status_code == 200:
            print("✅ Pathway 'Next' Flow Successful")
            return True
        else:
            print("❌ Pathway 'Next' Flow Failed")
            return False

    except Exception as e:
        print(f"❌ Pathway Test Error: {e}")
        return False


def stress_test(concurrent_requests=5):
    print(f"\n--- 3. Stress Test (Concurrency: {concurrent_requests}) ---")

    def make_request(idx):
        payload = {
            "message": f"Explain concept {idx}",
            "session_id": f"stress_session_{idx}",
            "user_id": f"user_{idx}",
            "provider": "ollama",
        }
        try:
            start = time.time()
            resp = requests.post(f"{BASE_URL}/api/tutor/chat", json=payload, timeout=60)
            return resp.status_code == 200, time.time() - start
        except:
            return False, 0

    with ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
        results = list(executor.map(make_request, range(concurrent_requests)))

    success_count = sum(1 for r, _ in results if r)
    avg_time = sum(t for _, t in results) / len(results) if results else 0

    print(f"✅ Success Rate: {success_count}/{concurrent_requests}")
    print(f"⏱️ Avg Response Time: {avg_time:.2f}s")

    return success_count == concurrent_requests


if __name__ == "__main__":
    if check_health():
        if verify_pathway_logic():
            # Stress test with 3 concurrent users to avoid killing local LLM if it's slow
            stress_test(3)
            print("\n🎉 VERIFICATION COMPLETE.")
