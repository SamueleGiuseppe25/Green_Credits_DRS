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

---

## 🚧 In Progress

None currently.

---

## 📋 Planned Features (Prioritized)

### Next Up: Feature C (Drivers MVP)

### Feature C: Drivers MVP
**Priority:** High
**Effort:** High
**Dependencies:** Feature B (subscription validation)
**Description:** 
- New role: driver
- drivers table with vehicle info
- Assign drivers to scheduled collections
- Driver dashboard to mark collections completed
- Credit user wallet upon proof upload

### Feature D: Driver Payouts MVP
**Priority:** High
**Effort:** Medium
**Dependencies:** Feature C (drivers must exist first)
**Description:**
- driver_earnings table
- payouts table
- Admin payout reports and processing

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

---

## Current Tech Stack

**Backend:** FastAPI (Python 3.12), async SQLAlchemy 2.0, Pydantic Settings, Alembic
**Database:** PostgreSQL (Docker) / SQLite (dev fallback)
**Frontend:** React 18, Vite, TypeScript, Tailwind CSS v4, TanStack Query v5
**Auth:** JWT Bearer tokens (custom, via `dependencies/auth.py`)
**Payments:** Stripe (simulated for MVP)
**Maps:** Leaflet + react-leaflet + OpenStreetMap
**API Mocking:** MSW (Mock Service Worker)

---

Last Updated: Feb 9, 2026