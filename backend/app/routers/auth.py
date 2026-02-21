from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.core.security import create_access_token, verify_password
from app.dependencies.auth import get_current_user
from app.schemas import LoginRequest, TokenResponse, UserOut, RegisterRequest
from app.services.db import get_db_session
from app.models.user import User
from app.core.security import get_password_hash

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db_session)) -> TokenResponse:
    settings = get_settings()

    # Dev-only shortcut if you still use it
    if settings.mock_auth:
        result = await db.execute(select(User).order_by(User.id.asc()).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No users available in mock mode")
        token = create_access_token(subject=user.id)
        return TokenResponse(access_token=token)

    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        address=user.address,
        is_active=True,
        is_admin=getattr(user, "is_admin", False),
        is_driver=getattr(user, "is_driver", False),
    )


@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db_session)) -> UserOut:
    # Basic validations
    email = (payload.email or "").strip().lower()
    if "@" not in email or len(payload.password or "") < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email or password too short")

    # Uniqueness
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(email=email, full_name=payload.full_name, password_hash=get_password_hash(payload.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserOut(id=user.id, email=user.email, full_name=user.full_name)
