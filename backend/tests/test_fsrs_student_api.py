import pytest
import uuid
from datetime import datetime, timedelta, timezone
from app.database.supabase_manager import supabase_db
from app.routers.auth import get_current_user
from app.api.deps import get_current_student

@pytest.fixture
def local_db():
    return supabase_db.get_client(force_new=True)

def _override_user(user: dict):
    async def _get_user():
        return user

    from app.main import app
    app.dependency_overrides[get_current_user] = _get_user
    app.dependency_overrides[get_current_student] = _get_user

def _clear_overrides():
    from app.main import app
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_student, None)

@pytest.mark.asyncio
async def test_fsrs_spaced_repetition_flow(ac, local_db):
    student_id = "test-student-fsrs-1"
    
    # 1. Seed some cards
    # Card 1: Due today (new)
    # Card 2: Due in future
    # Card 3: Already reviewed today
    
    now = datetime.now(timezone.utc)
    
    cards = [
        {
            "card_id": str(uuid.uuid4()),
            "student_id": student_id,
            "front": "What is the capital of France?",
            "back": "Paris",
            "source": "Geography",
            "next_review_date": (now - timedelta(days=1)).isoformat(),
            "last_reviewed_at": None,
            "review_count": 0,
            "stability": 1.0,
            "difficulty": 0.5,
        },
        {
            "card_id": str(uuid.uuid4()),
            "student_id": student_id,
            "front": "2 + 2",
            "back": "4",
            "source": "Math",
            "next_review_date": (now + timedelta(days=5)).isoformat(),
            "last_reviewed_at": None,
            "review_count": 0,
            "stability": 1.0,
            "difficulty": 0.5,
        }
    ]
    
    for c in cards:
        local_db.table("fsrs_cards").insert(c).execute()
        
    _override_user({"id": student_id, "role": "student"})
    
    try:
        # 2. Test GET /api/student/spaced-repetition
        response = await ac.get("/api/student/spaced-repetition")
        assert response.status_code == 200
        data = response.json()
        
        assert "cards" in data
        assert "dueToday" in data
        assert "reviewedToday" in data
        
        # Only one card should be due (the one from yesterday)
        assert len(data["cards"]) == 1
        assert data["cards"][0]["front"] == "What is the capital of France?"
        assert data["dueToday"] == 1
        assert data["reviewedToday"] == 0
        
        # 3. Test POST /api/student/spaced-repetition/review
        card_id = data["cards"][0]["id"]
        review_payload = {
            "cardId": card_id,
            "grade": 3,  # Good
            "responseTime": 2000
        }
        
        review_response = await ac.post("/api/student/spaced-repetition/review", json=review_payload)
        assert review_response.status_code == 200
        review_data = review_response.json()
        
        assert review_data["status"] == "ok"
        assert "next_review_date" in review_data["card"]
        assert review_data["card"]["review_count"] == 1
        
        # 4. Verify card updated in DB
        updated_card_res = local_db.table("fsrs_cards").select("*").eq("card_id", card_id).execute()
        updated_card = updated_card_res.data[0]
        
        assert updated_card["review_count"] == 1
        assert updated_card["last_reviewed_at"] is not None
        
        # 5. Check stats again
        response_after = await ac.get("/api/student/spaced-repetition")
        data_after = response_after.json()
        assert data_after["reviewedToday"] == 1
        # The due card is gone (it's scheduled for future)
        assert len(data_after["cards"]) == 0
        
    finally:
        _clear_overrides()
