# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GreenCredits is a subscription-based bottle collection platform. Users pay a monthly fee for weekly bottle pickups; collected bottles are redeemed at return points and the voucher value is credited to an in-app wallet or donated. Payments (Stripe) and voucher scanning are simulated for the MVP.

## Development Commands

### Backend (FastAPI, Python 3.12)

```bash
# Start backend with SQLite (quick dev):
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload

# Start backend with Postgres (Docker must be running):
DATABASE_URL=postgresql+asyncpg://gc:gc@localhost:5432/greencredits uvicorn app.main:app --app-dir backend --reload

# Run Alembic migrations (requires sync driver):
cd backend
DATABASE_URL_SYNC=postgresql+psycopg://gc:gc@localhost:5432/greencredits alembic upgrade head

# Create a new migration:
cd backend
DATABASE_URL_SYNC=postgresql+psycopg://gc:gc@localhost:5432/greencredits alembic revision --autogenerate -m "description"
```

### Frontend (React 18 + Vite + Tailwind v4)

```bash
cd frontend
cp .env.example .env   # first time only; set VITE_API_BASE_URL
npm install
npm run dev            # http://localhost:5173
npm run build          # tsc -b && vite build
npm run lint           # eslint
npm run format         # prettier --write
```

### Docker (full stack)

```bash
docker compose up      # Postgres :5432, backend :8000, Adminer :8081
```
The backend container auto-runs `alembic upgrade head` on startup via `backend/docker/entrypoint.sh`.

### Pre-commit hooks

Black, Ruff, isort for `backend/**/*.py`; Prettier for `frontend/**/*.{ts,tsx,js,jsx,css,json}`.

## Architecture

### Backend (`backend/app/`)

- **Framework:** FastAPI with async SQLAlchemy 2.0 and Pydantic Settings
- **Entry point:** `main.py` — `create_app()` factory mounts all routers with prefixes
- **Config:** `config.py` — single `Settings` class (pydantic-settings), loaded via `get_settings()` (LRU-cached). Reads from `.env` file and environment variables.
- **Database:** `services/db.py` — creates async engine/session. `Base` (DeclarativeBase) lives here. Falls back to SQLite when `USE_SQLITE_DEV=true`. Sets `RUNNING_ALEMBIC=1` env var to skip async engine creation during migrations.
- **Models:** `models/` — SQLAlchemy ORM: User, Subscription, Collection, CollectionSlot, ReturnPoint, Voucher, WalletTransaction
- **Schemas:** `schemas.py` — Pydantic request/response models (flat file, not split per-domain)
- **Routers:** `routers/` — one file per domain (auth, wallet, subscriptions, collections, collection_slots, claims, return_points, admin, payments, stripe_webhooks, users, simulate, healthz, dev_utils)
- **Services:** `services/` — business logic layer (wallet, subscriptions, collections, collection_slots, return_points, seed)
- **Auth:** JWT Bearer tokens via `dependencies/auth.py`. `get_current_user` decodes token and loads User from DB. `require_admin` checks `is_admin` flag. `CurrentUserDep` is the typed FastAPI dependency.
- **Alembic:** migrations in `backend/alembic/versions/`. `env.py` derives a sync URL from `DATABASE_URL` (asyncpg→psycopg) or uses `DATABASE_URL_SYNC` directly.

### Frontend (`frontend/src/`)

- **Framework:** React 18, Vite, TypeScript, Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Routing:** react-router-dom v7, configured in `routes.tsx`. Public routes use `PublicLayout`, private routes use `AppLayout` with `RouteGuard` (auth check) and `RequireAdmin` wrappers.
- **API layer:** `lib/api.ts` — `apiFetch<T>()` wrapper around fetch that auto-attaches Bearer token, handles 401→logout. `lib/auth.ts` — login/logout/getUser functions, token stored in localStorage as `gc_access_token`.
- **Data fetching:** TanStack Query (react-query v5)
- **Maps:** Leaflet + react-leaflet + OpenStreetMap
- **API mocking:** MSW (Mock Service Worker) for dev/testing
- **Env var:** `VITE_API_BASE_URL` — backend URL (defaults to `http://localhost:8000`)

### Key Conventions

- Python: standardize on **Python 3.12** (avoid 3.13 until asyncpg supports it)
- Backend returns **snake_case** JSON; frontend normalizes as needed
- Admin endpoints require JWT with `is_admin=true`
- Wallet balance is computed from the transaction ledger (no stored balance field)
- Branch naming: `feat/<desc>`, `fix/<desc>`, `chore/<desc>`


---

## Claude Code Operating Rules (Planner + Cursor Workflow)

### Role
Claude is used strictly as:
- a **codebase analyst**
- a **feature planner**
- a **Cursor Agent prompt generator**

Claude must NOT directly implement features unless explicitly asked.

### Safety & Scope Rules (Non-negotiable)

1) **Secrets & Environment Variables**
- You may read `.env*` files locally to understand configuration.
- You must NEVER output secret values (keys, URLs, tokens).
- Refer only to variable names (e.g. `STRIPE_SECRET_KEY`), never values.

2) **No Breaking Changes**
- Do not refactor unrelated code.
- Do not rename routes, models, or DB fields unless the feature explicitly requires it.
- Preserve existing API contracts and frontend behavior.

3) **Minimal Diffs**
- Prefer small, reviewable changes.
- Avoid formatting-only edits.
- Avoid dependency upgrades unless explicitly requested.

4) **Architecture Respect**
- Follow existing patterns for:
  - FastAPI routers, dependencies, services
  - SQLAlchemy models and Alembic migrations
  - React routing, auth guards, and API helpers
- Do not introduce new architectural layers without discussion.

### Feature Request Workflow (Default)

When asked to implement a feature:

#### Step 1 — Plan Only (No Code)
Provide:
- feature breakdown
- affected backend + frontend components
- DB changes (if any)
- edge cases and risks

#### Step 2 — Generate a Cursor Agent Prompt
Output a **copy-paste-ready prompt** for Cursor that includes:

- **Context**
- **Scope / boundaries** (what to do + what NOT to do)
- **Exact file paths to edit**
- **Step-by-step implementation plan**
- **Acceptance criteria (checkbox style)**
- **Commands to run**
- **Manual test steps**

Use this format:

---
### Context

### Scope / Boundaries
- Must do:
- Must NOT do:

### Files to inspect first
- …

### Implementation steps
1.
2.
3.

### Acceptance criteria
- [ ] …
- [ ] …

### Commands to run
Backend:
Frontend:

### Notes / Risks
---

### Output Rules
- Do not paste full files.
- Do not output large code blocks unless explicitly asked.
- Prefer structured, concise responses.
