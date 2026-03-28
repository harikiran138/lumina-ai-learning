from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import timedelta, datetime, timezone
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.store.user_store import UserStore
from app.dependencies import get_user_store
from app.database.supabase_manager import supabase_db

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


from typing import Optional
import uuid

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "student"
    phone: Optional[str] = None


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
    email: str
    password: str


class AcceptInvite(BaseModel):
    token: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str




class LoginResponse(BaseModel):
    accessToken: Optional[str] = None
    user: Optional[dict] = None
    forcePasswordChange: Optional[bool] = None
    tempToken: Optional[str] = None

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


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, user_store: UserStore = Depends(get_user_store)):
    try:
        # Restrict privileged role creation via public registration
        if user.role.lower() in {"admin", "hod"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Direct registration as admin or HOD is prohibited"
            )

        if user.role.lower() not in {"student", "teacher"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be student or teacher.",
            )

        phone_val = user.phone or f"+1555{uuid.uuid4().int % 1000000:06d}"

        new_user = await user_store.create_user(
            email=user.email, password=user.password, full_name=user.full_name, role=user.role, phone=phone_val
        )

        from app.core.audit import audit_logger

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
    user = user_store.get_user_by_email_sync(
        form_data.username
    )  # username field is email in our case
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
    updates = {
        "password_hash": hashed_password,
        "is_active": True,
        "onboarding_step": 0,
    }
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
    response.delete_cookie("refresh_token", path="/")
    return {"success": True}


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, user_store: UserStore = Depends(get_user_store)):
    user = await user_store.get_user_by_email(payload.email)
    if not user:
        return {"success": True}
    reset_token = create_access_token(
        subject=payload.email,
        expires_delta=timedelta(hours=1),
        extra_claims={"type": "reset", "userId": user.get("id")},
    )
    # Email stub (log in dev)
    print(f"[EMAIL STUB] Reset link: /reset-password?token={reset_token}")
    return {"success": True}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, user_store: UserStore = Depends(get_user_store)):
    reset_payload = _decode_reset_token(payload.token)
    user_id = reset_payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    hashed_password = get_password_hash(payload.newPassword)
    await user_store.update_user_fields(user_id, {"password_hash": hashed_password, "must_change_password": False})
    return {"success": True}


## Removed duplicate change-password handler (see unified handler below)


@router.post("/login", response_model=LoginResponse)
def login_json(
    payload: LoginRequest,
    response: Response,
    user_store: UserStore = Depends(get_user_store),
):
    user = user_store.get_user_by_email_sync(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    _require_active_user(user)
    _check_college_login_policy(user)

    if _normalize_role(user.get("role")) == "student" and user.get("must_change_password"):
        temp_token = create_access_token(
            subject=user["email"],
            expires_delta=timedelta(minutes=30),
            extra_claims={"type": "temp_password", "userId": user.get("id")},
        )
        return {"forcePasswordChange": True, "tempToken": temp_token}

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["email"],
        expires_delta=access_token_expires,
        extra_claims=_build_claims(user),
    )

    refresh_token_expires = timedelta(days=7)
    refresh_token = create_access_token(
        subject=user["email"],
        expires_delta=refresh_token_expires,
        extra_claims={"type": "refresh"},
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

    user_store.update_user_fields_sync(user["id"], {"last_login_at": datetime.now(timezone.utc).isoformat()})

    return {
        "accessToken": access_token,
        "user": {
            "id": user.get("id"),
            "role": _normalize_role(user.get("role")),
            "fullName": user.get("full_name") or user.get("name"),
            "email": user.get("email"),
            "collegeId": user.get("college_id"),
            "deptId": user.get("dept_id") or user.get("department_id"),
            "batchId": user.get("batch_id"),
            "onboardingStep": user.get("onboarding_step", 0),
            "profilePhotoUrl": user.get("profile_photo_url") or user.get("avatar"),
            "mustChangePassword": user.get("must_change_password", False),
        },
    }


@router.post("/refresh")
async def refresh_token(
    request: Request,
    user_store: UserStore = Depends(get_user_store),
):
    # Refresh using refresh_token cookie
    raw_token = request.cookies.get("refresh_token")
    if not raw_token:
        raise HTTPException(status_code=401, detail="No refresh token found")

    try:
        from jose import jwt
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        email = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = await user_store.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["email"],
        expires_delta=access_token_expires,
        extra_claims=_build_claims(user),
    )
    return {"accessToken": access_token}


async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    user_store: UserStore = Depends(get_user_store),
):
    try:
        from jose import jwt

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    user = await user_store.get_user_by_email(email)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    # Set user in request state for observability middleware (e.g. Sentry)
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

    # Try temp token flow first
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
            user_id,
            {"password_hash": hashed_password, "must_change_password": False},
        )
        return {"success": True, "message": "Password updated successfully"}

    # Fallback to normal authenticated change
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

    return {"success": True, "message": "Password updated successfully"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
