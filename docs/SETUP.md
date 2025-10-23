# Developer Setup

This guide helps you get GreenCredits running locally in under 10 minutes.

## Quick Start
- Clone the repo
- Start backend (Docker Compose): Postgres + API
- Run migrations + seed
- Start frontend (Vite)

```powershell
# Windows PowerShell
git clone https://github.com/<your-org>/greencredits.git
cd greencredits

# Backend (Docker Compose)
docker compose up -d --build

# Run migrations + seed
cd backend
alembic upgrade head
python -m app.scripts.seed

# Frontend
cd ..\frontend
npm ci
npm run dev
```

```bash
# macOS/Linux
git clone https://github.com/<your-org>/greencredits.git
cd greencredits

docker compose up -d --build

cd backend
alembic upgrade head
python -m app.scripts.seed

cd ../frontend
npm ci
npm run dev
```

- API: http://localhost:8000
- Frontend: http://localhost:5173
- Health: GET http://localhost:8000/healthz
- API docs: http://localhost:8000/docs

---

## Prerequisites
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Node.js v20+
- Python 3.12 (standard across local, Docker, and CI)

## Clone the repository
```bash
git clone https://github.com/<your-org>/greencredits.git
cd greencredits
```

## Environment variables
- Backend env file: `backend/.env` (create from `.env.example`)
- Frontend env file: `frontend/.env` (create from `.env.example`)

Backend `.env.example` includes:
```env
# Use Postgres when available, otherwise leave empty and opt-in to SQLite dev.
DATABASE_URL=
# Opt-in dev-only SQLite fallback
USE_SQLITE_DEV=false
# Dev secret for JWT (placeholder)
SECRET_KEY=dev-secret
```

Frontend `.env.example` includes:
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Running the backend (Docker Compose)
1. Start services:
   ```bash
   docker compose up -d --build
   ```
2. Database URL for the backend service is set in `docker-compose.yml` as:
   `postgresql+asyncpg://gc:gc@db:5432/greencredits`.
3. Apply migrations and seed demo data:
   ```bash
   cd backend
  alembic upgrade head
  python -m app.scripts.seed
   ```
4. Verify health and docs:
   - Health: `GET http://localhost:8000/healthz` → `{ status: "ok", db: "ok" }`
   - OpenAPI docs: `http://localhost:8000/docs`

### Dev-only SQLite fallback (optional)
If Postgres isn’t available, you can opt into SQLite for quick local dev:
```powershell
# Windows PowerShell
$env:USE_SQLITE_DEV = "true"
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
uvicorn app.main:app --reload --app-dir backend
```
```bash
# macOS/Linux
export USE_SQLITE_DEV=true
unset DATABASE_URL
uvicorn app.main:app --reload --app-dir backend

---

## Local development without Docker (Python 3.12)

All local commands below assume Windows PowerShell; adapt paths for macOS/Linux accordingly.

```powershell
# From repo root
cd backend

# Create and activate a virtual environment with Python 3.12
py -3.12 -m venv .venv
./.venv/Scripts/Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Run the API (SQLite dev mode) on port 8000
$env:USE_SQLITE_DEV = "true"
python -m uvicorn app.main:app --reload --port 8000
```

### Alembic migrations
```powershell
# Docker
docker compose exec backend alembic upgrade head

# Local venv
./.venv/Scripts/Activate.ps1
alembic upgrade head
```

---

## Standardized Python Version

We standardize on Python 3.12 across local development, CI, and Docker. Avoid using Python 3.13 for now, as some dependencies (e.g., asyncpg) may not yet provide wheels.
```
- Health: `GET /healthz` → `{ status: "ok", db: "ok" }`
- To avoid SQLite, set `USE_SQLITE_DEV=false`. Then `/healthz` will return `{ db: "not_configured" }` until `DATABASE_URL` is set.

## Running the frontend (Vite + React)
```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```
```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```
- Visit `http://localhost:5173`
- MSW mocks are enabled in dev. Pages show mocked data for wallet, claims, and map.

## Default URLs
- API base: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Health: `http://localhost:8000/healthz`
- OpenAPI docs: `http://localhost:8000/docs`

## Troubleshooting
- If `/healthz` shows `db: not_configured`, either:
  - Set `USE_SQLITE_DEV=true` for quick dev mode, or
  - Provide a valid `DATABASE_URL` for Postgres and run migrations.
- If frontend cannot reach API, ensure `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8000`.

## Next steps
- Review `docs/requirements.md` and `docs/adr/ADR-000-tech-choices.md`
- API spec: `backend/openapi.yaml`
- Smoke tests: `docs/SMOKE.md`

