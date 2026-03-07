# GreenCredits — Project History

> This file consolidates all implementation session notes, testing guides, and deployment records
> produced during development. It replaces the following standalone files that have been deleted:
> `frontend/AUTH_TESTING.md`, `frontend/SUBSCRIPTIONS_COLLECTIONS_TESTING.md`,
> `frontend/WALLET_RETURNPOINTS_TESTING.md`, `frontend/MAP_FEATURE_NOTES.md`, `docs/CHANGELOG.md`.
>
> For the current feature status, see `docs/PROJECT_PROGRESS.md`.
> For deployment environment variables, see `docs/DEPLOYMENT_CHECKLIST.md`.

---

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://green-credits-drs.vercel.app |
| Backend (Railway) | https://greencreditsdrs-production.up.railway.app |
| Backend health | https://greencreditsdrs-production.up.railway.app/healthz |
| Backend OpenAPI | https://greencreditsdrs-production.up.railway.app/docs |

---

## Early Development Session Notes (December 2025)

### 2025-12-01 — Auth UX and Collections Cleanup

**Changes made:**

- Subscriptions: Fixed `PUT /collection-slots/me` — parsing/validating weekday and times; added `preferredReturnPointId` validation and 400 errors for invalid input. Success/error toasts added; dark-mode select styling improved.
- Collections: Wired `PATCH /collections/{id}/cancel` in UI with toasts. Added `DELETE /collections/{id}`: owner-only, allowed only for cancelled collections, soft-deletes (archives) instead of hard delete. Enforced weekly pickup rule in create: only 1 pickup per ISO week per user. Corrected timestamp handling.
- Wallet: Demo seed on startup adds a few transactions for users without history. Increased `wallet_transactions.kind` length to 32 (migration).
- Auth UX: Split routing into `PublicLayout` (`/`, `/login`, `/signup`) and `AppLayout` (authenticated pages). New `LandingPage` and `SignupPage`; signup auto-logs in and redirects to `/wallet`. Added `RequireAdmin` wrapper.
- Navigation: Responsive sidebar with collapsed mode and toggle button. Map page simplified to a list with "Open in Google Maps" links.

**How to verify:** Edit weekly slot → success toast; refresh persists. Cancel a scheduled collection → list updates with toast. Weekly rule: schedule a second pickup in the same week → 400.

### 2025-12-02 — Collections & Schedule UX, Settings, Navigation

**Changes made:**

- Recurring schedule summary shown (frequency, weekday, time, preferred return point).
- Create-one-off form dimmed/disabled while a recurring schedule is active.
- "Disable schedule" action added (`DELETE /collection-slots/me`).
- Settings: account name editable (`PATCH /users/me`). Delete account added with guards for active subscriptions and upcoming collections. Logout navigates to landing page.
- Navigation: icons added to sidebar items. Mobile hamburger + drawer implemented.
- Admin: `/admin` pings a protected endpoint and displays an access confirmation. Admin nav link shown only when `user.is_admin` is true.

---

## Auth Integration Testing Guide

**Purpose:** Manual verification of JWT auth flow (Phase 1 frontend integration).

**Prerequisites:**
- Backend running: `docker compose up -d`
- Frontend running: `cd frontend && npm run dev`
- Test credentials: `demo@example.com` / `myStrongP@ssw0rd`

**Key flows to verify:**

1. **Login** — fill `/login`, click "Sign in" → loading state → redirect to `/wallet` → `gc_access_token` stored in localStorage.
2. **Token persistence** — refresh the page → app calls `/auth/me` → user stays logged in.
3. **Protected routes** — while logged out, visit `/wallet`, `/claims`, `/map`, `/admin` → all redirect to `/login`.
4. **After login redirect** — original route preserved in navigation state; user redirected back after login.
5. **Invalid credentials** — error message visible; no token stored.
6. **Logout** — token removed from localStorage; user redirected to `/login`.
7. **Already authenticated** — navigate to `/login` while logged in → redirected to `/wallet`.

**Environment variables:**
- `VITE_API_BASE_URL` — backend URL (default: `http://localhost:8000`)
- `VITE_USE_DEV_AUTH` — set to `true` to enable MSW fake auth (dev/testing only)

**Troubleshooting:**
- CORS error on login: check `CORS_ORIGINS` in backend env includes frontend origin.
- Token not persisting: check browser localStorage (some incognito modes block it).
- MSW intercepting requests: ensure `VITE_USE_DEV_AUTH` is not `true`.

---

## Subscriptions & Collections Testing Guide

**Purpose:** Manual verification of subscription display and collection scheduling.

**Routes:** `/subscriptions` (protected), `/collections` (protected)

**What to verify:**

1. **Subscription summary** — visit `/subscriptions`. Shows status badge, plan code, start/end date. If no subscription: "You don't have a subscription yet."
2. **Pickup schedule** — shows weekly rows; one active day/time. Click "Edit schedule" → change weekday/time → Save → values persist on refresh.
3. **Collections list** — visit `/collections`. Loading state, error state, empty state ("You have no collections scheduled yet."). Create a collection (date + time, return point, optional notes/bags) → form clears and list refetches.
4. **Auth guard** — navigating to either route while logged out redirects to `/login`.

**Assumptions:**
- Subscription statuses: `active`, `paused`, `cancelled`, `inactive` (forward-compatible).
- `CollectionSlot` schema: single weekly preference (weekday 0–6, start/end time, `preferredReturnPointId`).
- Collections endpoint: `GET /collections/me` (paginated).

**Troubleshooting:**
- Ensure `VITE_API_BASE_URL` is set if backend is not on `localhost:8000`.
- Check browser console/network for 401 responses; session might be expired.

---

## Wallet & Return Points Testing Guide

**Purpose:** Manual verification of wallet balance/history and return points map.

**Prerequisites:**
- Backend running (Docker/Postgres).
- Frontend running (`npm run dev`). MSW disabled by default.
- Credentials: `demo@example.com` / `myStrongP@ssw0rd`

**Flow:**

1. Log in at `/login`.
2. Navigate to `/wallet` — balance shown in Euro with 2 decimals; "Last updated" timestamp; transaction list with date/time, type, amount (green/red), note. Pagination works; empty state shows "No transactions yet."
3. Refresh at `/wallet` — page works using token from localStorage.
4. Navigate to `/map` — list populated from `/return-points`. Click an item to highlight and show details (name, type, retailer, eircode, lat/lng). Loading and error states handled.
5. Logout from header → redirected to `/login`. Protected routes inaccessible.
6. Try visiting `/wallet` or `/map` directly while logged out → redirected to `/login`.

**Notes:**
- All authenticated requests include `Authorization: Bearer <token>`.
- 401/403 responses automatically clear token and redirect to `/login`.
- API base URL sourced from `VITE_API_BASE_URL`; no hard-coded URLs.

---

## Map Feature Notes

**Library:** Leaflet + react-leaflet (no API key required)

**Files:**
- `frontend/src/components/ReturnPointsMap.tsx` — map component rendering markers
- `frontend/src/views/MapPage.tsx` — sidebar list, details panel, map integration

**Data wiring:**
- Uses `useReturnPoints` hook.
- Props to `ReturnPointsMap`: `points: ReturnPoint[]`, `selectedPointId?: number`, `onSelectPoint: (id: number) => void`.

**Selection sync:**
- Clicking a marker calls `onSelectPoint(id)` → selected in sidebar.
- Clicking a list item sets `selectedPointId` → map pans/zooms to that point.
- Selected marker visually highlighted with an overlaid `CircleMarker`.

**Map behavior:**
- If points exist, map fits bounds to include them all.
- If no points, defaults to Dublin centre/zoom.
- Popups show: name, type, retailer (if any), eircode (if any).

**Type-based styling (added during sprint):**
- `getPointColor(type)` helper: RVM → cyan, Manual → amber, Supermarket/fallback → blue.
- Selected point `CircleMarker` uses the mapped colour.
- Mini legend at bottom of sidebar shows colour → type mapping.

**Potential future improvements (not in scope):**
- Marker clustering for dense areas.
- Custom marker icons per type / retailer branding.
- User location marker and "near me" search.
- Persist selected point in URL query param for deep linking.

---

## Email / Notification System Notes

**Implemented during final sprint (February 2026).**

**Architecture:**
- In-process async event bus: `backend/app/core/events.py`
- Event handlers registered on app startup via `notification_handlers.py`
- Email provider: Resend SDK, sender `onboarding@resend.dev` (sandbox)

**Events wired to emails:**
- `collection.completed` → email to user with wallet credit amount
- `claim.resolved` → email to user with admin response
- `collection.assigned` → email notification to driver

**Rationale for in-process bus (not RabbitMQ):**
- Appropriate for MVP/academic scale
- A production system would migrate to RabbitMQ or similar for durability and horizontal scaling
- This is documented in the project report

---

## Deployment History

### Initial Deployment (February 2026)

**Backend (Railway):**
- Service: `greencreditsdrs-production.up.railway.app`
- PostgreSQL provisioned as a Railway addon
- Alembic migrations run automatically on container start via `backend/docker/entrypoint.sh`
- Environment variables set in Railway → Variables tab (see `docs/DEPLOYMENT_CHECKLIST.md` for full list)

**Frontend (Vercel):**
- Project: `green-credits-drs.vercel.app`
- Root directory: `frontend`, build command: `npm run build`, output: `dist`
- Environment variable: `VITE_API_BASE_URL` pointing to Railway backend URL
- Auto-deploys on push to `main`

**Stripe:**
- Test mode only
- Webhook endpoint registered at `https://greencreditsdrs-production.up.railway.app/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`

**CI/CD:**
- GitHub Actions: `.github/workflows/ci.yml` runs backend pytest + frontend lint/vitest/build on every push
- Playwright E2E tests run on pushes to `main` only (not PRs) against the live Vercel URL
- SonarCloud scan runs after backend + frontend jobs succeed

**Lessons learned:**
- Use Railway **account tokens** (not project tokens) for GitHub Actions deployment — project tokens cause "Unauthorized".
- Disable Railway's built-in GitHub integration to avoid double deploys when GitHub Actions is also deploying.
- CORS errors in production: `CORS_ORIGINS` in Railway must include the exact Vercel URL with no trailing slash.
- Stripe webhook secret must be the **endpoint-specific** `whsec_...` value, not the API key.
