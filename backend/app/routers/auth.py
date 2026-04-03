from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import timedelta, datetime, timezone
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.store.user_store import UserStore
from app.dependencies import get_user_store
from app.database.supabase_manager import supabase_db
from app.core.audit import audit_logger
import logging
import re
from app.core.rbac import normalize_role, SELF_SIGNUP_ROLES, INVITE_ONLY_ROLES, ALL_ROLES, VALID_ROLES
from app.core.limiter import limiter
from app.core.blacklist import blacklist_token, is_token_revoked

logger = logging.getLogger("uvicorn.error")

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

from typing import Optional, Tuple
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
    fullName: str
    email: str
    role: str
    department: Optional[str] = None
    collegeId: Optional[str] = None
    deptId: Optional[str] = None
    batchId: Optional[str] = None
    onboardingStep: Optional[int] = 0
    onboardingCompleted: Optional[bool] = False
    adaptiveOnboardingCompleted: Optional[bool] = False
    profilePhotoUrl: Optional[str] = None
    mustChangePassword: Optional[bool] = False


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
    user: Optional[UserResponse] = None
    forcePasswordChange: Optional[bool] = None
    tempToken: Optional[str] = None


# ── Helpers ────────────────────────────────────────────────────────────────────
def _is_adaptive_onboarding_completed(user: dict) -> bool:
    user_id = str(user.get("id") or "")
    if not user_id:
        return False

    try:
        client = supabase_db.get_client()
        learner_profile = (
            client.table("learner_profiles")
            .select("status")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if learner_profile.data:
            return str(learner_profile.data[0].get("status") or "").lower() in {"completed", "active"}

        profile = (
            client.table("onboarding_profiles")
            .select("status")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if profile.data:
            return str(profile.data[0].get("status") or "").lower() == "completed"

        progress = (
            client.table("user_data")
            .select("progress")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        if progress.data:
            adaptive = ((progress.data[0] or {}).get("progress") or {}).get("adaptive_onboarding") or {}
            return str(adaptive.get("status") or "").lower() == "completed"
    except Exception:
        pass

    return False


def _is_onboarding_complete(user: dict) -> Tuple[bool, bool]:
    role = normalize_role(user.get("role", "guest"))
    if role == "super_admin":
        return True, True
        
    onboarding_step = int(user.get("onboarding_step") or 0)
    adaptive_completed = role != "student" or _is_adaptive_onboarding_completed(user)
    return onboarding_step >= 5 and adaptive_completed, adaptive_completed


def _build_claims(user: dict) -> dict:
    """Standardizes JWT claims as per platform architecture."""
    onboarding_step = int(user.get("onboarding_step") or 0)
    onboarding_completed, adaptive_completed = _is_onboarding_complete(user)
    return {
        "sub": str(user.get("id")),
        "id": str(user.get("id")),
        "email": user.get("email"),
        "fullName": user.get("full_name") or user.get("name", "Unknown"),
        "role": normalize_role(user.get("role", "guest")),
        "collegeId": user.get("college_id"),
        "deptId": user.get("dept_id") or user.get("department_id"),
        "batchId": user.get("batch_id"),
        "onboardingStep": onboarding_step,
        "onboardingCompleted": onboarding_completed,
        "adaptiveOnboardingCompleted": adaptive_completed,
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
            r = client.table("users").select("*, user_roles(roles(name))").eq("roll_number", identifier).limit(1).execute()
            if r.data:
                return user_store._sanitize_user(r.data[0], include_sensitive=True)
        elif _EMP_RE.match(identifier):
            r = client.table("users").select("*, user_roles(roles(name))").eq("employee_id", identifier).limit(1).execute()
            if r.data:
                return user_store._sanitize_user(r.data[0], include_sensitive=True)
    except Exception:
        pass
    # Default: treat as email
    return user_store.get_user_by_email_sync(identifier, include_sensitive=True)


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
    role = normalize_role(user.get("role"))
    if role not in ALL_ROLES and role not in VALID_ROLES:
        raise HTTPException(status_code=403, detail="Account role is not allowed")

_LOCK_THRESHOLD = 5
_LOCK_MINUTES = 15


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
        requested_role = str(user.role).strip().lower()
        normalized_role = normalize_role(requested_role)

        if requested_role not in ALL_ROLES and normalized_role == "student" and requested_role != "student":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{user.role}'. Allowed: {', '.join(sorted(SELF_SIGNUP_ROLES))}.",
            )

        # Block invite-only roles from self-registration
        if normalized_role in INVITE_ONLY_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Registration as '{normalized_role}' requires an admin invitation.",
            )

        # Validate the role is a known self-signup role
        if normalized_role not in SELF_SIGNUP_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{user.role}'. Allowed: {', '.join(sorted(SELF_SIGNUP_ROLES))}.",
            )

        phone_val = user.phone or f"+1555{uuid.uuid4().int % 1000000:06d}"
        new_user = await user_store.create_user(
            email=user.email, password=user.password,
            full_name=user.full_name, role=normalized_role, phone=phone_val,
        )
        audit_logger.log(
            action="user_registered",
            user_id=str(new_user["id"]),
            metadata={"email": user.email, "role": normalized_role},
        )
        return UserResponse(
            id=str(new_user["id"]),
            fullName=new_user.get("full_name") or new_user.get("name", "Unknown"),
            email=new_user["email"],
            role=new_user.get("role", "student"),
            department=new_user.get("department_id") or new_user.get("dept_id"),
            collegeId=new_user.get("college_id"),
            onboardingStep=new_user.get("onboarding_step", 0),
            onboardingCompleted=False,
            adaptiveOnboardingCompleted=new_user.get("role") != "student",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/token", response_model=Token)
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_store: UserStore = Depends(get_user_store),
):
    ip_address = (request.client.host if request.client else "0.0.0.0")  # nosec B104
    
    # ── Brute-force lock check ────────────────────────────────────────────────
    remaining = _check_brute_force(form_data.username, ip_address)
    if remaining is not None:
        raise HTTPException(
            status_code=423,
            detail=f"Too many failed attempts. Try again in {remaining} seconds.",
        )

    user = user_store.get_user_by_email_sync(form_data.username, include_sensitive=True)
    if not user:
        _record_failed_attempt(form_data.username, ip_address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    _require_active_user(user)
    _check_college_login_policy(user)
    if not verify_password(form_data.password, user.get("password_hash", "")):
        _record_failed_attempt(form_data.username, ip_address)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user["id"]),
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
    user = await user_store.get_user_by_id(user_id, include_sensitive=True)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    hashed_password = get_password_hash(payload.password)
    updates = {"password_hash": hashed_password, "is_active": True, "onboarding_step": 0}
    if invite_payload.get("institution_id"):
        updates["institution_id"] = invite_payload.get("institution_id")
    if invite_payload.get("college_id"):
        updates["college_id"] = invite_payload.get("college_id")
    if invite_payload.get("department_id"):
        updates["department_id"] = invite_payload.get("department_id")
    if invite_payload.get("role"):
        updates["role"] = invite_payload.get("role")
    await user_store.update_user_fields(user_id, updates)
    return {"success": True, "message": "Account activated successfully"}


@router.post("/logout")
def logout(request: Request, response: Response):
    # Extract access and refresh tokens to blacklist them (L5 Sentinel)
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    
    from jose import jwt
    for token in [access_token, refresh_token]:
        if not token: continue
        try:
            # Decode without verification to get JTI and Exp quickly
            payload = jwt.get_unverified_claims(token)
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                remaining = int(exp - datetime.now(timezone.utc).timestamp())
                if remaining > 0:
                    blacklist_token(jti, remaining)
        except Exception:
            pass

    # SECURITY: Explicitly delete with all possible flags to ensure browser compatibility
    # Path must match the path used to set the cookie (default is /)
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=settings.SECURE_COOKIES,
        samesite="Lax" if not settings.SECURE_COOKIES else "None"
    )
    response.delete_cookie(
        key="refresh_token",
        path="/",
        secure=settings.SECURE_COOKIES,
        samesite="Lax" if not settings.SECURE_COOKIES else "None"
    )
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
    print(f"[EMAIL STUB] Reset link: /auth/reset-password?token={reset_token}")
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
@limiter.limit("5/minute")
def login_json(
    payload: LoginRequest,
    request: Request,
    response: Response,
    user_store: UserStore = Depends(get_user_store),
):
    raw_identifier = (payload.identifier or payload.email or "").strip()
    if not raw_identifier:
        raise HTTPException(status_code=400, detail="Identifier or email is required")

    ip_address = (request.client.host if request.client else "0.0.0.0")  # nosec B104
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
    if normalize_role(user.get("role")) == "student" and user.get("must_change_password"):
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
        audit_logger.log(
            action="user_login",
            user_id=str(user.get("id")),
            metadata={
                "identifier_type": identifier_type,
                "college_id": user.get("college_id"),
                "force_password_change": True,
            },
        )
        return {"forcePasswordChange": True, "tempToken": temp_token}

    # ── Normal login ──────────────────────────────────────────────────────────
    access_token_expires  = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user["id"]),
        expires_delta=access_token_expires,
        extra_claims=_build_claims(user),
        secret_key=settings.JWT_SECRET,
    )

    refresh_token_expires = timedelta(days=7)
    refresh_token = create_access_token(
        subject=str(user["id"]),
        expires_delta=refresh_token_expires,
        extra_claims={"type": "refresh", **_build_claims(user)},
        secret_key=settings.JWT_REFRESH_SECRET,
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=False,
        secure=settings.SECURE_COOKIES,
        samesite="Lax" if not settings.SECURE_COOKIES else "None",
        max_age=int(access_token_expires.total_seconds()),
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=False,
        secure=settings.SECURE_COOKIES,
        samesite="Lax" if not settings.SECURE_COOKIES else "None",
        max_age=int(refresh_token_expires.total_seconds()),
        path="/",
    )

    user_store.update_user_fields_sync(user["id"], {"last_login_at": datetime.now(timezone.utc).isoformat()})
    audit_logger.log(
        action="user_login",
        user_id=str(user.get("id")),
        metadata={
            "identifier_type": identifier_type,
            "college_id": user.get("college_id"),
            "force_password_change": False,
        },
    )

    onboarding_completed, adaptive_completed = _is_onboarding_complete(user)

    return {
        "accessToken": access_token,
        "user": UserResponse(
            id=str(user.get("id")),
            role=normalize_role(user.get("role", "student")),
            fullName=user.get("full_name") or user.get("name", "Unknown"),
            email=user.get("email"),
            collegeId=user.get("college_id"),
            deptId=user.get("dept_id") or user.get("department_id"),
            batchId=user.get("batch_id"),
            onboardingStep=user.get("onboarding_step", 0),
            onboardingCompleted=onboarding_completed,
            adaptiveOnboardingCompleted=adaptive_completed,
            profilePhotoUrl=user.get("profile_photo_url") or user.get("avatar"),
            mustChangePassword=user.get("must_change_password", False),
        ),
    }


@router.post("/refresh")
@limiter.limit("5/minute")
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
        
        jti = payload.get("jti")
        if is_token_revoked(jti):
            audit_logger.log_security_event(
                action="refresh_token_reuse_detected",
                user_id=payload.get("sub"),
                severity="high",
                metadata={"jti": jti},
                ip_address=request.client.host
            )
            # Standard Security: If a refresh token is reused, it might be a replay attack.
            raise HTTPException(status_code=401, detail="Refresh token has been revoked or used.")
            
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type for refresh")
            
        sub_val = payload.get("sub")
        if not sub_val:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing subject")
            
        # Blacklist the old refresh token as it's now 'used' (Rotation)
        exp = payload.get("exp")
        if jti and exp:
            remaining = int(exp - datetime.now(timezone.utc).timestamp())
            if remaining > 0:
                blacklist_token(jti, remaining)
                
    except Exception as e:
        logger.warning(f"refresh_token_decode_failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = None
    try:
        import uuid
        uuid.UUID(sub_val)
        user = await user_store.get_user_by_id(sub_val, include_sensitive=True)
    except (ValueError, TypeError):
        if "@" in sub_val:
            user = await user_store.get_user_by_email(sub_val, include_sensitive=True)

    if not user:
        # Check if email claim is present
        email_claim = payload.get("email")
        if email_claim:
            user = await user_store.get_user_by_email(email_claim, include_sensitive=True)
            
    if not user:
        raise HTTPException(status_code=401, detail="User associated with token not found")

    _require_active_user(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user["id"]),
        expires_delta=access_token_expires,
        extra_claims=_build_claims(user),
        secret_key=settings.JWT_SECRET,
    )
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=False,
        secure=settings.SECURE_COOKIES,
        samesite="Lax" if not settings.SECURE_COOKIES else "None",
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
        # Core logic: Try decoding with JWT_SECRET first (standard app flow)
        # Fallback to legacy SECRET_KEY if JWT_SECRET fails (for background transition)
        decoded_payload = None
        for secret in [settings.JWT_SECRET, settings.SECRET_KEY]:
            try:
                decoded_payload = jwt.decode(auth_token, secret, algorithms=["HS256"])
                if decoded_payload: break
            except Exception:
                continue

        if not decoded_payload:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Prioritize sub as user ID, then check custom userId, then email
        user_id = decoded_payload.get("userId") or decoded_payload.get("sub") or decoded_payload.get("id")
        email = decoded_payload.get("email") or decoded_payload.get("sub")
        jti = decoded_payload.get("jti")
        
        if jti and is_token_revoked(jti):
            raise HTTPException(status_code=401, detail="Token has been revoked.")
            
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
    # Try ID lookup first (preferred)
    if user_id:
        try:
            # Check if it looks like a UUID
            import uuid
            uuid.UUID(user_id)
            user = await user_store.get_user_by_id(user_id, include_sensitive=True)
        except (ValueError, TypeError):
            # If not a UUID, it might be an email stored in sub (legacy)
            if "@" in user_id:
                user = await user_store.get_user_by_email(user_id, include_sensitive=True)
    
    # Fallback to email claim if ID failed
    if not user and email:
        user = await user_store.get_user_by_email(email, include_sensitive=True)
        
    if user is None:
        raise HTTPException(status_code=401, detail="User session not found")

    _require_active_user(user)

    # ATTACH ACCESS TOKEN for ScopedSupabase
    # The auth_token variable is available from the parent closure in get_current_user
    user["access_token"] = auth_token

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
    onboarding_completed, adaptive_completed = _is_onboarding_complete(current_user)
    return UserResponse(
        id=str(current_user["id"]),
        fullName=current_user.get("full_name") or current_user.get("name", "Unknown"),
        email=current_user["email"],
        role=current_user.get("role", "student"),
        department=current_user.get("department_id") or current_user.get("dept_id"),
        collegeId=current_user.get("college_id"),
        deptId=current_user.get("dept_id") or current_user.get("department_id"),
        batchId=current_user.get("batch_id"),
        onboardingStep=current_user.get("onboarding_step", 0),
        onboardingCompleted=onboarding_completed,
        adaptiveOnboardingCompleted=adaptive_completed,
        profilePhotoUrl=current_user.get("profile_photo_url") or current_user.get("avatar"),
        mustChangePassword=current_user.get("must_change_password", False),
    )
