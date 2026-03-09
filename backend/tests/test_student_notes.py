import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import create_access_token
from datetime import timedelta
import uuid

client = TestClient(app)

@pytest.fixture
def mock_user():
    return {
        "id": "00000000-0000-0000-0000-000000000001",
        "email": "test@example.com",
        "full_name": "Test Student",
        "role": "student"
    }

@pytest.fixture
def mock_store():
    # Force store to use local mode by setting client to None
    from app.store.user_data_store import UserDataStore
    store = UserDataStore()
    store.client = None
    return store

@pytest.fixture
def auth_headers(mock_user, mock_store):
    # Override get_current_user to return our mock user
    from app.routers.student import get_current_user
    from app.dependencies import get_user_data_store
    
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_user_data_store] = lambda: mock_store
    
    access_token = create_access_token(
        subject=mock_user["email"],
        expires_delta=timedelta(minutes=15)
    )
    yield {"Authorization": f"Bearer {access_token}"}
    # Clean up overrides
    app.dependency_overrides = {}

def test_notes_crud_flow(auth_headers):
    # 1. Create a note
    note_data = {
        "title": "Test Note",
        "subject": "Testing",
        "content": "This is a test note content."
    }
    response = client.post("/api/student/notes", json=note_data, headers=auth_headers)
    if response.status_code != 200:
        print(f"DEBUG: Status={response.status_code}, Body={response.text}")
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    assert res_data["success"] is True
    assert "id" in res_data
    note_id = res_data["id"]

    # 2. Get notes and verify our note is there
    response = client.get("/api/student/notes", headers=auth_headers)
    assert response.status_code == 200
    notes = response.json()
    assert any(n["id"] == note_id for n in notes)

    # 3. Update the note
    update_data = {
        "title": "Updated Test Note",
        "subject": "Testing Updated",
        "content": "Updated content."
    }
    response = client.put(f"/api/student/notes/{note_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # 4. Verify update
    response = client.get("/api/student/notes", headers=auth_headers)
    notes = response.json()
    updated_note = next((n for n in notes if n["id"] == note_id), None)
    assert updated_note["title"] == "Updated Test Note"
    assert updated_note["content"] == "Updated content."

    # 5. Delete the note
    response = client.delete(f"/api/student/notes/{note_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # 6. Verify deletion
    response = client.get("/api/student/notes", headers=auth_headers)
    notes = response.json()
    assert not any(n["id"] == note_id for n in notes)
