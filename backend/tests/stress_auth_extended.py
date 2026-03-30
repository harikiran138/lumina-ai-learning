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

def create_test_token(user, minutes: int = 5, secret: str = None, token_type: str = "access"):
    secret = secret or settings.JWT_SECRET
    # Production claims from _build_claims + base claims
    payload = {
        "userId": user["id"],
        "sub": user["email"],
        "type": token_type,
        "role": user.get("role"),
        "collegeId": user.get("college_id"),
        "deptId": user.get("dept_id") or user.get("department_id"),
        "batchId": user.get("batch_id"),
        "email": user.get("email"),
        "onboardingCompleted": (user.get("onboarding_step") or 0) >= 5,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, secret, algorithm="HS256")

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
        login_status = login_res.status_code
        refresh_token_cookie = ac.cookies.get("refresh_token")
        access_token = login_res.json().get("accessToken")
        
        # 2. Access protected route
        me_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {access_token}"})
        me_status = me_res.status_code

        # 3. Simulate Access Token Expiry (Manual Token)
        expired_token = create_test_token(user, minutes=-5)
        fail_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        fail_status = fail_res.status_code

        # 4. Refresh Token Logic
        refresh_res = await ac.post("/api/auth/refresh", cookies={"refresh_token": refresh_token_cookie})
        refresh_status = refresh_res.status_code
        new_access_token = refresh_res.json().get("accessToken") if refresh_status == 200 else "FAIL"
        
        # 5. Verify New Token
        final_me = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {new_access_token}"})
        final_status = final_me.status_code
        
        # ONE BIG ASSERT TO SEE ALL STATUSES IN TRACEBACK
        assert (login_status, me_status, fail_status, refresh_status, final_status) == (200, 200, 401, 200, 200), \
            f"Statuses: login={login_status}, me={me_status}, fail={fail_status}, refresh={refresh_status}, final={final_status}. Tokens: match={new_access_token == access_token}"

    finally:
        await user_store.delete_user(user["id"])

@pytest.mark.asyncio
async def test_auth_invalid_scenarios(ac):
    """
    STRESS TEST: Invalid Token, Missing Cookie, Tampered Payload
    """
    # 1. Tampered token (wrong secret for access)
    dummy_user = {"id": "some-id", "email": "some@test.com", "role": "student"}
    bad_secret_token = create_test_token(dummy_user, secret="incorrect_secret_key_12345")
    res1 = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {bad_secret_token}"})
    assert res1.status_code == 401

    # 2. Invalid Token Format
    res2 = await ac.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt-at-all"})
    assert res2.status_code == 401

    # 3. Missing Refresh Cookie on Refresh Endpoint
    res3 = await ac.post("/api/auth/refresh")
    assert res3.status_code == 401

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
        
        # 1. Login attempt - should fail with 403
        login_res = await ac.post("/api/auth/login", json={"identifier": email, "password": pwd})
        assert login_res.status_code == 403
        # Response body might be just "Account is inactive" string or json
        assert "inactive" in str(login_res.text).lower()

        # 2. Protected access with existing valid token - should fail with 403
        valid_token = create_test_token(user, minutes=5)
        protected_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {valid_token}"})
        assert protected_res.status_code == 403

    finally:
        await user_store.delete_user(user["id"])
