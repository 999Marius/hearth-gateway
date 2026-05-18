import sqlite3
import subprocess
from pathlib import Path

import pytest

from app.core.config import Settings
from app.services.pihole import PiholeService
from app.services.systemctl import SystemctlService
from app.services.wireguard import WireguardService


def _mock_run(expected_commands: list[list[str]]):
    calls = []

    def _runner(command, check, capture_output, text):  # type: ignore[no-untyped-def]
        calls.append(command)
        if command[:3] == ["systemctl", "show", "wg-quick@wg0"]:
            key = command[-2]
            value = "active" if key == "ActiveState" else "enabled"
            return subprocess.CompletedProcess(command, 0, stdout=value, stderr="")
        if command[:2] == ["systemctl", "start"]:
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")
        if command[:2] == ["systemctl", "stop"]:
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")
        if command[:2] == ["systemctl", "restart"]:
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")
        if command[:2] == ["wg", "show"]:
            output = "\n".join(
                [
                    "wg0\tserver_key\t51820",
                    "peer_key\tpsk\t1.2.3.4:51820\t10.0.0.2/32\t0\t123\t456\t25",
                ]
            )
            return subprocess.CompletedProcess(command, 0, stdout=output, stderr="")
        return subprocess.CompletedProcess(command, 0, stdout="", stderr="")

    return _runner, calls


def test_systemctl_status(monkeypatch):
    runner, calls = _mock_run([])
    monkeypatch.setattr(subprocess, "run", runner)
    service = SystemctlService("wg-quick@wg0")

    status = service.status()

    assert status.active is True
    assert status.enabled is True
    assert status.active_state == "active"
    assert calls[0][:3] == ["systemctl", "show", "wg-quick@wg0"]


def test_wireguard_summary_and_peers(tmp_path, monkeypatch):
    config_path = tmp_path / "wg0.conf"
    config_path.write_text(
        "\n".join(
            [
                "[Interface]",
                "Address = 10.0.0.1/24",
                "ListenPort = 51820",
                "",
                "[Peer]",
                "PublicKey = abc",
            ]
        ),
        encoding="utf-8",
    )

    runner, _ = _mock_run([])
    monkeypatch.setattr(subprocess, "run", runner)
    settings = Settings(WG_INTERFACE="wg0", WG_CONFIG_PATH=str(config_path))
    service = WireguardService(settings)

    summary = service.config_summary()
    peers = service.peers()

    assert summary.peer_count == 1
    assert summary.listen_port == "51820"
    assert peers[0].public_key == "peer_key"


def test_pihole_stats(tmp_path):
    db_path = Path(tmp_path) / "pihole-FTL.db"
    with sqlite3.connect(db_path) as connection:
        cursor = connection.cursor()
        cursor.execute(
            "CREATE TABLE counters (id INTEGER PRIMARY KEY, total INTEGER, blocked INTEGER, timestamp INTEGER)"
        )
        cursor.execute(
            "INSERT INTO counters (total, blocked, timestamp) VALUES (100, 5, 12345)"
        )
        connection.commit()

    settings = Settings(PIHOLE_FTL_DB=str(db_path))
    service = PiholeService(settings)
    stats = service.stats()

    assert stats.total_queries == 100
    assert stats.blocked_queries == 5
    assert stats.updated_at == 12345
