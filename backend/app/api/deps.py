from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import logging

from app.core.config import settings
from app.store.user_store import UserStore
from app.core.rbac import normalize_role, ALL_ROLES

logger = logging.getLogger("uvicorn.error")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)


def _ensure_valid_role(current_user: dict) -> str:
    role = normalize_role(current_user.get("role"))
    if role not in ALL_ROLES and role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid user role")
    return role

def get_db() -> Generator:
    """
    Dependency to get DB session (Currently unused Supabase manager fallback).
    """
    yield None

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
):
    from app.dependencies import get_user_store
    user_store = get_user_store()
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
            # Fallback to legacy SECRET_KEY if JWT_SECRET fails (Lumina Shield)
            payload = jwt.decode(auth_token, settings.JWT_SECRET or settings.SECRET_KEY, algorithms=["HS256"])
            
        user_id = payload.get("user_id") or payload.get("userId") or payload.get("id")
        email = payload.get("sub") or payload.get("email")
        
        if not user_id and not email:
            raise HTTPException(status_code=401, detail="Invalid token: no user identifier")
            
        # Real lookup against UserStore
        user = (
            await user_store.get_user_by_id(user_id, include_sensitive=True)
            if user_id
            else await user_store.get_user_by_email(email, include_sensitive=True)
        )
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
            
        # ATTACH ACCESS TOKEN for ScopedSupabase (Lumina Shield)
        user["access_token"] = auth_token
        
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
    _ensure_valid_role(current_user)
    return current_user

async def get_current_super_admin(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super Admin privileges required")
    return current_user

async def get_current_college_admin(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"admin", "college_admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="College Admin privileges required")
    
    inst_id = current_user.get("college_id") or current_user.get("institution_id")
    if not inst_id and role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No college_id associated with this user")
    
    current_user["resolved_institution_id"] = inst_id
    return current_user

async def get_current_hod(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"hod", "college_admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HOD privileges required")
    
    dept_id = current_user.get("dept_id") or current_user.get("department_id")
    if not dept_id and role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No department_id associated with this user")
    
    current_user["resolved_department_id"] = dept_id
    return current_user

async def get_current_teacher(current_user: dict = Depends(get_current_active_user)) -> dict:
    """
    Teacher/Faculty dependency. Resolves department context if available.
    """
    role = _ensure_valid_role(current_user)
    if role not in {"teacher", "hod", "college_admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher privileges required")

    dept_id = current_user.get("dept_id") or current_user.get("department_id")
    if not dept_id and role not in {"super_admin", "hod", "college_admin"}:
        logger.warning(f"teacher_no_dept_id: user_id={current_user.get('id')}")

    current_user["resolved_department_id"] = dept_id
    return current_user

get_current_faculty = get_current_teacher


async def get_current_student(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student privileges required")
    return current_user

async def get_current_mentor(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"mentor", "teacher", "hod", "college_admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Mentor privileges required")
    return current_user

async def get_current_peer_tutor(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"peer_tutor", "mentor", "teacher", "hod", "college_admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Peer Tutor privileges required")
    return current_user

async def get_current_counselor(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"counselor", "college_admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Counselor privileges required")
    return current_user

async def get_current_parent(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"parent", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent privileges required")
    return current_user

async def get_current_guest(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"guest", "student", "parent", "teacher", "hod", "college_admin", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guest privileges required")
    return current_user

async def get_current_researcher(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"researcher", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Researcher privileges required")
    return current_user

async def get_current_content_creator(current_user: dict = Depends(get_current_active_user)) -> dict:
    role = _ensure_valid_role(current_user)
    if role not in {"content_creator", "super_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Content Creator privileges required")
    return current_user
