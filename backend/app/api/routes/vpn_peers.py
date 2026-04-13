"""VPN peer CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.vpn_peer import VPNPeer
from app.schemas.vpn_peer import VPNPeerCreate, VPNPeerRead, VPNPeerUpdate

router = APIRouter(prefix="/vpn-peers", tags=["vpn-peers"])


async def _peer_by_name(db: AsyncSession, name: str) -> VPNPeer | None:
    result = await db.execute(select(VPNPeer).where(VPNPeer.name == name))
    return result.scalars().first()


async def _peer_by_public_key(db: AsyncSession, public_key: str) -> VPNPeer | None:
    result = await db.execute(select(VPNPeer).where(VPNPeer.public_key == public_key))
    return result.scalars().first()


@router.get("", response_model=list[VPNPeerRead])
async def list_vpn_peers(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list[VPNPeer]:
    """List VPN peers."""
    result = await db.execute(select(VPNPeer).offset(skip).limit(limit).order_by(VPNPeer.id))
    return list(result.scalars().all())


@router.post(
    "",
    response_model=VPNPeerRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_vpn_peer(
    payload: VPNPeerCreate,
    db: AsyncSession = Depends(get_db),
) -> VPNPeer:
    """Create VPN peer (admin only)."""
    existing = await db.execute(
        select(VPNPeer).where(
            or_(
                VPNPeer.name == payload.name.strip(),
                VPNPeer.public_key == payload.public_key.strip(),
            )
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Peer name or public key already exists",
        )

    peer = VPNPeer(
        name=payload.name.strip(),
        public_key=payload.public_key.strip(),
        allowed_ips=payload.allowed_ips.strip(),
        is_active=payload.is_active,
        last_handshake=payload.last_handshake,
    )
    db.add(peer)
    await db.flush()
    await db.refresh(peer)
    return peer


@router.get("/{peer_id}", response_model=VPNPeerRead)
async def get_vpn_peer(
    peer_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_user),
) -> VPNPeer:
    """Get VPN peer by ID."""
    peer = await db.get(VPNPeer, peer_id)
    if peer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VPN peer not found")
    return peer


@router.patch(
    "/{peer_id}",
    response_model=VPNPeerRead,
    dependencies=[Depends(require_admin)],
)
async def update_vpn_peer(
    peer_id: int,
    payload: VPNPeerUpdate,
    db: AsyncSession = Depends(get_db),
) -> VPNPeer:
    """Update VPN peer (admin only)."""
    peer = await db.get(VPNPeer, peer_id)
    if peer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VPN peer not found")

    data = payload.model_dump(exclude_unset=True)

    if "name" in data and data["name"] is not None and data["name"] != peer.name:
        existing = await _peer_by_name(db, data["name"].strip())
        if existing and existing.id != peer.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Peer name already exists",
            )
        data["name"] = data["name"].strip()

    if "public_key" in data and data["public_key"] is not None:
        if data["public_key"] != peer.public_key:
            existing = await _peer_by_public_key(db, data["public_key"].strip())
            if existing and existing.id != peer.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Public key already exists",
                )
        data["public_key"] = data["public_key"].strip()

    if "allowed_ips" in data and data["allowed_ips"] is not None:
        data["allowed_ips"] = data["allowed_ips"].strip()

    for field, value in data.items():
        setattr(peer, field, value)

    await db.flush()
    await db.refresh(peer)
    return peer


@router.delete(
    "/{peer_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)],
)
async def delete_vpn_peer(
    peer_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Delete VPN peer (admin only)."""
    peer = await db.get(VPNPeer, peer_id)
    if peer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VPN peer not found")

    await db.delete(peer)
    return {"message": "VPN peer deleted"}

