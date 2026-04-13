"""Alert schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_SEVERITIES = {"info", "warning", "critical"}


class AlertCreate(BaseModel):
    """Create-alert request payload."""

    type: str = Field(min_length=2, max_length=64)
    severity: str = Field(default="info")
    message: str = Field(min_length=2)
    source: str | None = Field(default=None, max_length=255)
    acknowledged: bool = False

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in VALID_SEVERITIES:
            raise ValueError("severity must be one of: info, warning, critical")
        return normalized


class AlertUpdate(BaseModel):
    """Partial alert update payload."""

    type: str | None = Field(default=None, min_length=2, max_length=64)
    severity: str | None = None
    message: str | None = Field(default=None, min_length=2)
    source: str | None = Field(default=None, max_length=255)
    acknowledged: bool | None = None

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip().lower()
        if normalized not in VALID_SEVERITIES:
            raise ValueError("severity must be one of: info, warning, critical")
        return normalized


class AlertRead(BaseModel):
    """Alert API response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    severity: str
    message: str
    source: str | None
    acknowledged: bool
    acknowledged_at: datetime | None
    created_at: datetime
