# GreenCredits Backend

FastAPI backend for the GreenCredits subscription-based bottle collection platform.

## Scope (MVP)
- Subscription management (activate/cancel) – payment simulated
- Weekly collection slot preference (per user)
- Collections (bookings) lifecycle: scheduled → collected → processed
- Return points directory
- Vouchers recorded by admin, crediting user wallet (or donation)
- Wallet balance and history
- Auth with JWT, RBAC for admin routes

Out of scope for MVP: external payments (Stripe, etc.), voucher scanning/OCR – both simulated.

## API Overview
See `backend/openapi.yaml`. Key endpoints:
- Auth: `/auth/register`, `/auth/login`
- Subscriptions: `/subscriptions/me`, `/subscriptions/activate`, `/subscriptions/cancel`
- Collection slots: `/collection-slots/me` (GET/PUT)
- Collections: `/collections` (POST), `/collections/me`, `/collections/{id}`, `/collections/{id}/cancel`, `/collections/{id}/status` (admin)
- Vouchers: `/vouchers` (POST admin)
- Wallet: `/wallet/balance`, `/wallet/history`
- Return points: `/return-points`, `/return-points/{id}`
- Health: `/healthz`

## Data Model (summary)
PostgreSQL tables: `users`, `subscriptions`, `collection_slots`, `collections`, `vouchers`, `wallet_transactions`, `return_points`.

## Local Dev
Run with SQLite (dev) or Postgres:
```bash
export USE_SQLITE_DEV=true
uvicorn app.main:app --app-dir backend --reload
```
or
```bash
export DATABASE_URL=postgresql+asyncpg://gc:gc@localhost:5432/greencredits
uvicorn app.main:app --app-dir backend --reload
```

Health check: `GET /health` → `{status:"ok"}` and `GET /healthz` (DB-aware).


## Database Migrations

Autogenerate and apply migrations using Alembic.

Setup env:
```bash
cd backend
export USE_SQLITE_DEV=true  # or set DATABASE_URL
```

Create migration (if schema changed):
```bash
alembic revision --autogenerate -m "schema update"
```

Upgrade to latest:
```bash
alembic upgrade head
```

Seed demo data (idempotent):
```bash
python -m app.scripts.seed
```



## Deploy to Railway (Docker)

Set these Railway Variables:

- `DATABASE_URL` (async): use your Railway Postgres URL with `+asyncpg`, e.g. `postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DB`
- `DATABASE_URL_SYNC` (sync): same URL with `+psycopg`, e.g. `postgresql+psycopg://USER:PASSWORD@HOST:PORT/DB`
- `SECRET_KEY`: any strong random string
- `SEED_ON_START`: `true` for first deploy, then set to `false`
- `PORT`: Railway injects this automatically; defaults to 8000 locally

Notes:
- In production, Postgres is required. SQLite is only used when `USE_SQLITE_DEV=true` for local dev.
- The entrypoint waits for DB readiness (tries `alembic current` up to 15 times with 2s delay), then runs `alembic upgrade head`.
- Optional seed runs idempotently when `SEED_ON_START=true`.
- Health endpoints: `/health` is stateless (no DB), `/healthz` is DB-aware.
- CORS: dev origins `http://localhost:5173` and `http://localhost:3000` are allowed. Add your production frontend domain in `app/main.py`.

### Local run with Docker

Build image:
```bash
docker build -t my-backend:local ./backend
```

Run with Postgres env vars:
```bash
docker run --rm -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DB \
  -e DATABASE_URL_SYNC=postgresql+psycopg://USER:PASSWORD@HOST:5432/DB \
  -e SECRET_KEY=dev-secret \
  -e SEED_ON_START=true \
  --name gc-api my-backend:local
```

Verify:
- Container logs show Alembic upgrade on start
- If `SEED_ON_START=true`, logs show seed execution
- `GET http://localhost:8000/health` returns 200
- `GET http://localhost:8000/docs` shows FastAPI docs

Notes about seeds:
- Seed script uses `ON CONFLICT DO NOTHING` on Postgres and `OR IGNORE` on SQLite to remain idempotent. Running it multiple times is safe.


