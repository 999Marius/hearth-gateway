"""Device schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAC_ADDRESS_PATTERN = r"^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$"


class DeviceCreate(BaseModel):
    """Create-device request payload."""

    mac_address: str = Field(pattern=MAC_ADDRESS_PATTERN)
    ip: str = Field(min_length=3, max_length=45)
    hostname: str | None = Field(default=None, max_length=255)
    status: str = Field(default="offline", max_length=32)
    last_seen: datetime | None = None

    @field_validator("mac_address")
    @classmethod
    def normalize_mac(cls, value: str) -> str:
        return value.strip().upper()


class DeviceUpdate(BaseModel):
    """Partial update for device payload."""

    mac_address: str | None = Field(default=None, pattern=MAC_ADDRESS_PATTERN)
    ip: str | None = Field(default=None, min_length=3, max_length=45)
    hostname: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, max_length=32)
    last_seen: datetime | None = None

    @field_validator("mac_address")
    @classmethod
    def normalize_mac(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value


class DeviceRead(BaseModel):
    """Device API response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    mac_address: str
    ip: str
    hostname: str | None
    status: str
    last_seen: datetime | None
    created_at: datetime
    updated_at: datetime
