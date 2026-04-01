import re
from typing import List, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from app.core.config import settings
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
    r"^/api/v1/auth/refresh",
    r"^/api/auth/login",
    r"^/api/auth/register",
    r"^/api/auth/refresh",
    r"^/metrics",
    r"^/health",
]

# Paths that require specific roles (regex based)
RBAC_RULES = [
    {"pattern": r"^/api/admin", "required_roles": ["admin"]},
    {"pattern": r"^/api/teacher", "required_roles": ["teacher", "admin"]},
    {"pattern": r"^/api/student", "required_roles": ["student", "admin"]},
]

class SentinelMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # 1. Check if path is exempt
        if any(re.match(pattern, path) for pattern in EXEMPT_PATHS):
            return await call_next(request)
            
        # 2. Extract and Verify JWT
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.warning("missing_auth_header", path=path)
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication header missing or invalid"}
            )
            
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=["HS256"]
            )
            user_id = payload.get("sub")
            roles = payload.get("roles", [])
            
            if not user_id:
                raise JWTError("Missing subject in token")
                
            # Store in request state for downstream use
            request.state.user_id = user_id
            request.state.roles = roles
            request.state.user = {"id": user_id, "roles": roles}
            
        except JWTError as e:
            logger.error("jwt_verification_failed", error=str(e), path=path)
            return JSONResponse(
                status_code=401,
                content={"detail": f"Invalid or expired token: {str(e)}"}
            )
            
        # 3. RBAC Enforcement
        for rule in RBAC_RULES:
            if re.match(rule["pattern"], path):
                if not any(role in roles for role in rule["required_roles"]):
                    logger.warning("rbac_denied", path=path, user_id=user_id, roles=roles, required=rule["required_roles"])
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Forbidden: Insufficient permissions"}
                    )
        
        # 4. Proceed
        response = await call_next(request)
        return response
