import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.api.deps import get_current_active_user
import uuid

# Mock User Data
mock_student = {
    "id": "test-student-id",
    "email": "student@lumina.ai",
    "role": "student",
    "name": "Test Student",
    "full_name": "Test Student"
}

mock_teacher = {
    "id": "test-teacher-id",
    "email": "teacher@lumina.ai",
    "role": "teacher",
    "name": "Test Teacher"
}

# Override Dependency
async def override_get_student():
    return mock_student

async def override_get_teacher():
    return mock_teacher

# Reset overrides
app.dependency_overrides.clear()
app.dependency_overrides[get_current_active_user] = override_get_student

@pytest.mark.asyncio
async def test_get_community_messages():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/community/messages")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "messages" in data
    assert len(data["messages"]) > 0

@pytest.mark.asyncio
async def test_post_community_message_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"content": "Hello Lumina Community! This is a test message."}
        response = await ac.post("/api/community/messages", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Posted successfully" or data["message"] == "Simulated post"

@pytest.mark.asyncio
async def test_post_community_message_empty_content():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"content": "   "}
        response = await ac.post("/api/community/messages", json=payload)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Content cannot be empty."

@pytest.mark.asyncio
async def test_community_rbac_blocking():
    # In a real scenario, we'd test with an unauthorized role.
    # Currently, our community system allows any 'active' user.
    # We'll keep this as a reminder to implement stricter RBAC if needed.
    pass
