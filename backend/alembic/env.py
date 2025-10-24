from __future__ import annotations

import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool, text
from alembic import context

# --- Ensure we can import app modules ---
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

# --- Import settings and DB base ---
from app.services.db import Base  # type: ignore
from app.config import get_settings  # type: ignore

# --- Import ALL models to register metadata ---
import app.models.user  # type: ignore
import app.models.wallet  # type: ignore
import app.models.subscriptions  # type: ignore
import app.models.transaction  # type: ignore
import app.models.return_point  # type: ignore

# --- Alembic Config ---
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    settings = get_settings()
    url = settings.database_url

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema="public",
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    settings = get_settings()
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = settings.database_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # --- Run migrations within an active connection ---
    with connectable.connect() as connection:
        # Ensure Alembic and models use the 'public' schema
        connection.execute(text("SET search_path TO public"))

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table_schema="public"
        )

        with context.begin_transaction():
            context.run_migrations()


# --- Entry point ---
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
