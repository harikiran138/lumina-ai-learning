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
    # This ensures "Secure" cookies are still captured by the test client
    old_secure = settings.SECURE_COOKIES
    settings.SECURE_COOKIES = False
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as client:
            yield client
    finally:
        settings.SECURE_COOKIES = old_secure

def create_test_token(user_id: str, minutes: int = 5, secret: str = None):
    secret = secret or settings.JWT_SECRET
    payload = {
        "userId": user_id,
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, secret or settings.SECRET_KEY, algorithm="HS256")

@pytest.mark.asyncio
async def test_auth_stress_refresh_flow(ac):
    """Test login -> short-lived access token -> refresh restores session"""
    email = f"stress_{datetime.now(timezone.utc).timestamp()}@test.com"
    pwd = "StressPassword123!"
    user_store = UserStore()
    # Fixed parameter name 'password' instead of 'pwd'
    user = await user_store.create_user(email=email, password=pwd, full_name="Stress Tester", role="student", phone="+919999999999")
    
    try:
        # 1. Login to get initial tokens via JSON endpoint
        login_res = await ac.post("/api/auth/login", json={"identifier": email, "password": pwd})
        assert login_res.status_code == 200
        # For testing, we extract from cookies Jar. 
        # Note: If SECURE=True and we are on http, some clients might drop it.
        refresh_token = ac.cookies.get("refresh_token")
        assert refresh_token is not None

        # access_token is in JSON for Next.js/Mobile, refresh_token is in HTTP-only Cookie
        token = login_res.json()["accessToken"]
        me_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200

        # 3. Simulate Expired Token (Manually created with -1 minute expiry)
        expired_token = create_test_token(user["id"], minutes=-1)
        fail_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert fail_res.status_code == 401

        # 4. Refresh session
        # Sleep 1s to ensure 'iat' (Issued At) is different for the new token
        await asyncio.sleep(1)
        refresh_res = await ac.post("/api/auth/refresh", cookies={"refresh_token": refresh_token})
        assert refresh_res.status_code == 200
        new_token = refresh_res.json()["accessToken"]
        assert new_token != token

        # 5. Verify new token works
        final_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {new_token}"})
        assert final_res.status_code == 200
    finally:
        await user_store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_auth_security_tamper_rejection(ac):
    """PHASE 2 PRE-VIEW: Rejection of tampered tokens"""
    user_id = "fake-user-id"
    # Token signed with WRONG secret
    bad_token = create_test_token(user_id, secret="evil_secret_123")
    res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {bad_token}"})
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_auth_refresh_with_access_token_must_fail(ac):
    """Security rule: Access token cannot be used to 'refresh' session"""
    email = f"stress_refresh_{datetime.utcnow().timestamp()}@test.com"
    pwd = "Password123!"
    user_store = UserStore()
    user = await user_store.create_user(email, pwd, "Refresher", "student", "+918888888888")
    
    try:
        login_res = await ac.post("/api/auth/token", data={"username": email, "password": pwd})
        access_token = login_res.json()["access_token"]
        
        # Try refreshing using access token as the 'refresh_token'
        fail_res = await ac.post("/api/auth/refresh", cookies={"refresh_token": access_token})
        # This should fail either due to decoding errors or missing 'refresh' specific claims
        assert fail_res.status_code in [401, 403]
    finally:
        await user_store.delete_user(user["id"])
