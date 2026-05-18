"""Systemd service control helpers."""

from dataclasses import dataclass
import subprocess

from app.core.exceptions import ServiceUnavailableException


@dataclass(frozen=True)
class ServiceStatus:
    """Systemd unit status information."""

    name: str
    active: bool
    enabled: bool
    active_state: str


class SystemctlService:
    """Wrapper around systemctl for a single unit."""

    def __init__(self, unit_name: str) -> None:
        self.unit_name = unit_name

    def _run(self, *args: str) -> subprocess.CompletedProcess[str]:
        result = subprocess.run(
            ["systemctl", *args, self.unit_name],
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            detail = result.stderr.strip() or result.stdout.strip() or "systemctl failed"
            raise ServiceUnavailableException(detail)
        return result

    def _run_show(self, key: str) -> str:
        result = subprocess.run(
            ["systemctl", "show", self.unit_name, "-p", key, "--value"],
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            detail = result.stderr.strip() or result.stdout.strip() or "systemctl show failed"
            raise ServiceUnavailableException(detail)
        return result.stdout.strip()

    def status(self) -> ServiceStatus:
        active_state = self._run_show("ActiveState")
        enabled_state = self._run_show("UnitFileState")
        return ServiceStatus(
            name=self.unit_name,
            active=active_state == "active",
            enabled=enabled_state == "enabled",
            active_state=active_state,
        )

    def start(self) -> ServiceStatus:
        self._run("start")
        return self.status()

    def stop(self) -> ServiceStatus:
        self._run("stop")
        return self.status()

    def restart(self) -> ServiceStatus:
        self._run("restart")
        return self.status()
