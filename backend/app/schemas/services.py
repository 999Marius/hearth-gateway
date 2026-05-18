"""Service control schemas."""

from pydantic import BaseModel


class ServiceStatusResponse(BaseModel):
    name: str
    active: bool
    enabled: bool
    active_state: str


class WireguardSummaryResponse(BaseModel):
    interface: str
    listen_port: str | None
    address: str | None
    peer_count: int


class WireguardPeerResponse(BaseModel):
    public_key: str
    endpoint: str
    allowed_ips: str
    latest_handshake: int
    transfer_rx: int
    transfer_tx: int
    persistent_keepalive: int


class PiholeStatsResponse(BaseModel):
    total_queries: int
    blocked_queries: int
    updated_at: int
