import pytest
import asyncio
from jose import jwt
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.store.user_store import UserStore

@pytest.fixture
async def ac():
    # Force SECURE_COOKIES to False for local testing because httpx uses http://localhost
    old_secure = settings.SECURE_COOKIES
    settings.SECURE_COOKIES = False
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as client:
            yield client
    finally:
        settings.SECURE_COOKIES = old_secure

def create_test_token(user_id: str, minutes: int = 5, secret: str = None, token_type: str = "access"):
    secret = secret or settings.JWT_SECRET
    payload = {
        "userId": user_id,
        "sub": user_id,
        "type": token_type,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, secret or settings.SECRET_KEY, algorithm="HS256")

@pytest.mark.asyncio
async def test_auth_full_stress_cycle(ac):
    """
    STRESS TEST: Login -> Protected Access -> Expiry -> Refresh -> New Session
    """
    email = f"stress_harden_{datetime.now(timezone.utc).timestamp()}@test.com"
    pwd = "HardenedPassword123!"
    user_store = UserStore()
    user = await user_store.create_user(email=email, password=pwd, full_name="Hardened User", role="student", phone="+917777777777")
    
    try:
        # 1. Login
        login_res = await ac.post("/api/auth/login", json={"identifier": email, "password": pwd})
        print(f"DEBUG LOGIN: {login_res.status_code} {login_res.text}")
        assert login_res.status_code == 200
        refresh_token = ac.cookies.get("refresh_token")
        # Frontend-facing JSON uses camelCase 'accessToken'
        access_token = login_res.json().get("accessToken")
        assert access_token is not None
        assert refresh_token is not None

        # 2. Access protected route
        me_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {access_token}"})
        assert me_res.status_code == 200

        # 3. Simulate Access Token Expiry (Manual Token)
        expired_token = create_test_token(user["id"], minutes=-5)
        fail_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert fail_res.status_code == 401

        # 4. Refresh Token Logic
        refresh_res = await ac.post("/api/auth/refresh", cookies={"refresh_token": refresh_token})
        print(f"DEBUG REFRESH: {refresh_res.status_code} {refresh_res.text}")
        assert refresh_res.status_code == 200
        new_access_token = refresh_res.json().get("accessToken")
        assert new_access_token is not None
        assert new_access_token != access_token

        # 5. Verify New Token
        final_me = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {new_access_token}"})
        assert final_me.status_code == 200
        assert final_me.json()["email"] == email

    finally:
        await user_store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_auth_invalid_scenarios(ac):
    """
    STRESS TEST: Invalid Token, Missing Cookie, Tampered Payload
    """
    # 1. Tampered token (wrong secret)
    bad_secret_token = create_test_token("some-id", secret="incorrect_secret_key_12345")
    res1 = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {bad_secret_token}"})
    assert res1.status_code == 401

    # 2. Invalid Token Format
    res2 = await ac.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt-at-all"})
    assert res2.status_code == 401

    # 3. Missing Refresh Cookie on Refresh Endpoint
    res3 = await ac.post("/api/auth/refresh")
    assert res3.status_code in [401, 400]

@pytest.mark.asyncio
async def test_auth_deactivated_user(ac):
    """
    STRESS TEST: Deactivated user must be blocked even with valid token
    """
    email = f"deactivated_{datetime.now(timezone.utc).timestamp()}@test.com"
    pwd = "Password123!"
    user_store = UserStore()
    user = await user_store.create_user(email=email, password=pwd, full_name="Deactivated User", role="student", phone="+916666666666")
    
    try:
        # Use the specific method in UserStore to ensure 'is_active' is correctly set
        await user_store.update_user_status(user["id"], "inactive")
        
        # 1. Login attempt - should fail
        login_res = await ac.post("/api/auth/login", json={"identifier": email, "password": pwd})
        assert login_res.status_code == 403
        assert "inactive" in login_res.json()["detail"].lower()

        # 2. Protected access with existing valid token (if they somehow had one) - should fail
        # This tests the 'get_current_user' dependency logic
        valid_token = create_test_token(user["id"])
        protected_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {valid_token}"})
        assert protected_res.status_code == 403

    finally:
        await user_store.delete_user(user["id"])
