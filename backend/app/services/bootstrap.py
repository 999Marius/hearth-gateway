"""Startup bootstrap routines."""

import logging

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import get_password_hash
from app.models.user import User

logger = logging.getLogger("hearth.bootstrap")


async def ensure_admin_user(db: AsyncSession, settings: Settings) -> None:
    """Create default admin user when it does not exist yet."""
    admin_email = settings.ADMIN_EMAIL.strip().lower()

    result = await db.execute(
        select(User).where(
            or_(User.username == settings.ADMIN_USERNAME, User.email == admin_email)
        )
    )
    existing_admin = result.scalars().first()
    if existing_admin:
        return

    admin = User(
        username=settings.ADMIN_USERNAME.strip(),
        email=admin_email,
        hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    await db.flush()
    logger.info("Seeded default admin user '%s'", admin.username)
