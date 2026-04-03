import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from jose import jwt

from app.core.config import settings
from app.core.security import create_access_token
from app.main import app
from app.routers.auth import _build_claims
from app.store.user_store import UserStore


@pytest.fixture
async def ac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as client:  # nosec B113
        yield client


def _seed_user(role: str = "student"):
    uid = str(uuid.uuid4())[:8]
    return {
        "email": f"{role}.{uid}@example.com",
        "password": "Password123",
        "full_name": f"{role.title()} User",
        "role": role,
        "phone": f"+1555{uuid.uuid4().int % 1000000:06d}",
    }


@pytest.mark.asyncio
async def test_register_rejects_unknown_role(ac):
    payload = _seed_user(role="quantum_overlord")
    response = await ac.post(
        "/api/auth/register",
        json={
            "email": payload["email"],
            "password": payload["password"],
            "full_name": payload["full_name"],
            "role": payload["role"],
            "phone": payload["phone"],
        },
    )

    assert response.status_code == 400
    assert "Invalid role" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_rejects_invite_only_role(ac):
    payload = _seed_user(role="counselor")
    response = await ac.post(
        "/api/auth/register",
        json={
            "email": payload["email"],
            "password": payload["password"],
            "full_name": payload["full_name"],
            "role": payload["role"],
            "phone": payload["phone"],
        },
    )

    assert response.status_code == 403
    assert "requires an admin invitation" in response.json()["detail"]


@pytest.mark.asyncio
async def test_cookie_session_persists_after_json_login(ac):
    user_store = UserStore()
    user = await user_store.create_user(**_seed_user(role="student"))
    await user_store.update_user_fields(user["id"], {"onboarding_step": 3})

    try:
        login_response = await ac.post(
            "/api/auth/login",
            json={"identifier": user["email"], "password": "Password123"},
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.headers.get("set-cookie", "")

        status_response = await ac.get("/api/onboarding/status")
        assert status_response.status_code == 200
        payload = status_response.json()
        assert payload["role"] == "student"
        assert payload["step"] == 3
        assert payload["isComplete"] is False
    finally:
        await user_store.delete_user(user["id"])


@pytest.mark.asyncio
async def test_refresh_reissues_access_cookie_with_onboarding_claims(ac):
    user_store = UserStore()
    user = await user_store.create_user(**_seed_user(role="faculty"))
    await user_store.update_user_fields(user["id"], {"onboarding_step": 5})

    try:
        login_response = await ac.post(
            "/api/auth/login",
            json={"identifier": user["email"], "password": "Password123"},
        )
        assert login_response.status_code == 200

        refresh_response = await ac.post("/api/auth/refresh")
        assert refresh_response.status_code == 200
        assert "access_token" in refresh_response.headers.get("set-cookie", "")

        payload = refresh_response.json()
        decoded = jwt.decode(payload["accessToken"], settings.JWT_SECRET, algorithms=["HS256"])
        assert decoded["sub"] == user["id"]
        assert decoded["onboardingStep"] == 5
        assert decoded["onboardingCompleted"] is True
        assert decoded["adaptiveOnboardingCompleted"] is True
    finally:
        await user_store.delete_user(user["id"])


@pytest.mark.asyncio
async def test_logout_clears_cookie_session_and_blocks_follow_up_requests(ac):
    user_store = UserStore()
    user = await user_store.create_user(**_seed_user(role="student"))

    try:
        await user_store.update_user_fields(user["id"], {"onboarding_step": 2})
        refreshed_user = await user_store.get_user_by_id(user["id"], include_sensitive=True)
        assert refreshed_user is not None

        access_token = create_access_token(
            subject=user["id"],
            extra_claims=_build_claims(refreshed_user),
            secret_key=settings.JWT_SECRET,
        )
        refresh_token = create_access_token(
            subject=user["id"],
            extra_claims={"type": "refresh", **_build_claims(refreshed_user)},
            secret_key=settings.JWT_REFRESH_SECRET,
        )

        ac.cookies.set("access_token", access_token)
        ac.cookies.set("refresh_token", refresh_token)

        status_response = await ac.get("/api/onboarding/status")
        assert status_response.status_code == 200

        logout_response = await ac.post("/api/auth/logout")
        assert logout_response.status_code == 200

        follow_up = await ac.get("/api/onboarding/status")
        assert follow_up.status_code == 401
    finally:
        await user_store.delete_user(user["id"])


@pytest.mark.asyncio
async def test_student_token_cannot_access_admin_dashboard(ac):
    user_store = UserStore()
    user = await user_store.create_user(**_seed_user(role="student"))

    try:
        login_response = await ac.post(
            "/api/auth/login",
            json={"identifier": user["email"], "password": "Password123"},
        )
        assert login_response.status_code == 200
        token = login_response.json()["accessToken"]

        admin_response = await ac.get(
            "/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert admin_response.status_code == 403
    finally:
        await user_store.delete_user(user["id"])
