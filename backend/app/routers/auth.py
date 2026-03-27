from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import timedelta, datetime
from app.core.security import create_access_token, verify_password
from app.core.config import settings
from app.store.user_store import UserStore
from app.dependencies import get_user_store

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


class LoginResponse(BaseModel):
    accessToken: str
    user: dict

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
    }


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


@router.post("/login", response_model=LoginResponse)
def login_json(
    payload: LoginRequest,
    user_store: UserStore = Depends(get_user_store),
):
    user = user_store.get_user_by_email_sync(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["email"],
        expires_delta=access_token_expires,
        extra_claims=_build_claims(user),
    )

    user_store.update_user_fields_sync(user["id"], {"last_login_at": datetime.utcnow().isoformat()})

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
        },
    }


@router.post("/refresh")
async def refresh_token(
    request: Request,
    user_store: UserStore = Depends(get_user_store),
):
    # Lightweight refresh using existing auth_token cookie if present
    raw_token = request.cookies.get("auth_token")
    if not raw_token:
        raise HTTPException(status_code=401, detail="No refresh token found")

    try:
        from jose import jwt
        payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=["HS256"])
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
    return {"token": access_token}


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


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
