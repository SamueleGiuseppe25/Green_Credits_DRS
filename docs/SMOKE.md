# Smoke Test Guide

## Flow A – Dev (SQLite fallback)
1. Ensure `DATABASE_URL` is unset and set `USE_SQLITE_DEV=true`.
2. Start backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
3. GET `http://localhost:8000/healthz` → `{ "status": "ok", "db": "ok", "version": "0.1.0" }`.
   - If you prefer not to init SQLite, set `USE_SQLITE_DEV=false` and you should see `db:"not_configured"` instead.
4. Start frontend mocks:
   ```bash
   cd frontend
   npm run dev
   ```
5. Visit `/wallet` and `/map` to see mocked data via MSW.

## Flow B – Future Postgres
1. Start services:
   ```bash
   docker-compose up --build -d
   ```
2. Export backend `DATABASE_URL` (example):
   ```bash
   export DATABASE_URL=postgresql+asyncpg://gc:gc@localhost:5432/greencredits
   ```
3. Run migrations and seed:
   ```bash
   cd backend
   alembic upgrade head
   python -m app.scripts.seed
   ```
4. GET `/healthz` → 200 with `db:"ok"`.

