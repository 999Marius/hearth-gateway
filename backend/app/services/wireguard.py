"""WireGuard service utilities."""

from dataclasses import dataclass
from pathlib import Path
import subprocess

from app.core.config import Settings
from app.core.exceptions import ServiceUnavailableException
from app.services.systemctl import ServiceStatus, SystemctlService


@dataclass(frozen=True)
class WireguardPeer:
    """Represents a WireGuard peer as returned by `wg show dump`."""

    public_key: str
    endpoint: str
    allowed_ips: str
    latest_handshake: int
    transfer_rx: int
    transfer_tx: int
    persistent_keepalive: int


@dataclass(frozen=True)
class WireguardSummary:
    """WireGuard config summary."""

    interface: str
    listen_port: str | None
    address: str | None
    peer_count: int


class WireguardService:
    """WireGuard systemd + config adapter."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.systemd = SystemctlService(f"wg-quick@{settings.WG_INTERFACE}")

    def status(self) -> ServiceStatus:
        return self.systemd.status()

    def start(self) -> ServiceStatus:
        return self.systemd.start()

    def stop(self) -> ServiceStatus:
        return self.systemd.stop()

    def restart(self) -> ServiceStatus:
        return self.systemd.restart()

    def config_summary(self) -> WireguardSummary:
        config_path = Path(self.settings.WG_CONFIG_PATH)
        if not config_path.exists():
            raise ServiceUnavailableException("WireGuard config not found")

        listen_port = None
        address = None
        peer_count = 0

        for line in config_path.read_text(encoding="utf-8").splitlines():
            cleaned = line.strip()
            if cleaned.lower().startswith("listenport"):
                listen_port = cleaned.split("=", 1)[-1].strip()
            if cleaned.lower().startswith("address"):
                address = cleaned.split("=", 1)[-1].strip()
            if cleaned.lower() == "[peer]":
                peer_count += 1

        return WireguardSummary(
            interface=self.settings.WG_INTERFACE,
            listen_port=listen_port,
            address=address,
            peer_count=peer_count,
        )

    def peers(self) -> list[WireguardPeer]:
        result = subprocess.run(
            ["wg", "show", self.settings.WG_INTERFACE, "dump"],
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            detail = result.stderr.strip() or result.stdout.strip() or "wg show failed"
            raise ServiceUnavailableException(detail)

        lines = [line for line in result.stdout.splitlines() if line.strip()]
        if not lines:
            return []

        peers: list[WireguardPeer] = []
        for line in lines[1:]:
            parts = line.split("\t")
            if len(parts) < 8:
                continue
            peers.append(
                WireguardPeer(
                    public_key=parts[0],
                    endpoint=parts[2],
                    allowed_ips=parts[3],
                    latest_handshake=int(parts[4]),
                    transfer_rx=int(parts[5]),
                    transfer_tx=int(parts[6]),
                    persistent_keepalive=int(parts[7]),
                )
            )
        return peers
