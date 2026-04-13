"""Authentication schemas."""

from pydantic import BaseModel, Field


class TokenPair(BaseModel):
    """Response payload containing JWT access and refresh tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    """Refresh-token request body."""

    refresh_token: str = Field(min_length=20)
