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

### Chore: CI/CD Deployment Setup (Railway + Vercel)
**Status:** ✅ Completed (Feb 12, 2026)
**Implemented by:** Claude Code + Cursor

**What was built:**
- `.github/workflows/deploy.yml` — Railway deploy triggered on CI success
- `docs/DEPLOYMENT_CHECKLIST.md` — all env vars, Stripe webhook setup, manual steps
- Railway (backend) + Vercel (frontend) fully configured and live
- Stripe test-mode webhooks registered at production Railway URL
- SonarCloud scan added to CI pipeline

**Live URLs:**
- Frontend: https://green-credits-drs.vercel.app
- Backend: https://greencreditsdrs-production.up.railway.app

---

### Task 1: Fix Collection Slots User Filtering Bug
**Status:** ✅ Completed (final sprint)
**Implemented by:** Cursor

**What was fixed:**
- `GET /collection-slots/me` now correctly returns only the calling user's active slot
- Added `CollectionSlot.status == "active"` filter to `get_me` service query
- Prevents stale cancelled/paused slots from being returned

**Files:**
- `backend/app/services/collection_slots.py`

---

### Task 2a: Driver Assignment by Zone
**Status:** ✅ Completed (final sprint)
**Implemented by:** Cursor

**What was built:**
- `zone` field added to `drivers` table (Alembic migration)
- Zone shown on driver dashboard and in admin collections table
- Admin driver assignment filtered by matching zone
- Zone enum: Dublin 1, Dublin 2–4, Dublin 6–8, South County, North County

**Files:**
- `backend/alembic/versions/` (new migration)
- `backend/app/models/driver.py`
- `backend/app/schemas.py`
- `backend/app/routers/admin.py`, `backend/app/routers/drivers.py`
- `frontend/src/views/DriverPage.tsx`, `frontend/src/views/AdminPage.tsx`

---

### Task 2b: Glass Collection with Differentiated Pricing
**Status:** ✅ Completed (final sprint — commit 74b1085)
**Implemented by:** Cursor

**What was built:**
- `collection_type` field added to collections: enum of `bottles`, `glass`, `both` (Alembic migration)
- Material selector on collection booking form (user side)
- Collection type badge shown in collections list for users, drivers, and admin
- No pricing changes — this is a service option, not a tier

**Files:**
- `backend/alembic/versions/` (new migration)
- `backend/app/models/collection.py`, `backend/app/schemas.py`
- `backend/app/routers/collections.py`
- `frontend/src/views/CollectionsPage.tsx`, `frontend/src/views/AdminPage.tsx`, `frontend/src/views/DriverPage.tsx`

---

### Task 3a: Claims Page
**Status:** ✅ Completed (final sprint)
**Implemented by:** Cursor

**What was built:**
- `claims` table: id, user_id, description, image_url, status (open/in_review/resolved), admin_response, created_at, updated_at
- `POST /claims` — user submits a claim
- `GET /claims/me` — user views their own claims with status
- `GET /admin/claims` — admin views all claims with status filtering
- `PATCH /admin/claims/{id}/status` — admin updates status + optional response
- Frontend: Claims page (form + list with status badges)
- Frontend: Admin dashboard Claims tab
- Event bus: `claim.resolved` event triggers email to user via Resend

**Files:**
- `backend/alembic/versions/` (new migration)
- `backend/app/models/claim.py` (new)
- `backend/app/services/claims.py` (new)
- `backend/app/routers/claims.py` (new)
- `backend/app/routers/admin.py` (updated)
- `backend/app/schemas.py`
- `frontend/src/views/ClaimsPage.tsx` (new)
- `frontend/src/lib/claimsApi.ts` (new)
- `frontend/src/views/AdminPage.tsx` (updated)

---

### Task 3b: Notification Centre
**Status:** ✅ Completed (final sprint)
**Implemented by:** Cursor

**What was built:**
- `notifications` table: id, user_id (nullable = broadcast), title, body, is_read, created_at
- `GET /notifications/me` — personal + broadcast notifications, newest first
- `PATCH /notifications/{id}/read` — mark as read
- `POST /admin/notifications` — admin sends to a user or broadcasts to all
- `GET /admin/notifications` — admin views sent notifications
- Frontend: bell icon in navbar with unread count badge; dropdown with notification list
- Frontend: Admin "Send Notification" form (user selector or broadcast)

**Files:**
- `backend/alembic/versions/` (new migration)
- `backend/app/models/notification.py` (new)
- `backend/app/services/notifications.py` (new)
- `backend/app/routers/notifications.py` (new)
- `backend/app/routers/admin.py` (updated)
- `backend/app/schemas.py`
- `frontend/src/lib/notificationsApi.ts` (new)
- `frontend/src/views/AdminPage.tsx` (updated)
- `frontend/src/ui/AppLayout.tsx` (bell icon added)

---

### Task 4: Frontend Polish
**Status:** ✅ Completed (final sprint)
**Implemented by:** Cursor

**What was built:**
- Homepage: hero carousel (3-step journey), real blog card content, corrected pricing (€4.99/wk, €14.99/mo, €149.99/yr), CTA changed to "Start Collecting" / "Choose a Plan"
- Global: consistent spacing, card shadows, border radius across all pages
- Empty states on all list views ("No collections yet — schedule your first pickup", etc.)
- Loading skeletons instead of blank screens
- Subtle hover transitions on interactive elements
- Mobile responsiveness verified across all pages
- Confirmation modal before destructive actions (cancel subscription, delete account)
- Toast notifications for all success/error actions
- User-friendly form validation error messages

---

### Task 5a: Wallet → Donation Flow
**Status:** ✅ Completed (final sprint)
**Implemented by:** Cursor

**What was built:**
- `voucher_preference` field on collections: `wallet` | `donate` (Alembic migration)
- `charity_id` (string) on collections — hardcoded list: Friends of the Earth Ireland, Irish Cancer Society, Barnardos
- User booking form: charity selector shown when "Donate" chosen
- Driver mark-completed screen: preference badge shown prominently
- Wallet/history page: donation transactions shown distinctly ("Donated to Barnardos — €0.25")

**Files:**
- `backend/alembic/versions/` (new migration)
- `backend/app/schemas.py`, `backend/app/models/collection.py`
- `backend/app/routers/collections.py`, `backend/app/services/drivers.py`
- `frontend/src/views/CollectionsPage.tsx`, `frontend/src/views/DriverPage.tsx`, `frontend/src/views/WalletPage.tsx`

---

### Task 5b: User Account Deletion (GDPR)
**Status:** ✅ Completed (final sprint)
**Implemented by:** Cursor

**What was built:**
- `DELETE /users/me` endpoint: anonymises personal data, cancels Stripe subscription, soft-deletes/anonymises related records
- Personal data replaced with "Deleted User"; collections and wallet transactions preserved for audit
- Frontend: "Delete Account" button in Settings behind a confirmation modal
- On success: logout, redirect to homepage, goodbye message
- "Privacy & Data" section in Settings explaining data storage and erasure rights
- Documents GDPR Article 17 compliance (Right to Erasure) in project report

**Files:**
- `backend/app/routers/users.py`
- `backend/app/services/` (user deletion logic)
- `frontend/src/views/SettingsPage.tsx`

---

### Task 6: Playwright E2E Tests
**Status:** ✅ Completed (final sprint)
**Implemented by:** Claude Code + Cursor

**What was built:**
- Playwright installed and configured (`frontend/playwright.config.ts`)
- 6 test suites: `auth.spec.ts`, `subscription.spec.ts`, `collections.spec.ts`, `admin.spec.ts`, `driver.spec.ts`, `claims.spec.ts`
- `frontend/tests/helpers.ts` — shared `loginAs()` and `logout()` helpers, credentials from env vars
- CI integration: Playwright job in `.github/workflows/ci.yml` runs on push to `main` against production Vercel URL
- Local-only tests (Stripe checkout, mutation flows) marked `@local-only` with `test.skip(!!process.env.CI)`
- HTML report + JUnit XML uploaded as CI artifacts

**Files:**
- `frontend/playwright.config.ts` (new)
- `frontend/tests/helpers.ts` (new)
- `frontend/tests/auth.spec.ts`, `collections.spec.ts`, `subscription.spec.ts`, `admin.spec.ts`, `driver.spec.ts`, `claims.spec.ts` (new)
- `.github/workflows/ci.yml` (Playwright job added)

---

### Task 7: Codebase Cleanup
**Status:** ✅ Completed (March 2026)
**Implemented by:** Claude Code

**What was done:**
- Removed dead `seed_demo_wallet_transactions()` function and its unused imports from `backend/app/services/seed.py`
- Consolidated 5 loose session-note files (`AUTH_TESTING.md`, `SUBSCRIPTIONS_COLLECTIONS_TESTING.md`, `WALLET_RETURNPOINTS_TESTING.md`, `MAP_FEATURE_NOTES.md`, `docs/CHANGELOG.md`) into `docs/PROJECT_HISTORY.md`
- Created repo-root `README.md` covering app overview, live URLs, local setup, tests, env vars, and deployment
- Updated `docs/PROJECT_PROGRESS.md` (this file) to reflect all completed final sprint features
- Folder structure confirmed clean: one file per domain in `routers/`, `services/`, `views/`, `lib/`

**Files:**
- `backend/app/services/seed.py` (dead code removed)
- `docs/PROJECT_HISTORY.md` (new)
- `README.md` (new)
- `docs/PROJECT_PROGRESS.md` (this file, updated)

---

## 📋 Planned Features (Prioritized)

> All planned features from the Final Sprint Plan have been completed. The below section is retained for reference.

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

Last Updated: March 7, 2026 — all final sprint tasks complete