"""Database engine and async session management."""

from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()


def _prepare_sqlite_directory(database_url: str) -> None:
    """Create parent directory for file-based SQLite URLs."""
    if not database_url.startswith("sqlite"):
        return

    _, _, path = database_url.partition(":///")
    db_path = path.split("?", maxsplit=1)[0]
    if db_path in {"", ":memory:"}:
        return

    Path(db_path).expanduser().parent.mkdir(parents=True, exist_ok=True)


_prepare_sqlite_directory(settings.DATABASE_URL)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=not settings.DATABASE_URL.startswith("sqlite"),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Initialize database tables for all registered models."""
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose database engine on application shutdown."""
    await engine.dispose()
