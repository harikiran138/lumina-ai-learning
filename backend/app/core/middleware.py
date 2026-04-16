import re
import time
from typing import Any, Optional

from fastapi import Request
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
import structlog

logger = structlog.get_logger(__name__)

# Paths that do not require any authentication parsing.
EXEMPT_PATHS = [
    r"^/$",
    r"^/docs",
    r"^/redoc",
    r"^/openapi.json",
    r"^/api/v1/auth/login",
    r"^/api/v1/auth/register",
    r"^/api/v1/auth/token",
    r"^/api/v1/auth/refresh",
    r"^/api/v1/auth/logout",
    r"^/api/auth/login",
    r"^/api/auth/register",
    r"^/api/auth/token",
    r"^/api/auth/refresh",
    r"^/api/auth/logout",
    r"^/metrics",
    r"^/health",
]


class SentinelMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        path = request.url.path

        # Always initialize user context to a known shape.
        request.state.user = None
        request.state.user_id = None

        if not any(re.match(pattern, path) for pattern in EXEMPT_PATHS):
            auth_header = request.headers.get("Authorization")
            token: Optional[str] = None
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1]
            else:
                token = request.cookies.get("access_token")

            if token:
                payload = None
                try:
                    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
                except JWTError:
                    try:
                        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                    except JWTError as exc:
                        logger.warning("token_decode_failed", path=path, error=str(exc))

                if payload:
                    user_id = payload.get("user_id") or payload.get("userId") or payload.get("id") or payload.get("sub")
                    role = payload.get("role")
                    institution_id = payload.get("collegeId") or payload.get("institution_id")
                    request.state.user_id = user_id
                    request.state.user = {
                        "id": user_id,
                        "role": role,
                        "institution_id": institution_id,
                    }

        # Role authorization is handled ONLY in deps.py
        response = await call_next(request)
        return self.add_headers(response, start_time)

    def add_headers(self, response: Any, start_time: float):
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        response.headers["Lumina-Health"] = "Stable"
        return response
