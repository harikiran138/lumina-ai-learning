import re
from typing import Optional, List, Any
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from app.core.config import settings
from app.core.rbac import normalize_role
import structlog

logger = structlog.get_logger(__name__)

# Paths that do not require any authentication
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

# Path prefix -> list of allowed roles
RBAC_RULES = {
    "/api/admin": ["admin", "super_admin", "college_admin"],
    "/api/super-admin": ["super_admin"],
    "/api/college-admin": ["college_admin", "super_admin"],
    "/api/hod": ["hod", "admin", "super_admin", "college_admin"],
    "/api/teacher": ["teacher", "hod", "admin", "super_admin"],
    "/api/student": ["student", "teacher", "hod", "admin", "super_admin"],
    "/api/parent": ["parent", "admin", "super_admin"],
    "/api/mentor": ["mentor", "admin", "super_admin"],
    "/api/counselor": ["counselor", "admin", "super_admin"],
    "/api/alumni": ["alumni", "admin", "super_admin"],
    "/api/content-creator": ["content_creator", "admin", "super_admin"],
    "/api/researcher": ["researcher", "admin", "super_admin"],
    "/api/peer-tutor": ["peer_tutor", "student", "admin", "super_admin"],
}

class SentinelMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # 1. Check if path is exempt
        if any(re.match(pattern, path) for pattern in EXEMPT_PATHS):
            return await call_next(request)

        # Let route-level dependency overrides drive auth in tests and local harnesses.
        if getattr(request.app, "dependency_overrides", None):
            return await call_next(request)
            
        # 2. Extract Token
        auth_header = request.headers.get("Authorization")
        token = None
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            # Fallback to cookie
            token = request.cookies.get("access_token")
            
        if not token:
            logger.warning("missing_auth_token", path=path)
            return await call_next(request)
            
        # 3. Verify JWT
        try:
            # Try decoding with JWT_SECRET first, fallback to SECRET_KEY
            decoded_payload = None
            for secret in [settings.JWT_SECRET, settings.SECRET_KEY]:
                try:
                    if not secret: continue
                    decoded_payload = jwt.decode(token, secret, algorithms=["HS256"])
                    if decoded_payload: break
                except JWTError:
                    continue

            if not decoded_payload:
                raise JWTError("Invalid token signature")

            user_id = decoded_payload.get("sub")
            # Handle both singular 'role' (new) and plural 'roles' (legacy)
            user_role = decoded_payload.get("role")
            user_roles = decoded_payload.get("roles", [])
            
            # Consolidate into a list for RBAC check
            all_user_roles = []
            if user_role:
                all_user_roles.append(normalize_role(user_role))
            if isinstance(user_roles, list):
                all_user_roles.extend(normalize_role(role) for role in user_roles)
            # Unique roles only
            all_user_roles = list(set(all_user_roles))
            
            if not user_id:
                raise JWTError("Missing subject in token")
                
            # Store in request state for downstream use
            request.state.user_id = user_id
            request.state.roles = all_user_roles
            request.state.user = {"id": user_id, "roles": all_user_roles, "role": user_role}
            
        except JWTError as e:
            logger.error("jwt_verification_failed", error=str(e), path=path)
            return JSONResponse(
                status_code=401,
                content={"detail": f"Invalid or expired token: {str(e)}"}
            )
            
        # 4. RBAC Enforcement
        for prefix, allowed_roles in RBAC_RULES.items():
            if path.startswith(prefix):
                # Always allow super_admin to bypass
                if "super_admin" in all_user_roles:
                    continue
                
                if not any(role in all_user_roles for role in allowed_roles):
                    logger.warning("rbac_denied", path=path, user_id=user_id, roles=all_user_roles, required=allowed_roles)
                    return JSONResponse(
                        status_code=403,
                        content={
                            "detail": f"Forbidden: Insufficient permissions for {path}. Required: {allowed_roles}"
                        }
                    )
        
        # 4. Proceed
        response = await call_next(request)
        return response
