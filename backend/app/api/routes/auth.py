"""Authentication routes."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import REFRESH_TOKEN_TYPE, create_token_pair, decode_token, verify_password
from app.models.user import User
from app.schemas.auth import TokenPair, TokenRefreshRequest
from app.schemas.user import UserRead

logger = logging.getLogger("hearth.auth")
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenPair:
    """Authenticate user and return access/refresh tokens."""
    result = await db.execute(
        select(User).where(
            or_(
                User.username == form_data.username.strip(),
                User.email == form_data.username.strip().lower(),
            )
        )
    )
    user = result.scalars().first()
    if user is None or not verify_password(form_data.password, user.hashed_password):
        logger.warning("Failed login attempt for %s", form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    access_token, refresh_token = create_token_pair(user.id, user.role)
    logger.info("User authenticated: %s", user.username)
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenPair)
async def refresh_token(
    payload: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenPair:
    """Issue a fresh token pair from a valid refresh token."""
    try:
        token_payload = decode_token(
            payload.refresh_token,
            expected_type=REFRESH_TOKEN_TYPE,
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    subject = token_payload.get("sub")
    if subject is None or not str(subject).isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
        )

    user = await db.get(User, int(subject))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer available",
        )

    access_token, refresh_token = create_token_pair(user.id, user.role)
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    """Return currently authenticated user."""
    return current_user

