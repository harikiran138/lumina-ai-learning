import pytest
import uuid
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.store.user_store import UserStore

@pytest.fixture
async def ac(async_client):
    yield async_client

def gen_user_data():
    uid = str(uuid.uuid4())[:8]
    phone = f"+1555{uuid.uuid4().int % 1000000:06d}"
    return f"test_{uid}@example.com", "Password123", "Test User", "student", phone

@pytest.mark.asyncio
async def test_register_student_tc_signup_001(ac):
    """TC-SIGNUP-001: Student registration."""
    email, pwd, name, _, phone = gen_user_data()
    res = await ac.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": name,
        "role": "student",
        "phone": phone
    })
    assert res.status_code == 201
    
    user_store = UserStore()
    user = await user_store.get_user_by_email(email)
    assert user is not None
    assert user["role"] == "student"
    await user_store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_register_teacher_tc_signup_002(ac):
    """TC-SIGNUP-002: Teacher registration."""
    email, pwd, name, _, phone = gen_user_data()
    res = await ac.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": name,
        "role": "teacher",
        "phone": phone
    })
    assert res.status_code == 201
    
    user_store = UserStore()
    user = await user_store.get_user_by_email(email)
    assert user is not None
    assert user["role"] == "teacher"
    await user_store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_register_invalid_role_tc_signup_003(ac):
    """TC-SIGNUP-003: Invalid role block (Invite-only role)."""
    email, pwd, name, _, phone = gen_user_data()
    res = await ac.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": name,
        "role": "super_admin",
        "phone": phone
    })
    # Should be 403 Forbidden or 400 Bad Request depending on implementation
    assert res.status_code in (400, 403)

@pytest.mark.asyncio
async def test_duplicate_email(ac):
    email, pwd, name, role, phone = gen_user_data()
    user_store = UserStore()
    user = await user_store.create_user(email, pwd, name, role, phone)
    
    res = await ac.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": "Copycat",
    })
    # Due to Pydantic validation being stricter now, 
    # if the email is a duplicate but valid, it might still return 422 if it hits validation first,
    # but here it should be 400 if it passes Pydantic and hits the UserStore check.
    assert res.status_code == 400
    
    await user_store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_login(ac):
    email, pwd, name, role, phone = gen_user_data()
    user_store = UserStore()
    user = await user_store.create_user(email, pwd, name, role, phone)
    
    # Login via /login form data
    res = await ac.post("/api/auth/token", data={
        "username": email,
        "password": pwd
    })
    assert res.status_code == 200
    assert "access_token" in res.json()
    
    await user_store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_login_wrong_password(ac):
    email, pwd, name, role, phone = gen_user_data()
    user_store = UserStore()
    user = await user_store.create_user(email, pwd, name, role, phone)
    
    res = await ac.post("/api/auth/token", data={
        "username": email,
        "password": "wrongpassword"
    })
    assert res.status_code == 401
    
    await user_store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_get_me(ac):
    email, pwd, name, role, phone = gen_user_data()
    user_store = UserStore()
    user = await user_store.create_user(email, pwd, name, role, phone)
    
    # Get token
    login_res = await ac.post("/api/auth/token", data={
        "username": email,
        "password": pwd
    })
    token = login_res.json()["access_token"]
    
    # Use token
    res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == email
    
    await user_store.delete_user(user["id"])
