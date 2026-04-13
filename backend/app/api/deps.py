"""Shared API dependencies."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """Resolve and return current authenticated user from bearer token."""
    try:
        payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)
    except JWTError as exc:
        raise _credentials_exception() from exc

    subject = payload.get("sub")
    if subject is None or not str(subject).isdigit():
        raise _credentials_exception()

    user = await db.get(User, int(subject))
    if user is None:
        raise _credentials_exception()
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require current user to be an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

