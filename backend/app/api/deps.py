from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import logging

from app.core.config import settings
from app.dependencies import get_user_store
from app.store.user_store import UserStore

logger = logging.getLogger("uvicorn.error")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)

def get_db() -> Generator:
    """
    Dependency to get DB session (Currently unused Supabase manager fallback).
    """
    yield None

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    user_store: UserStore = Depends(get_user_store),
):
    """
    Dependency to get current authenticated user with real JWT validation.
    """
    # Support both Authorization Header (Bearer) and HTTP-only Cookie
    auth_token = token or request.cookies.get("access_token")
    
    if not auth_token:
        # Fallback to Authorization header if token dependency failed
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            auth_token = auth_header.split(" ")[1]
            
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Try primary JWT_SECRET first
        try:
            payload = jwt.decode(auth_token, settings.JWT_SECRET, algorithms=["HS256"])
        except Exception:
            # Fallback to legacy SECRET_KEY if JWT_SECRET fails
            payload = jwt.decode(auth_token, settings.SECRET_KEY, algorithms=["HS256"])
            
        user_id = payload.get("userId")
        email = payload.get("sub") or payload.get("email")
        
        if not user_id and not email:
            raise HTTPException(status_code=401, detail="Invalid token: no user identifier")
            
        # Real lookup against UserStore
        user = await user_store.get_user_by_id(user_id) if user_id else await user_store.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
            
        return user
            
    except Exception as e:
        logger.warning(f"token_validation_failed: {str(e)} path={request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
):
    """
    Dependency to ensure the user is active.
    """
    # We default is_active to True if the field is missing from user record
    if not current_user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
