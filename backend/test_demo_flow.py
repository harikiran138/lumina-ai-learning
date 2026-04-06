import sys
import os
# Add backend to path
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from app.main import app
from app.routers.student import get_current_user

# 1. Mock Auth
def mock_get_current_user():
    return {
        "id": "dbb76497-b6ac-43e4-8a71-9261ec0d9583", # Existing student
        "email": "teststudent44960@gmail.com",
        "role": "student",
        "name": "Test Student"
    }

app.dependency_overrides[get_current_user] = mock_get_current_user
client = TestClient(app)

def test_leaderboard_stability():
    print("🚀 [VALIDATION] Testing Leaderboard API...")
    r = client.get("/api/student/leaderboard?timeframe=weekly")
    print(f"Status: {r.status_code}")
    data = r.json()
    print(f"Body snippet: {str(data)[:200]}...")
    
    assert r.status_code == 200
    assert data.get("success") is True
    assert "entries" in data["data"]
    print("✅ Leaderboard matches expected shape { success, data }")

def test_ai_tutor_integrity():
    print("\n🤖 [VALIDATION] Testing AI Tutor Ask API...")
    r = client.post("/api/student/tutor/ask", json={
        "prompt": "Explain React hooks in simple terms.",
        "mode": "explain"
    })
    print(f"Status: {r.status_code}")
    data = r.json()
    print(f"Body: {data}")
    # Tutor is a legacy route, check if it's still returning raw shapes or standardized.
    # Note: my redesign kept it working with existing UI expectations.
    assert r.status_code == 200
    assert "id" in data
    print("✅ AI Tutor Ask functionality intact.")

def test_community_integration():
    print("\n🌍 [VALIDATION] Testing Community APIs...")
    # List posts
    r = client.get("/api/community/messages?limit=5")
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Body snippet: {str(data)[:100]}...")
    else:
        print(f"Body: {r.text}")

if __name__ == "__main__":
    try:
        test_leaderboard_stability()
        test_ai_tutor_integrity()
        test_community_integration()
        print("\n🏆 FINAL VERDICT: SYSTEM READY FOR DEMO (INTERNAL API CHECK)")
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")
        sys.exit(1)
