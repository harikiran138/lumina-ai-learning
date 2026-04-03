import pytest
from app.store.user_store import UserStore


@pytest.fixture
async def ac(async_client):
    yield async_client


@pytest.mark.asyncio
async def test_json_login_token_can_access_onboarding_status(ac):
    user_store = UserStore()
    user = await user_store.create_user(
        email="token.admin@example.com",
        password="Password123!",
        full_name="Token Admin",
        role="admin",
        phone="+15550001111",
    )

    try:
        login_response = await ac.post(
            "/api/auth/login",
            json={"identifier": "token.admin@example.com", "password": "Password123!"},
        )
        assert login_response.status_code == 200
        payload = login_response.json()
        assert payload["user"]["role"] == "super_admin"
        assert "accessToken" in payload
        assert "access_token" in login_response.headers.get("set-cookie", "")

        status_response = await ac.get(
            "/api/onboarding/status",
            headers={"Authorization": f"Bearer {payload['accessToken']}"},
        )
        assert status_response.status_code == 200
        status_payload = status_response.json()
        assert status_payload["role"] == "super_admin"
    finally:
        await user_store.delete_user(user["id"])


@pytest.mark.asyncio
async def test_refresh_reissues_access_cookie(ac):
    user_store = UserStore()
    user = await user_store.create_user(
        email="refresh.student@example.com",
        password="Password123!",
        full_name="Refresh Student",
        role="student",
        phone="+15550002222",
    )

    try:
        login_response = await ac.post(
            "/api/auth/login",
            json={"identifier": "refresh.student@example.com", "password": "Password123!"},
        )
        assert login_response.status_code == 200

        refresh_response = await ac.post("/api/auth/refresh")
        assert refresh_response.status_code == 200
        payload = refresh_response.json()
        assert "accessToken" in payload
        assert "access_token" in refresh_response.headers.get("set-cookie", "")
    finally:
        await user_store.delete_user(user["id"])
