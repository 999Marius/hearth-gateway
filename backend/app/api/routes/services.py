"""Service control routes for WireGuard and Pi-hole."""

from fastapi import APIRouter, Depends

from app.api.deps import require_admin
from app.core.config import get_settings
from app.schemas.services import (
    PiholeStatsResponse,
    ServiceStatusResponse,
    WireguardPeerResponse,
    WireguardSummaryResponse,
)
from app.services.pihole import PiholeService
from app.services.wireguard import WireguardService

router = APIRouter(prefix="/services", tags=["services"])


def _to_status_response(status) -> ServiceStatusResponse:
    return ServiceStatusResponse(
        name=status.name,
        active=status.active,
        enabled=status.enabled,
        active_state=status.active_state,
    )


@router.get("/wireguard/status", response_model=ServiceStatusResponse)
async def wireguard_status(_: object = Depends(require_admin)) -> ServiceStatusResponse:
    service = WireguardService(get_settings())
    return _to_status_response(service.status())


@router.post("/wireguard/start", response_model=ServiceStatusResponse)
async def wireguard_start(_: object = Depends(require_admin)) -> ServiceStatusResponse:
    service = WireguardService(get_settings())
    return _to_status_response(service.start())


@router.post("/wireguard/stop", response_model=ServiceStatusResponse)
async def wireguard_stop(_: object = Depends(require_admin)) -> ServiceStatusResponse:
    service = WireguardService(get_settings())
    return _to_status_response(service.stop())


@router.post("/wireguard/restart", response_model=ServiceStatusResponse)
async def wireguard_restart(_: object = Depends(require_admin)) -> ServiceStatusResponse:
    service = WireguardService(get_settings())
    return _to_status_response(service.restart())


@router.get("/wireguard/summary", response_model=WireguardSummaryResponse)
async def wireguard_summary(
    _: object = Depends(require_admin),
) -> WireguardSummaryResponse:
    service = WireguardService(get_settings())
    summary = service.config_summary()
    return WireguardSummaryResponse(**summary.__dict__)


@router.get("/wireguard/peers", response_model=list[WireguardPeerResponse])
async def wireguard_peers(
    _: object = Depends(require_admin),
) -> list[WireguardPeerResponse]:
    service = WireguardService(get_settings())
    peers = service.peers()
    return [WireguardPeerResponse(**peer.__dict__) for peer in peers]


@router.get("/pihole/status", response_model=ServiceStatusResponse)
async def pihole_status(_: object = Depends(require_admin)) -> ServiceStatusResponse:
    service = PiholeService(get_settings())
    return _to_status_response(service.status())


@router.post("/pihole/start", response_model=ServiceStatusResponse)
async def pihole_start(_: object = Depends(require_admin)) -> ServiceStatusResponse:
    service = PiholeService(get_settings())
    return _to_status_response(service.start())


@router.post("/pihole/stop", response_model=ServiceStatusResponse)
async def pihole_stop(_: object = Depends(require_admin)) -> ServiceStatusResponse:
    service = PiholeService(get_settings())
    return _to_status_response(service.stop())


@router.post("/pihole/restart", response_model=ServiceStatusResponse)
async def pihole_restart(_: object = Depends(require_admin)) -> ServiceStatusResponse:
    service = PiholeService(get_settings())
    return _to_status_response(service.restart())


@router.get("/pihole/stats", response_model=PiholeStatsResponse)
async def pihole_stats(_: object = Depends(require_admin)) -> PiholeStatsResponse:
    service = PiholeService(get_settings())
    stats = service.stats()
    return PiholeStatsResponse(**stats.__dict__)
