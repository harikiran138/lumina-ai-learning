import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_debug_auth_path():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Check health
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.status_code}"
        
        # Check login
        res = await client.post("/api/auth/login", json={})
        # We expect 422 if it exists (since we sent empty json but it expects email/password)
        # OR 200 if it handles it. 404 means it's MISSING.
        print(f"DEBUG LOGIN STATUS: {res.status_code}")
        assert res.status_code != 404, "Auth login route is 404!"
        
        # Filtered routes
        print("Auth-related routes:")
        for route in app.routes:
            if hasattr(route, "path") and "auth" in route.path:
                 print(f"FOUND: {route.path}")
