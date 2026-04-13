"""Device CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceRead, DeviceUpdate

router = APIRouter(prefix="/devices", tags=["devices"])


async def _device_by_mac(db: AsyncSession, mac_address: str) -> Device | None:
    result = await db.execute(select(Device).where(Device.mac_address == mac_address))
    return result.scalars().first()


@router.get("", response_model=list[DeviceRead])
async def list_devices(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list[Device]:
    """List devices."""
    result = await db.execute(select(Device).offset(skip).limit(limit).order_by(Device.id))
    return list(result.scalars().all())


@router.post(
    "",
    response_model=DeviceRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_device(
    payload: DeviceCreate,
    db: AsyncSession = Depends(get_db),
) -> Device:
    """Create device (admin only)."""
    existing = await _device_by_mac(db, payload.mac_address)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Device with this MAC address already exists",
        )

    device = Device(**payload.model_dump())
    db.add(device)
    await db.flush()
    await db.refresh(device)
    return device


@router.get("/{device_id}", response_model=DeviceRead)
async def get_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Device:
    """Get single device by ID."""
    device = await db.get(Device, device_id)
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return device


@router.patch(
    "/{device_id}",
    response_model=DeviceRead,
    dependencies=[Depends(require_admin)],
)
async def update_device(
    device_id: int,
    payload: DeviceUpdate,
    db: AsyncSession = Depends(get_db),
) -> Device:
    """Update device (admin only)."""
    device = await db.get(Device, device_id)
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    data = payload.model_dump(exclude_unset=True)
    mac_address = data.get("mac_address")
    if mac_address and mac_address != device.mac_address:
        existing = await _device_by_mac(db, mac_address)
        if existing and existing.id != device.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Device with this MAC address already exists",
            )

    for field, value in data.items():
        setattr(device, field, value)

    await db.flush()
    await db.refresh(device)
    return device


@router.delete(
    "/{device_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)],
)
async def delete_device(
    device_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Delete a device (admin only)."""
    device = await db.get(Device, device_id)
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    await db.delete(device)
    return {"message": "Device deleted"}

