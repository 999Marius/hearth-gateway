"""Authentication and password security helpers."""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        # Bcrypt ignores bytes beyond 72; truncate to avoid runtime errors.
        password = encoded[:72].decode("utf-8", errors="ignore")
    return pwd_context.hash(password)


def _create_token(
    *,
    subject: str,
    role: str,
    token_type: str,
    expires_delta: timedelta,
) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + expires_delta

    payload = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str, role: str) -> str:
    """Generate an access token for API authorization."""
    return _create_token(
        subject=subject,
        role=role,
        token_type=ACCESS_TOKEN_TYPE,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject: str, role: str) -> str:
    """Generate a refresh token used to renew access tokens."""
    return _create_token(
        subject=subject,
        role=role,
        token_type=REFRESH_TOKEN_TYPE,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def create_token_pair(user_id: int, role: str) -> tuple[str, str]:
    """Generate both access and refresh tokens for a user."""
    subject = str(user_id)
    access_token = create_access_token(subject=subject, role=role)
    refresh_token = create_refresh_token(subject=subject, role=role)
    return access_token, refresh_token


def decode_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    """Decode and validate a JWT."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    token_type = payload.get("type")
    if expected_type and token_type != expected_type:
        raise JWTError("Invalid token type")
    return payload
