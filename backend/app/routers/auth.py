from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import timedelta, datetime, timezone
import re

from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.store.user_store import UserStore
from app.dependencies import get_user_store
from app.database.supabase_manager import supabase_db
from app.core.audit import audit_logger
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

from typing import Optional
import uuid

# ── Regex patterns for identifier resolution ───────────────────────────────────
_ROLL_RE   = re.compile(r'^\d{2}NU\dA\d{4}$')
_EMP_RE    = re.compile(r'^(FAC|HOD|ADM)\d{3}$')

# ── Brute-force constants ──────────────────────────────────────────────────────
_LOCK_THRESHOLD = 5
_LOCK_MINUTES   = 15


# ── Models ─────────────────────────────────────────────────────────────────────
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2)
    role: str = "student"
    phone: Optional[str] = None

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r"[0-9]", v):
            raise ValueError('Password must contain at least one number')
        return v


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    full_name: Optional[str] = None
    college_id: Optional[str] = None
    dept_id: Optional[str] = None
    batch_id: Optional[str] = None
    onboarding_step: Optional[int] = None
    profile_photo_url: Optional[str] = None


class LoginRequest(BaseModel):
    # Accepts either 'identifier' (new path) or 'email' (backward-compat).
    identifier: Optional[str] = None
    email: Optional[str] = None
    password: str
    role_hint: Optional[str] = None


class AcceptInvite(BaseModel):
    token: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str = Field(min_length=8)

    @field_validator('newPassword')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r"[0-9]", v):
            raise ValueError('Password must contain at least one number')
        return v


class LoginResponse(BaseModel):
    accessToken: Optional[str] = None
    user: Optional[dict] = None
    forcePasswordChange: Optional[bool] = None
    tempToken: Optional[str] = None


# ── Helpers ────────────────────────────────────────────────────────────────────
def _normalize_role(role: str) -> str:
    if role == "admin":
        return "super_admin"
    if role == "teacher":
        return "faculty"
    return role


def _build_claims(user: dict) -> dict:
    return {
        "role": _normalize_role(user.get("role")),
        "collegeId": user.get("college_id"),
        "deptId": user.get("dept_id") or user.get("department_id"),
        "batchId": user.get("batch_id"),
        "email": user.get("email"),
        "onboardingCompleted": (user.get("onboarding_step") or 0) >= 5,
    }


def _get_identifier_type(identifier: str) -> str:
    if _ROLL_RE.match(identifier):
        return "roll_number"
    if _EMP_RE.match(identifier):
        return "employee_id"
    return "email"


def _resolve_identifier(identifier: str, user_store: UserStore) -> Optional[dict]:
    """Resolve a login identifier (roll number / employee ID / email) to a user row."""
    identifier = identifier.strip()
    try:
        client = supabase_db.get_client()
        if _ROLL_RE.match(identifier):
            r = client.table("users").select("*").eq("roll_number", identifier).limit(1).execute()
            if r.data:
                return r.data[0]
        elif _EMP_RE.match(identifier):
            r = client.table("users").select("*").eq("employee_id", identifier).limit(1).execute()
            if r.data:
                return r.data[0]
    except Exception:
        pass
    # Default: treat as email
    return user_store.get_user_by_email_sync(identifier)


def _check_college_login_policy(user: dict):
    college_id = user.get("college_id")
    if not college_id:
        return
    try:
        client = supabase_db.get_client()
        college_resp = client.table("institutions").select("*").eq("id", college_id).limit(1).execute()
        college = college_resp.data[0] if college_resp.data else None
    except Exception:
        college = None
    if not college:
        return
    if college.get("is_active") is False:
        raise HTTPException(status_code=403, detail="College is inactive")
    policy = college.get("login_policy") or "email_only"
    if policy == "sso":
        raise HTTPException(status_code=403, detail="College requires SSO login")
    if policy == "oauth_allowed" and not user.get("password_hash"):
        raise HTTPException(status_code=403, detail="Use OAuth to login")


def _require_active_user(user: dict):
    if user.get("is_active") is False:
        raise HTTPException(status_code=403, detail="Account is inactive")


# ── Brute-force helpers (non-blocking — swallow all DB errors) ─────────────────
def _check_brute_force(identifier: str, ip_address: str) -> Optional[int]:
    """Returns None if OK, or seconds remaining until the lock expires."""
    try:
        client = supabase_db.get_client()
        r = (client.table("login_attempts")
             .select("locked_until")
             .eq("identifier", identifier)
             .eq("ip_address", ip_address)
             .limit(1)
             .execute())
        if r.data:
            locked_until = r.data[0].get("locked_until")
            if locked_until:
                lu = locked_until.replace("Z", "+00:00")
                try:
                    lu_dt = datetime.fromisoformat(lu)
                except ValueError:
                    return None
                if lu_dt.tzinfo is None:
                    lu_dt = lu_dt.replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                if lu_dt > now:
                    return max(1, int((lu_dt - now).total_seconds()))
    except Exception:
        pass
    return None


def _record_failed_attempt(identifier: str, ip_address: str):
    try:
        client = supabase_db.get_client()
        r = (client.table("login_attempts")
             .select("id,attempts")
             .eq("identifier", identifier)
             .eq("ip_address", ip_address)
             .limit(1)
             .execute())
        now = datetime.now(timezone.utc).isoformat()
        if r.data:
            row = r.data[0]
            attempts = (row.get("attempts") or 0) + 1
            upd: dict = {"attempts": attempts, "last_attempt": now}
            if attempts >= _LOCK_THRESHOLD:
                lock_until = (datetime.now(timezone.utc)
                              + timedelta(minutes=_LOCK_MINUTES)).isoformat()
                upd["locked_until"] = lock_until
            client.table("login_attempts").update(upd).eq("id", row["id"]).execute()
        else:
            client.table("login_attempts").insert({
                "identifier": identifier,
                "ip_address": ip_address,
                "attempts": 1,
                "last_attempt": now,
            }).execute()
    except Exception:
        pass


def _clear_login_attempts(identifier: str, ip_address: str):
    try:
        (supabase_db.get_client()
         .table("login_attempts")
         .delete()
         .eq("identifier", identifier)
         .eq("ip_address", ip_address)
         .execute())
    except Exception:
        pass


def _log_login_history(
    user_id: Optional[str],
    identifier: str,
    identifier_type: str,
    success: bool,
    failure_reason: Optional[str],
    ip_address: str,
    user_agent: str,
    role: Optional[str],
    college_id: Optional[str],
):
    try:
        (supabase_db.get_client()
         .table("login_history")
         .insert({
             "user_id":         user_id,
             "college_id":      college_id,
             "identifier_used": identifier,
             "identifier_type": identifier_type,
             "role_at_login":   role,
             "ip_address":      ip_address,
             "user_agent":      (user_agent or "")[:500],
             "success":         success,
             "failure_reason":  failure_reason,
         })
         .execute())
    except Exception:
        pass  # login history is non-critical


# ── Token helpers ──────────────────────────────────────────────────────────────
def _decode_invite_token(token: str) -> dict:
    try:
        from jose import jwt
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "invite":
            raise HTTPException(status_code=400, detail="Invalid invite token")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid invite token")


def _decode_reset_token(token: str) -> dict:
    try:
        from jose import jwt
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reset token")


# ── Routes ─────────────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, user_store: UserStore = Depends(get_user_store)):
    try:
        if user.role.lower() in {"admin", "hod"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Direct registration as admin or HOD is prohibited",
            )
        if user.role.lower() not in {"student", "teacher"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be student or teacher.",
            )
        phone_val = user.phone or f"+1555{uuid.uuid4().int % 1000000:06d}"
        new_user = await user_store.create_user(
            email=user.email, password=user.password,
            full_name=user.full_name, role=user.role, phone=phone_val,
        )
        audit_logger.log(
            action="user_registered",
            user_id=str(new_user["id"]),
            metadata={"email": user.email, "role": user.role},
        )
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_store: UserStore = Depends(get_user_store),
):
    user = user_store.get_user_by_email_sync(form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    _require_active_user(user)
    _check_college_login_policy(user)
    if not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["email"],
        expires_delta=access_token_expires,
        extra_claims=_build_claims(user),
        secret_key=settings.JWT_SECRET,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/accept-invite")
async def accept_invite(
    payload: AcceptInvite, user_store: UserStore = Depends(get_user_store)
):
    invite_payload = _decode_invite_token(payload.token)
    user_id = invite_payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    user = await user_store.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    hashed_password = get_password_hash(payload.password)
    updates = {"password_hash": hashed_password, "is_active": True, "onboarding_step": 0}
    if invite_payload.get("collegeId"):
        updates["college_id"] = invite_payload.get("collegeId")
    if invite_payload.get("deptId"):
        updates["dept_id"] = invite_payload.get("deptId")
    if invite_payload.get("role"):
        updates["role"] = invite_payload.get("role")
    await user_store.update_user_fields(user_id, updates)
    return {"success": True, "message": "Account activated successfully"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"success": True}


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest, user_store: UserStore = Depends(get_user_store)
):
    user = await user_store.get_user_by_email(payload.email)
    if not user:
        return {"success": True}
    reset_token = create_access_token(
        subject=payload.email,
        expires_delta=timedelta(hours=1),
        extra_claims={"type": "reset", "userId": user.get("id")},
    )
    print(f"[EMAIL STUB] Reset link: /reset-password?token={reset_token}")
    return {"success": True}


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest, user_store: UserStore = Depends(get_user_store)
):
    reset_payload = _decode_reset_token(payload.token)
    user_id = reset_payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    hashed_password = get_password_hash(payload.newPassword)
    await user_store.update_user_fields(
        user_id, {"password_hash": hashed_password, "must_change_password": False}
    )
    return {"success": True}


@router.post("/login", response_model=LoginResponse)
def login_json(
    payload: LoginRequest,
    request: Request,
    response: Response,
    user_store: UserStore = Depends(get_user_store),
):
    raw_identifier = (payload.identifier or payload.email or "").strip()
    if not raw_identifier:
        raise HTTPException(status_code=400, detail="Identifier or email is required")

    ip_address = (request.client.host if request.client else "0.0.0.0")
    user_agent = request.headers.get("user-agent", "")

    # ── Brute-force lock check ────────────────────────────────────────────────
    remaining = _check_brute_force(raw_identifier, ip_address)
    if remaining is not None:
        raise HTTPException(
            status_code=423,
            detail=f"Too many failed attempts. Try again in {remaining} seconds.",
        )

    # ── Resolve identifier → user ─────────────────────────────────────────────
    identifier_type = _get_identifier_type(raw_identifier)
    user = _resolve_identifier(raw_identifier, user_store)

    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        _record_failed_attempt(raw_identifier, ip_address)
        _log_login_history(
            user_id=user.get("id") if user else None,
            identifier=raw_identifier,
            identifier_type=identifier_type,
            success=False,
            failure_reason="invalid_credentials",
            ip_address=ip_address,
            user_agent=user_agent,
            role=user.get("role") if user else None,
            college_id=user.get("college_id") if user else None,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    _require_active_user(user)
    _check_college_login_policy(user)

    # ── Clear failed attempts on successful auth ──────────────────────────────
    _clear_login_attempts(raw_identifier, ip_address)

    # ── Force-password-change flow ────────────────────────────────────────────
    if _normalize_role(user.get("role")) == "student" and user.get("must_change_password"):
        temp_token = create_access_token(
            subject=user["email"],
            expires_delta=timedelta(minutes=30),
            extra_claims={"type": "temp_password", "userId": user.get("id")},
        )
        _log_login_history(
            user_id=user.get("id"), identifier=raw_identifier,
            identifier_type=identifier_type, success=True, failure_reason=None,
            ip_address=ip_address, user_agent=user_agent,
            role=user.get("role"), college_id=user.get("college_id"),
        )
        return {"forcePasswordChange": True, "tempToken": temp_token}

    # ── Normal login ──────────────────────────────────────────────────────────
    access_token_expires  = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["email"],
        expires_delta=access_token_expires,
        extra_claims=_build_claims(user),
        secret_key=settings.JWT_SECRET,
    )

    refresh_token_expires = timedelta(days=7)
    refresh_token = create_access_token(
        subject=user["email"],
        expires_delta=refresh_token_expires,
        extra_claims={"type": "refresh", **_build_claims(user)},
        secret_key=settings.JWT_REFRESH_SECRET,
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite="strict",
        max_age=int(access_token_expires.total_seconds()),
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite="strict",
        max_age=int(refresh_token_expires.total_seconds()),
        path="/",
    )

    user_store.update_user_fields_sync(
        user["id"], {"last_login_at": datetime.now(timezone.utc).isoformat()}
    )

    _log_login_history(
        user_id=user.get("id"), identifier=raw_identifier,
        identifier_type=identifier_type, success=True, failure_reason=None,
        ip_address=ip_address, user_agent=user_agent,
        role=user.get("role"), college_id=user.get("college_id"),
    )

    return {
        "accessToken": access_token,
        "user": {
            "id":               user.get("id"),
            "role":             _normalize_role(user.get("role")),
            "fullName":         user.get("full_name") or user.get("name"),
            "email":            user.get("email"),
            "collegeId":        user.get("college_id"),
            "deptId":           user.get("dept_id") or user.get("department_id"),
            "batchId":          user.get("batch_id"),
            "onboardingStep":   user.get("onboarding_step", 0),
            "profilePhotoUrl":  user.get("profile_photo_url") or user.get("avatar"),
            "mustChangePassword": user.get("must_change_password", False),
        },
    }


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    user_store: UserStore = Depends(get_user_store),
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing from cookies")
    
    try:
        from jose import jwt
        payload = jwt.decode(refresh_token, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type for refresh")
            
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing subject")
            
    except Exception as e:
        logger.warning(f"refresh_token_decode_failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = await user_store.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="User associated with token not found")

    _require_active_user(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["email"],
        expires_delta=access_token_expires,
        extra_claims=_build_claims(user),
        secret_key=settings.JWT_SECRET,
    )
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite="strict",
        max_age=int(access_token_expires.total_seconds()),
        path="/",
    )
    
    return {
        "accessToken": access_token,
        "tokenType": "bearer",
        "expiresIn": int(access_token_expires.total_seconds())
    }


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    user_store: UserStore = Depends(get_user_store),
):
    # Support both Authorization Header (Bearer) and HTTP-only Cookie
    auth_token = token or request.cookies.get("access_token")
    
    if not auth_token:
        # Check if it's an invited user with a temp token in the header
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
        from jose import jwt
        # Core logic: Try decoding with JWT_SECRET first (primary app secret)
        try:
            payload = jwt.decode(auth_token, settings.JWT_SECRET, algorithms=["HS256"])
        except Exception:
            # Fallback to legacy SECRET_KEY if JWT_SECRET fails (for migration/compatibility)
            payload = jwt.decode(auth_token, settings.SECRET_KEY, algorithms=["HS256"])
            
        user_id = payload.get("userId")
        email = payload.get("sub") or payload.get("email")
        
        if not user_id and not email:
            raise HTTPException(status_code=401, detail="Invalid token: no user identifier")
            
    except Exception as e:
        logger.warning(f"token_validation_failed: {str(e)} path={request.url.path}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = None
    if user_id:
        user = await user_store.get_user_by_id(user_id)
    if not user and email:
        user = await user_store.get_user_by_email(email)
        
    if user is None:
        raise HTTPException(status_code=401, detail="User session not found")

    _require_active_user(user)

    request.state.user = user
    return user


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    newPassword: Optional[str] = None
    confirmPassword: Optional[str] = None


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    user_store: UserStore = Depends(get_user_store),
):
    new_password = payload.newPassword or payload.new_password
    if payload.confirmPassword and new_password != payload.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if not new_password or len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    auth_header = request.headers.get("authorization") or ""
    token = auth_header.split(" ")[1] if " " in auth_header else None
    user_id = None
    if token:
        try:
            from jose import jwt
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            if decoded.get("type") == "temp_password":
                user_id = decoded.get("userId")
        except Exception:
            user_id = None

    if user_id:
        hashed_password = get_password_hash(new_password)
        await user_store.update_user_fields(
            user_id, {"password_hash": hashed_password, "must_change_password": False}
        )
        return {"success": True, "message": "Password updated successfully"}

    current_user = await get_current_user(request, token=token, user_store=user_store)
    if not current_user.get("must_change_password"):
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="Current password is required")
        if not verify_password(payload.current_password, current_user["password_hash"]):
            raise HTTPException(status_code=400, detail="Incorrect current password")

    hashed_password = get_password_hash(new_password)
    await user_store.update_user_fields(
        current_user["id"],
        {"password_hash": hashed_password, "must_change_password": False},
    )
    
    audit_logger.log(
        action="password_changed",
        user_id=str(current_user["id"]),
        metadata={"email": current_user.get("email")}
    )
    
    return {"success": True, "message": "Password updated successfully"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
