import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/tutor/chat"

def test_chart():
    print("Testing Chart Generation...")
    payload = {
        "message": "Show my Progress Chart",
        "user_id": "test_verification",
        "session_id": "test_session",
        "provider": "auto"
    }
    try:
        response = requests.post(BASE_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        content = data.get("response", "")
        print(f"Response snippet: {content[:100]}...")
        
        if "chart_block" in content:
            print("✅ SUCCESS: 'chart_block' found in response.")
            return True
        else:
            print("❌ FAILURE: 'chart_block' NOT found.")
            print("Full Response:", content)
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_strict_quiz():
    print("\nTesting Strict Quiz Generation...")
    payload = {
        "message": "Quiz me on Python",
        "user_id": "test_verification",
        "session_id": "test_session",
        "provider": "auto"
    }
    try:
        response = requests.post(BASE_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        content = data.get("response", "")
        
        if "quiz_block" in content and "flashcard_block" not in content and "table_block" not in content:
            print("✅ SUCCESS: Only 'quiz_block' found (strict constraints worked).")
            return True
        else:
            print("❌ FAILURE: Strict constraints might have failed.")
            if "flashcard_block" in content: print("  - Found unwanted 'flashcard_block'")
            if "table_block" in content: print("  - Found unwanted 'table_block'")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success_chart = test_chart()
    success_quiz = test_strict_quiz()
    
    if success_chart and success_quiz:
        print("\nAll verifications passed!")
        sys.exit(0)
    else:
        print("\nSome verifications failed.")
        sys.exit(1)
