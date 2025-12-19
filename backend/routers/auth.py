from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
from pydantic import BaseModel
from datetime import timedelta
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from store.user_store import UserStore

router = APIRouter()
user_store = UserStore()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "student"

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    try:
        # Check if user exists
        if user_store.get_user_by_email(user.email):
            raise HTTPException(status_code=400, detail="Email already registered")
            
        new_user = user_store.create_user(
            email=user.email,
            password=user.password,
            full_name=user.full_name,
            role=user.role
        )
        return new_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = user_store.get_user_by_email(form_data.username) # username field is email in our case
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["email"], expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
        
    user = user_store.get_user_by_email(email)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
