# GreenCredits - Project Progress

## Project Overview
GreenCredits — subscription-based bottle collection platform. Users pay a monthly fee for weekly bottle pickups; collected bottles are redeemed at return points and the voucher value is credited to an in-app wallet or donated. Payments (Stripe) and voucher scanning are simulated for the MVP.

---

## ✅ Completed Features

### Feature A: Admin Dashboard Real Metrics
**Status:** ✅ Completed (commit 3f6c547)
**Implemented by:** Claude Code + Cursor

**What was built:**
- Backend: `/admin/metrics` endpoint returns 5 real KPIs from DB (users_total, active_subscriptions, collections_total, collections_scheduled, voucher_total_cents)
- Backend: `/admin/collections` endpoint with status filtering (limit 50, max 200)
- Backend: `/admin/collections/{id}/status` PATCH for admin status transitions
- Frontend: `AdminPage.tsx` fetches and renders live metrics + filterable collections table
- Frontend: `adminApi.ts` typed API client for admin endpoints
- Auth: Protected by `require_admin` dependency

**Files:**
- `backend/app/routers/admin.py`
- `frontend/src/views/AdminPage.tsx`
- `frontend/src/lib/adminApi.ts`
- `frontend/src/ui/RequireAdmin.tsx`

### Feature B: Subscription Period Fields + Scheduling Validation
**Status:** ✅ Completed (Feb 8, 2026)
**Implemented by:** Claude Code + Cursor

**What was built:**
- DB: Added `current_period_start` and `current_period_end` columns to subscriptions table (migration 0007)
- Backend: `is_subscription_active()` in subscriptions service — checks status + period end date
- Backend: `require_active_subscription` FastAPI dependency in `dependencies/auth.py`
- Backend: Collection creation endpoint now enforces active subscription
- Backend: Stripe webhook syncs Stripe's own period timestamps after checkout
- Backend: All subscription endpoints now return `currentPeriodStart`/`currentPeriodEnd`
- Frontend: CollectionsPage checks subscription eligibility before allowing booking
- Frontend: SettingsPage displays "Active until" date
- Frontend: Subscription type updated with period fields

**Files modified:**
- `backend/alembic/versions/0007_add_subscription_period_fields.py` (new)
- `backend/app/models/subscription.py`
- `backend/app/schemas.py`
- `backend/app/services/subscriptions.py`
- `backend/app/dependencies/auth.py`
- `backend/app/routers/collections.py`
- `backend/app/routers/subscriptions.py`
- `backend/app/routers/stripe_webhooks.py`
- `frontend/src/types/api.ts`
- `frontend/src/views/CollectionsPage.tsx`
- `frontend/src/views/SettingsPage.tsx`

**Notes:**
- Grandfather clause: existing subscriptions without `current_period_end` are treated as active
- `PLAN_DURATIONS` dict maps plan codes to day counts (weekly=7, monthly=30, yearly=365)
- Error messages are user-friendly; blocked users see link to Settings page

### Feature C: Drivers MVP
**Status:** ✅ Completed (Feb 9, 2026 — commit b4bf84e)
**Implemented by:** Claude Code + Cursor

**What was built:**
- DB: `drivers` table with vehicle info, phone, availability (migration 0008)
- DB: Added `driver_id` and `proof_url` columns to collections table
- Backend: `require_driver` dependency in `dependencies/auth.py` + `is_driver` flag on User model
- Backend: `POST /admin/drivers` — admin creates a driver (registers user + creates driver profile)
- Backend: `GET /admin/drivers` — admin lists all drivers
- Backend: `PATCH /admin/collections/{id}/assign-driver` — admin assigns driver to collection
- Backend: `GET /drivers/me/profile` — driver views own profile
- Backend: `PATCH /drivers/me/profile` — driver updates profile (vehicle, phone, availability)
- Backend: `GET /drivers/me/collections` — driver views assigned collections
- Backend: `PATCH /drivers/me/collections/{id}/mark-collected` — driver marks collection as collected with proof URL
- Frontend: `DriverPage.tsx` — driver dashboard with profile view, assigned collections, mark-collected action
- Frontend: `driverApi.ts` — typed API client for driver endpoints
- Frontend: `RequireDriver.tsx` route guard
- Frontend: Admin page updated with driver management (create driver form, assign driver to collections)

**Files:**
- `backend/alembic/versions/0008_add_drivers_and_collection_driver_fields.py` (new)
- `backend/app/models/driver.py` (new)
- `backend/app/routers/drivers.py` (new)
- `backend/app/services/drivers.py` (new)
- `backend/app/routers/admin.py` (updated with driver endpoints)
- `backend/app/dependencies/auth.py` (added `require_driver`)
- `backend/app/schemas.py` (added driver schemas)
- `frontend/src/views/DriverPage.tsx` (new)
- `frontend/src/lib/driverApi.ts` (new)
- `frontend/src/ui/RequireDriver.tsx` (new)
- `frontend/src/views/AdminPage.tsx` (updated with driver management)

### Chore: Codebase Cleanup
**Status:** ✅ Completed (Feb 9, 2026)
**Implemented by:** Cursor Agent (prompt by Claude Code)

**What was done:**
- Removed duplicate `from typing import Annotated` import in `backend/app/dependencies/auth.py`
- Removed dead commented-out code block at end of `backend/app/schemas.py`
- Deleted unused `backend/app/schemas/auth.py` + entire `backend/app/schemas/` directory
- Removed unused `useChoosePlan()` export from `frontend/src/hooks/useSubscription.ts`
- Deleted stale auto-generated `frontend/src/types/api.d.ts`
- Fixed `frontend/.env.example` to point to `http://localhost:8000`
- Added `frontend/eslint.config.js` (ESLint v9 flat config) + minimal dev deps so `npm run lint` works
- Fixed empty `catch {}` lint error in `frontend/src/ui/AppLayout.tsx`

**Verification:** `npm run build` ✅ | `npm run lint` ✅ | `docker compose up` ✅

### Chore: Testing Strategy + Unit Tests
**Status:** ✅ Completed (Feb 10, 2026 — commit fd88ac9, PR #5)
**Implemented by:** Claude Code

**What was built:**
- `docs/TESTING_STRATEGY.md` — academic testing strategy document (philosophy, tools, environments, CI plan)
- Backend test infrastructure: pytest + pytest-asyncio + httpx with shared `conftest.py` fixtures using FastAPI `dependency_overrides` and per-test isolated SQLite databases
- 24 backend tests: auth (7), admin (5), drivers (4), collections (3), healthz (2), wallet/return-points (3)
- Frontend test infrastructure: Vitest + React Testing Library + MSW for Node
- 11 frontend tests: auth utilities (6), LandingPage component (5)
- CI updated: `.github/workflows/ci.yml` now runs lint + test for both backend and frontend

**Files:**
- `docs/TESTING_STRATEGY.md` (new)
- `backend/pyproject.toml` (new)
- `backend/tests/conftest.py` (new)
- `backend/tests/test_auth.py`, `test_admin.py`, `test_drivers.py`, `test_collections.py` (new)
- `backend/tests/test_healthz.py`, `test_wallet_and_return_points.py` (rewritten)
- `backend/requirements.txt` (added pytest, pytest-asyncio, httpx)
- `frontend/src/test/setup.ts`, `frontend/src/test/server.ts` (new)
- `frontend/src/lib/auth.test.ts`, `frontend/src/views/LandingPage.test.tsx` (new)
- `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/package.json` (updated)
- `frontend/src/mocks/handlers.ts` (added `/auth/me` handler)
- `.github/workflows/ci.yml` (updated)

**Verification:** Backend 24/24 ✅ | Frontend 11/11 ✅ | Lint ✅ | Build ✅

### Chore: Landing Page Images
**Status:** ✅ Completed (Feb 10, 2026)
**Implemented by:** Claude Code

**What was done:**
- Replaced 4 `<ImageIcon>` placeholders on LandingPage with real Unsplash photos
- Hero: Bottles packed for recycling (Nareeta Martin)
- Blog 1: Recycling scene (Pawel Czerwinski)
- Blog 2: Team collaborating (Annie Spratt)
- Blog 3: Zero-waste shopping (Markus Spiske)
- All images royalty-free under Unsplash License

**Files:**
- `frontend/public/images/` — 4 new JPG files
- `frontend/src/views/LandingPage.tsx` — replaced placeholders with `<img>` tags

### Feature D: Driver Earnings & Payouts MVP
**Status:** ✅ Completed (Feb 10, 2026 — commit f7c2f38)
**Implemented by:** Claude Code + Cursor

**What was built:**
- DB: `driver_earnings` + `driver_payouts` tables (migration 0009)
- Backend: earnings/payouts endpoints in admin + driver routers
- Backend: `EARNING_PER_BAG_CENTS = 50` (€0.50/bag)
- Frontend: DriverPage earnings section, AdminPage payouts tab

**Files:**
- `backend/alembic/versions/0009_*.py` (migration)
- `backend/app/models/driver_earning.py`, `backend/app/models/driver_payout.py`
- `backend/app/services/driver_payouts.py` (new)
- `backend/app/routers/admin.py`, `backend/app/routers/drivers.py`
- `frontend/src/views/AdminPage.tsx`, `frontend/src/views/DriverPage.tsx` (updated)

### Chore: Voucher Amount Workflow, Image Upload, Role-Based Nav, Return Points Seed
**Status:** ✅ Completed (Feb 11, 2026 — commit 50a98c2)
**Implemented by:** Claude Code + Cursor

**What was built:**
- Backend: real image upload (`POST /api/uploads/proof`, JPEG/PNG, 5MB max)
- Backend: `voucher_amount_cents` on collections (migration 0010), admin "processed" uses real amount
- Backend: skip subscription requirement for admin/driver roles
- Backend: 18 Dublin return points seeded
- Frontend: driver mark-collected modal with file upload + voucher amount
- Frontend: role-based sidebar navigation
- Created `FIXES_PLAN.md`

**Files:**
- `backend/alembic/versions/0010_*.py` (migration)
- `backend/app/routers/uploads.py` (new)
- `backend/app/services/seed.py`
- `backend/app/dependencies/auth.py`
- `frontend/src/ui/AppLayout.tsx`, `frontend/src/views/DriverPage.tsx` (updated)

### Chore: Admin Metrics Enhancements, Wallet History, Deployment Prep
**Status:** ✅ Completed (Feb 12, 2026 — commit 8e1549c)
**Implemented by:** Claude Code + Cursor

**What was built:**
- Backend: enhanced `/admin/metrics` with financial metrics
- Backend: wallet history with collection details
- Frontend: MetricCard component with tooltips
- Frontend: enhanced AdminPage + WalletPage
- Created `DEPLOYMENT_GUIDE_CLAUDE.md`
- Removed dev.db from repo

**Files:**
- `backend/app/routers/admin.py`, `backend/app/routers/wallet.py`
- `frontend/src/components/MetricCard.tsx` (new)
- `frontend/src/views/AdminPage.tsx`, `frontend/src/views/WalletPage.tsx` (updated)

---

## 🚧 In Progress

### CI/CD Deployment Setup (Railway + Vercel)
**Status:** 🚧 In Progress
**Description:**
- Create `.github/workflows/deploy.yml` with Railway deploy after tests
- Create `docs/DEPLOYMENT_CHECKLIST.md` with all env vars
- Configure Railway + Vercel projects (manual)
- Set up Stripe webhooks for production
**Files:**
- `.github/workflows/deploy.yml` (new)
- `docs/DEPLOYMENT_CHECKLIST.md` (new)
- `docs/PROJECT_PROGRESS.md` (updated)

---

## 📋 Planned Features (Prioritized)

---

## 🚫 Scope Boundaries (Do Not Touch)

- Do NOT refactor existing working code unless required for new feature
- Do NOT upgrade dependencies
- Do NOT expose .env secrets in code or logs
- Do NOT modify authentication/authorization core without explicit approval
- Do NOT change database schema for completed features

---

## 📝 Implementation Guidelines

1. **Always update this file** when starting/completing features
2. **Document file changes** in the relevant feature section
3. **Note edge cases** discovered during implementation
4. **Track blockers** and technical debt
5. **Reference this file** at start of each session to maintain context

## 🛠 Development Workflow

**Primary dev environment:** Docker Compose (backend + Postgres + Adminer)
```bash
docker compose up          # Postgres :5432, backend :8000, Adminer :8081
```
The backend container auto-runs `alembic upgrade head` on startup.

**Frontend (separate terminal):**
```bash
cd frontend
npm run dev                # http://localhost:5173
```

**Verification commands:**
```bash
docker compose up          # backend must start without errors
cd frontend && npm run build   # must succeed with no TS errors
cd frontend && npm run lint    # should pass
```

**Testing commands:**
```bash
# Backend (no Docker needed — uses SQLite)
PYTHONPATH=backend pytest -q backend/tests/

# Frontend (no backend needed — uses MSW mocks)
cd frontend && npm run test
```

---

## Current Tech Stack

**Backend:** FastAPI (Python 3.12), async SQLAlchemy 2.0, Pydantic Settings, Alembic
**Database:** PostgreSQL (Docker) / SQLite (dev fallback)
**Frontend:** React 18, Vite, TypeScript, Tailwind CSS v4, TanStack Query v5
**Auth:** JWT Bearer tokens (custom, via `dependencies/auth.py`)
**Payments:** Stripe (simulated for MVP)
**Maps:** Leaflet + react-leaflet + OpenStreetMap
**API Mocking:** MSW (Mock Service Worker)
**Testing:** pytest + pytest-asyncio + httpx (backend), Vitest + React Testing Library + MSW (frontend)
**CI:** GitHub Actions — lint, test, build for both backend and frontend
**CI/CD:** GitHub Actions → Railway (backend), Vercel (frontend)

---

Last Updated: Feb 12, 2026