import pytest
from httpx import AsyncClient, ASGITransport
import uuid
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.main import app
from app.store.user_store import UserStore

@pytest.fixture
async def ac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as client:  # nosec B113
        yield client

def gen_user_data():
    uid = str(uuid.uuid4())[:8]
    phone = f"+1555{uuid.uuid4().int % 1000000:06d}"
    return f"test_{uid}@example.com", "Password123", "Test User", "student", phone

@pytest.mark.asyncio
async def test_register(ac):
    email, pwd, name, role, phone = gen_user_data()
    res = await ac.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": name,
        "role": role,
        "phone": phone
    })
    assert res.status_code == 201
    
    # Check if user exists
    user_store = UserStore()
    user = await user_store.get_user_by_email(email)
    assert user is not None
    await user_store.delete_user(user["id"])

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
