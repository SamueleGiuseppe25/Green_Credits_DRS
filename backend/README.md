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

Health check: `GET /healthz` → `{status:"ok", db:"ok", version}`.



