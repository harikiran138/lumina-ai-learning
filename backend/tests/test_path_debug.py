import pytest

@pytest.mark.asyncio
async def test_debug_auth_path(async_client):
    from app.main import app

    res = await async_client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"

    res = await async_client.post("/api/auth/login", json={})
    assert res.status_code != 404, "Auth login route is 404!"

    auth_routes = [route.path for route in app.routes if hasattr(route, "path") and "auth" in route.path]
    assert auth_routes
