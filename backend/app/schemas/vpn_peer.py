"""VPN peer schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VPNPeerCreate(BaseModel):
    """Create-VPN-peer payload."""

    name: str = Field(min_length=2, max_length=128)
    public_key: str = Field(min_length=16, max_length=255)
    allowed_ips: str = Field(min_length=3, max_length=255)
    is_active: bool = True
    last_handshake: datetime | None = None


class VPNPeerUpdate(BaseModel):
    """Partial update for a VPN peer."""

    name: str | None = Field(default=None, min_length=2, max_length=128)
    public_key: str | None = Field(default=None, min_length=16, max_length=255)
    allowed_ips: str | None = Field(default=None, min_length=3, max_length=255)
    is_active: bool | None = None
    last_handshake: datetime | None = None


class VPNPeerRead(BaseModel):
    """VPN peer API response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    public_key: str
    allowed_ips: str
    is_active: bool
    last_handshake: datetime | None
    created_at: datetime
