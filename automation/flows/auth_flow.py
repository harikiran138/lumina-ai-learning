"""
Lumina Automation — Auth Flow
Tests: login all roles, token validity, /auth/me, logout.
"""

from typing import Dict, Optional

import httpx
from automation.config import API, USERS, HTTP_TIMEOUT
from automation.logger import log, ok, fail, warn


async def login(client: httpx.AsyncClient, role_key: str) -> Optional[str]:
    """Login a user and return the access token, or None on failure."""
    cfg = USERS[role_key]
    try:
        resp = await client.post(
            f"{API}/auth/login",
            json={"identifier": cfg["email"], "password": cfg["password"]},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("accessToken") or data.get("access_token")
            if token:
                ok(f"Login OK  [{role_key}] {cfg['email']}")
                return token
            fail(f"Login response missing token for {role_key}: {data}")
            return None
        fail(f"Login failed [{role_key}] HTTP {resp.status_code}: {resp.text[:200]}")
        return None
    except Exception as exc:
        fail(f"Login exception [{role_key}]: {exc}")
        return None


async def verify_me(client: httpx.AsyncClient, token: str, role_key: str) -> bool:
    """Call /auth/me and confirm the response contains the expected email."""
    try:
        resp = await client.get(
            f"{API}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            email = data.get("email") or data.get("user", {}).get("email", "")
            expected = USERS[role_key]["email"]
            if expected in str(email):
                ok(f"/auth/me OK [{role_key}]")
                return True
            warn(f"/auth/me returned unexpected email '{email}' for {role_key}")
            return False
        warn(f"/auth/me [{role_key}] HTTP {resp.status_code}")
        return False
    except Exception as exc:
        warn(f"/auth/me exception [{role_key}]: {exc}")
        return False


async def run_auth_flow(client: httpx.AsyncClient) -> Dict[str, Optional[str]]:
    """
    Login all 4 roles. Return dict: {role_key: token_or_None}.
    """
    log("Running auth flow for all roles ...")
    tokens: Dict[str, Optional[str]] = {}

    for role_key in ("admin", "hod", "teacher", "student"):
        token = await login(client, role_key)
        tokens[role_key] = token
        if token:
            await verify_me(client, token, role_key)

    succeeded = sum(1 for t in tokens.values() if t)
    log(f"Auth flow complete: {succeeded}/4 roles logged in")
    return tokens
