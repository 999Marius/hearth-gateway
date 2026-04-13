"""Alert CRUD routes."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_admin
from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertRead, AlertUpdate

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertRead])
async def list_alerts(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    severity: str | None = Query(default=None),
    acknowledged: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_user),
) -> list[Alert]:
    """List alerts with optional filters."""
    statement = select(Alert).order_by(Alert.created_at.desc()).offset(skip).limit(limit)
    if severity:
        statement = statement.where(Alert.severity == severity.strip().lower())
    if acknowledged is not None:
        statement = statement.where(Alert.acknowledged == acknowledged)

    result = await db.execute(statement)
    return list(result.scalars().all())


@router.post(
    "",
    response_model=AlertRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_alert(
    payload: AlertCreate,
    db: AsyncSession = Depends(get_db),
) -> Alert:
    """Create alert (admin only)."""
    alert = Alert(**payload.model_dump())
    if alert.acknowledged:
        alert.acknowledged_at = datetime.now(timezone.utc)

    db.add(alert)
    await db.flush()
    await db.refresh(alert)
    return alert


@router.get("/{alert_id}", response_model=AlertRead)
async def get_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    _: object = Depends(get_current_user),
) -> Alert:
    """Get alert by ID."""
    alert = await db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.patch(
    "/{alert_id}",
    response_model=AlertRead,
    dependencies=[Depends(require_admin)],
)
async def update_alert(
    alert_id: int,
    payload: AlertUpdate,
    db: AsyncSession = Depends(get_db),
) -> Alert:
    """Update alert (admin only)."""
    alert = await db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(alert, field, value)

    if "acknowledged" in data:
        if data["acknowledged"]:
            alert.acknowledged_at = datetime.now(timezone.utc)
        else:
            alert.acknowledged_at = None

    await db.flush()
    await db.refresh(alert)
    return alert


@router.delete(
    "/{alert_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)],
)
async def delete_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Delete alert (admin only)."""
    alert = await db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    await db.delete(alert)
    return {"message": "Alert deleted"}

