"""User schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_ROLES = {"admin", "user"}


class UserCreate(BaseModel):
    """Create-user request body."""

    username: str = Field(min_length=3, max_length=64)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="user")
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in VALID_ROLES:
            raise ValueError("role must be one of: admin, user")
        return normalized


class UserUpdate(BaseModel):
    """Partial user update payload."""

    username: str | None = Field(default=None, min_length=3, max_length=64)
    email: str | None = Field(default=None, min_length=5, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: str | None = None
    is_active: bool | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        return value.strip().lower() if value else value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in VALID_ROLES:
            raise ValueError("role must be one of: admin, user")
        return normalized


class UserRead(BaseModel):
    """Public user response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
