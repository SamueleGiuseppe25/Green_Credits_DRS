from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from ..config import get_settings


class Base(DeclarativeBase):
    pass


_settings = get_settings()

resolved_database_url: str | None
if _settings.database_url:
    resolved_database_url = _settings.database_url
elif _settings.use_sqlite_dev:
    resolved_database_url = "sqlite+aiosqlite:///./dev.db"
else:
    resolved_database_url = None

engine = (
    create_async_engine(resolved_database_url, echo=False, pool_pre_ping=True)
    if resolved_database_url
    else None
)
SessionLocal = (
    async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    if engine is not None
    else None
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    if SessionLocal is None:
        raise RuntimeError("Database not configured. Set DATABASE_URL or USE_SQLITE_DEV=true.")
    async with SessionLocal() as session:
        yield session


