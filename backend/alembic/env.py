from __future__ import annotations

from logging.config import fileConfig
import logging
import os
import sys
from pathlib import Path
from sqlalchemy import engine_from_config, pool
from alembic import context

# Ensure project root is on sys.path so `import app` works during alembic runs
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from app.services.db import Base  # type: ignore  # noqa: E402
from app.models import *  # type: ignore  # noqa: F401,F403,E402 - import models for metadata
from app.config import get_settings  # type: ignore  # noqa: E402


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

logger = logging.getLogger("gc")


target_metadata = Base.metadata


def _derive_psycopg_url(async_or_plain_url: str) -> str:
    # Convert postgresql+asyncpg://... -> postgresql+psycopg://...
    if async_or_plain_url.startswith("postgresql+asyncpg://"):
        return async_or_plain_url.replace(
            "postgresql+asyncpg://", "postgresql+psycopg://", 1
        )
    # Convert legacy postgresql://... -> postgresql+psycopg://...
    if async_or_plain_url.startswith("postgresql://"):
        return async_or_plain_url.replace(
            "postgresql://", "postgresql+psycopg://", 1
        )
    # If already psycopg or non-postgres, return as-is
    return async_or_plain_url


def _resolve_sync_url() -> str | None:
    # Highest precedence: explicit env var DATABASE_URL_SYNC
    env_sync = os.getenv("DATABASE_URL_SYNC")
    if env_sync:
        return env_sync

    settings = get_settings()
    # Next: settings.database_url_sync
    if getattr(settings, "database_url_sync", None):
        return settings.database_url_sync  # type: ignore[attr-defined]

    # Fallbacks: derive from async URL if provided
    env_async = os.getenv("DATABASE_URL")
    if env_async:
        derived = _derive_psycopg_url(env_async)
        if derived != env_async:
            logger.warning("[alembic] DATABASE_URL_SYNC not set. Using derived sync URL from DATABASE_URL.")
        return derived

    if getattr(settings, "database_url", None):
        derived = _derive_psycopg_url(settings.database_url)  # type: ignore[attr-defined]
        logger.warning("[alembic] DATABASE_URL_SYNC not set. Using derived sync URL from settings.database_url.")
        return derived

    if getattr(settings, "use_sqlite_dev", False):
        return "sqlite:///./dev.db"
    return None


def run_migrations_offline() -> None:
    url = _resolve_sync_url()
    if not url:
        raise RuntimeError("No database URL resolved for Alembic (offline mode). Set DATABASE_URL/DATABASE_URL_SYNC or USE_SQLITE_DEV=true.")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    sync_url = _resolve_sync_url()
    if not sync_url:
        raise RuntimeError("No database URL resolved for Alembic (online mode). Set DATABASE_URL/DATABASE_URL_SYNC or USE_SQLITE_DEV=true.")
    configuration["sqlalchemy.url"] = sync_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()


