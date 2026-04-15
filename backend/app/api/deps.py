from typing import Generator, Optional, Dict, Any, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import logging

from app.core.config import settings
from app.store.user_store import UserStore
from app.core.rbac import normalize_role, ALL_ROLES
from app.core.blacklist import is_token_revoked

logger = logging.getLogger("uvicorn.error")

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

def _ensure_valid_role(current_user: dict) -> str:
    role = normalize_role(current_user.get("role"))
    if role not in ALL_ROLES and role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid user role")
    return role

def _ensure_2fa(current_user: dict):
    if not current_user.get("two_factor_verified"):
        logger.error(f"administrative_2fa_block: user_id={current_user.get('id')} role={current_user.get('role')}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Mandatory 2FA verification required for administrative access."
        )

# Use public user store for unauthenticated lookups (identity verification)
def get_user_store_public() -> UserStore:
    from app.database.supabase_manager import supabase_db
    return UserStore(db=supabase_db)

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    user_store: UserStore = Depends(get_user_store_public)
) -> Dict[str, Any]:
    """
    Core dependency to retrieve and validate the current authenticated user.
    Supports Authorization header (Bearer token) and optional cookie fallback.
    """
    # 1. Extract token (Priority: Authorization Header > OAuth2 Scheme > Cookie)
    auth_token = None
    auth_header = request.headers.get("Authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        auth_token = auth_header.split(" ")[1]
    elif token:
        auth_token = token
    else:
        auth_token = request.cookies.get("access_token")

    if not auth_token:
        # Compatibility fallback for testing or mismatched storage keys
        alt_token = request.cookies.get("token") or request.cookies.get("jwt")
        if alt_token:
            auth_token = alt_token

    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Decode and Validate Token
    try:
        # Try JWT_SECRET first (standard), fall back to SECRET_KEY (legacy/unified)
        payload = None
        try:
            payload = jwt.decode(auth_token, settings.JWT_SECRET, algorithms=["HS256"])
        except Exception:
            payload = jwt.decode(auth_token, settings.SECRET_KEY, algorithms=["HS256"])

        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Check for revocation
        jti = payload.get("jti")
        if jti and is_token_revoked(jti):
            raise HTTPException(status_code=401, detail="Token has been revoked.")

        # Extract user identifiers
        user_id = payload.get("user_id") or payload.get("userId") or payload.get("id") or payload.get("sub")
        email = payload.get("email")
        
        # Heuristic: if sub looks like email, use as email fallback
        sub = payload.get("sub")
        if not email and sub and "@" in str(sub):
            email = sub

        if not user_id and not email:
            raise HTTPException(status_code=401, detail="Invalid token: no user identifier")

        # 3. Lookup User in Store
        user = None
        if user_id:
            # Check if user_id is a valid UUID before lookup
            import uuid
            try:
                uuid.UUID(str(user_id))
                user = await user_store.get_user_by_id(user_id, include_sensitive=True)
            except (ValueError, TypeError):
                # If not UUID, it might be the email (legacy behavior)
                if "@" in str(user_id):
                    user = await user_store.get_user_by_email(user_id, include_sensitive=True)

        if not user and email:
            user = await user_store.get_user_by_email(email, include_sensitive=True)

        if not user:
            raise HTTPException(status_code=401, detail="User session not found")

        # Ensure user is active
        if not user.get("is_active", True) and user.get("status") != "active":
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")

        # Attach original token for downstream institutional scoping
        user["access_token"] = auth_token
        
        # Ensure ID exists (compatibility)
        if "id" not in user and user_id:
            user["id"] = user_id
            
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"token_validation_failed: {str(e)} path={request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user

async def get_current_super_admin(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super Admin privileges required")
    _ensure_2fa(current_user)
    return current_user

async def get_current_college_admin(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"admin", "college_admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="College Admin privileges required")
    _ensure_2fa(current_user)
    return current_user

async def get_current_hod(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"hod", "college_admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HOD privileges required")
    return current_user

async def get_current_teacher(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    allowed = {"teacher", "hod", "college_admin", "super_admin", "faculty"}
    if role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher privileges required")
    return current_user

get_current_faculty = get_current_teacher

async def get_current_student(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student privileges required")
    return current_user

async def get_current_parent(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"parent", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent privileges required")
    return current_user

async def get_current_mentor(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"mentor", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Mentor privileges required")
    return current_user

async def get_current_peer_tutor(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"peer_tutor", "student", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Peer Tutor privileges required")
    return current_user

async def get_current_researcher(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"researcher", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Researcher privileges required")
    return current_user
