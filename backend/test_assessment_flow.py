import requests
import time
import json

BASE_URL = "http://localhost:8000/api/assessment"
STUDENT_ID = "student_gemini_test"
TOPIC = "Quantum Physics"

GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"


def log(msg, success=True):
    color = GREEN if success else RED
    print(f"{color}{msg}{RESET}")


def run_test():
    print("--- Starting Adaptive Assessment Verification (Gemini Powered) ---")

    # 1. Start Session
    log("▶️  Step 1: Starting Session (Questions: 3)...")
    start_data = {"student_id": STUDENT_ID, "topic": TOPIC, "num_questions": 3}
    resp = requests.post(f"{BASE_URL}/start", json=start_data)
    if resp.status_code == 200:
        session = resp.json()
        session_id = session["id"]
        log(f"✅ Session Started: {session_id}")
    else:
        log(f"❌ Failed to start session: {resp.text}", False)
        return

    # Loop through a few questions
    for i in range(3):
        log(f"\n▶️  Step 2.{i+1}: getting Question...")
        resp = requests.get(f"{BASE_URL}/next-question/{session_id}")

        if resp.status_code == 200:
            question = resp.json()
            if not question:
                log("ℹ️  Assessment Complete (No more questions)", True)
                break

            q_text = question["text"]
            q_id = question["id"]
            options = question["options"]
            log(f"❓ Question: {q_text}")
            log(f"   Options: {[o['text'] for o in options]}")

            # Simulate answering (Randomly pick the first option)
            selected_option = options[0]["id"]

            log(f"▶️  Step 3.{i+1}: Submitting Answer...")
            submit_data = {
                "session_id": session_id,
                "question_id": q_id,
                "selected_option_id": selected_option,
            }
            resp = requests.post(f"{BASE_URL}/submit", json=submit_data)

            if resp.status_code == 200:
                updated_session = resp.json()
                is_correct = updated_session["responses"][-1]["is_correct"]
                new_diff = updated_session["current_difficulty"]
                log(f"✅ Answer Submitted. Correct: {is_correct}. New Difficulty: {new_diff}")
            else:
                log(f"❌ Failed to submit answer: {resp.text}", False)
                break
        else:
            log(f"❌ Failed to get question: {resp.text}", False)
            break

    # Get Final Result
    log("\n▶️  Step 4: Fetching Final Results...")
    resp = requests.get(f"{BASE_URL}/result/{session_id}")
    if resp.status_code == 200:
        result = resp.json()
        log(f"✅ Final Result: {json.dumps(result, indent=2)}")
    else:
        log(f"❌ Failed to get results: {resp.text}", False)


if __name__ == "__main__":
    run_test()
