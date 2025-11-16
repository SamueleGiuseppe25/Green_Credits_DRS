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

# Tell app code we are running under Alembic (avoid creating async engine)
os.environ.setdefault("RUNNING_ALEMBIC", "1")

from app.services.db import Base  # type: ignore  # noqa: E402
from app.models import *  # type: ignore  # noqa: F401,F403,E402 - import models for metadata

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

logger = logging.getLogger("gc")

target_metadata = Base.metadata

def _derive_psycopg_url(url: str) -> str:
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url

def _resolve_sync_url() -> str | None:
    # 1) Explicit sync URL wins
    env_sync = os.getenv("DATABASE_URL_SYNC")
    if env_sync:
        return env_sync

    # 2) Derive from async/plain URL if present
    env_async = os.getenv("DATABASE_URL")
    if env_async:
        derived = _derive_psycopg_url(env_async)
        if derived != env_async:
            logger.warning("[alembic] DATABASE_URL_SYNC not set. Using derived sync URL from DATABASE_URL.")
        return derived

    # 3) Optional dev sqlite fallback via env flag (no Settings import!)
    use_sqlite_dev = os.getenv("USE_SQLITE_DEV", "").lower() in {"1", "true", "yes"}
    if use_sqlite_dev:
        return "sqlite:///./dev.db"

    return None

def run_migrations_offline() -> None:
    url = _resolve_sync_url()
    if not url:
        raise RuntimeError("No database URL resolved for Alembic (offline). Set DATABASE_URL/DATABASE_URL_SYNC or USE_SQLITE_DEV=true.")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section) or {}
    sync_url = _resolve_sync_url()
    if not sync_url:
        raise RuntimeError("No database URL resolved for Alembic (online). Set DATABASE_URL/DATABASE_URL_SYNC or USE_SQLITE_DEV=true.")
    configuration["sqlalchemy.url"] = sync_url

    connectable = engine_from_config(configuration, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
