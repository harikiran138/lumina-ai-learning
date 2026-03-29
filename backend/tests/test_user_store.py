import pytest
import uuid
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.store.user_store import UserStore

@pytest.fixture
def store():
    return UserStore()

def gen_user_data():
    uid = str(uuid.uuid4())[:8]
    phone = f"+1555{uuid.uuid4().int % 1000000:06d}"
    return f"test_{uid}@example.com", "password123", "Test User", "student", phone

@pytest.mark.asyncio
async def test_create_user(store):
    email, pwd, name, role, phone = gen_user_data()
    user = await store.create_user(email, pwd, name, role, phone)
    assert user["email"] == email
    assert "password_hash" not in user
    await store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_get_user_by_email(store):
    email, pwd, name, role, phone = gen_user_data()
    user = await store.create_user(email, pwd, name, role, phone)
    fetched = await store.get_user_by_email(email)
    assert fetched["id"] == user["id"]
    await store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_get_user_by_id(store):
    email, pwd, name, role, phone = gen_user_data()
    user = await store.create_user(email, pwd, name, role, phone)
    fetched = await store.get_user_by_id(user["id"])
    assert fetched["email"] == email
    await store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_update_user_role(store):
    email, pwd, name, role, phone = gen_user_data()
    user = await store.create_user(email, pwd, name, role, phone)
    success = await store.update_user_role(user["id"], "teacher")
    assert success
    fetched = await store.get_user_by_id(user["id"])
    assert fetched["role"] == "faculty"
    await store.delete_user(user["id"])


def test_sanitize_user_normalizes_role_and_created_at(store):
    sanitized = store._sanitize_user({
        "id": "user-1",
        "email": "legacy@example.com",
        "role": "admin",
        "name": "Legacy Admin",
        "created_at": "2026-03-20T10:00:00+00:00",
    })

    assert sanitized["role"] == "super_admin"
    assert sanitized["createdAt"] == "2026-03-20T10:00:00+00:00"

@pytest.mark.asyncio
async def test_update_user_fields(store):
    email, pwd, name, role, phone = gen_user_data()
    user = await store.create_user(email, pwd, name, role, phone)
    new_phone = f"+1555{uuid.uuid4().int % 1000000:06d}"
    success = await store.update_user_fields(user["id"], {"name": "Updated Name", "phone": new_phone})
    assert success
    fetched = await store.get_user_by_id(user["id"])
    assert fetched["name"] == "Updated Name"
    assert fetched["phone"] == new_phone
    await store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_delete_user(store):
    email, pwd, name, role, phone = gen_user_data()
    user = await store.create_user(email, pwd, name, role, phone)
    success = await store.delete_user(user["id"])
    assert success
    fetched = await store.get_user_by_id(user["id"])
    assert fetched is None
