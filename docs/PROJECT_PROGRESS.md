# GreenCredits - Project Progress

## Project Overview
GreenCredits — subscription-based bottle collection platform. Users pay a monthly fee for weekly bottle pickups; collected bottles are redeemed at return points and the voucher value is credited to an in-app wallet or donated. Payments (Stripe) and voucher scanning are simulated for the MVP.

---

## ✅ Completed Features

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

---

## 🚧 In Progress

None currently.

---

## 📋 Planned Features (Prioritized)

### Next Up: [TBD - awaiting planning session]

### Feature A: Fix Admin Dashboard Total Cards
**Priority:** Medium
**Effort:** Low
**Dependencies:** None
**Description:** Replace mock data in admin dashboard cards with real computed values from database

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