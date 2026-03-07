# GreenCredits Backend

FastAPI backend for the GreenCredits subscription-based bottle collection platform.

For full setup instructions, environment variable reference, and deployment guide see the **[root README](../README.md)**.

## Quick start

```bash
# SQLite dev mode (no Docker required)
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload

# Full Postgres stack
docker compose up   # from repo root
```

## Migrations

```bash
cd backend

# Apply all pending migrations
DATABASE_URL_SYNC=postgresql+psycopg://gc:gc@localhost:5432/greencredits alembic upgrade head

# Create a new migration after model changes
DATABASE_URL_SYNC=postgresql+psycopg://gc:gc@localhost:5432/greencredits alembic revision --autogenerate -m "description"
```

## Tests

```bash
# Run from repo root — uses isolated SQLite per test, no Docker needed
PYTHONPATH=backend pytest backend/tests/
```

## Stack

- **Framework:** FastAPI (Python 3.12), async SQLAlchemy 2.0, Alembic
- **Auth:** JWT Bearer tokens (`dependencies/auth.py`)
- **Payments:** Stripe (test mode)
- **Email:** Resend SDK
- **Event bus:** In-process async event bus (`app/core/events.py`)
- **Database:** PostgreSQL (Railway) / SQLite (tests / local dev)

## API docs

The live OpenAPI spec is auto-generated at `/docs` (Swagger UI) and `/redoc`.
Production: https://greencreditsdrs-production.up.railway.app/docs
