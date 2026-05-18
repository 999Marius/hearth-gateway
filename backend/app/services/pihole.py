"""Pi-hole service utilities."""

from dataclasses import dataclass
from pathlib import Path
import sqlite3

from app.core.config import Settings
from app.core.exceptions import ServiceUnavailableException
from app.services.systemctl import ServiceStatus, SystemctlService


@dataclass(frozen=True)
class PiholeStats:
    """Pi-hole counters from FTL database."""

    total_queries: int
    blocked_queries: int
    updated_at: int


class PiholeService:
    """Pi-hole systemd + FTL DB adapter."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.systemd = SystemctlService("pihole-FTL")

    def status(self) -> ServiceStatus:
        return self.systemd.status()

    def start(self) -> ServiceStatus:
        return self.systemd.start()

    def stop(self) -> ServiceStatus:
        return self.systemd.stop()

    def restart(self) -> ServiceStatus:
        return self.systemd.restart()

    def stats(self) -> PiholeStats:
        db_path = Path(self.settings.PIHOLE_FTL_DB)
        if not db_path.exists():
            raise ServiceUnavailableException("Pi-hole FTL database not found")

        try:
            with sqlite3.connect(db_path) as connection:
                cursor = connection.cursor()
                cursor.execute(
                    "SELECT total, blocked, timestamp FROM counters ORDER BY id DESC LIMIT 1"
                )
                row = cursor.fetchone()
        except sqlite3.Error as exc:
            raise ServiceUnavailableException("Pi-hole database query failed") from exc

        if row is None:
            raise ServiceUnavailableException("Pi-hole counters missing")

        total, blocked, timestamp = row
        return PiholeStats(
            total_queries=int(total),
            blocked_queries=int(blocked),
            updated_at=int(timestamp),
        )
