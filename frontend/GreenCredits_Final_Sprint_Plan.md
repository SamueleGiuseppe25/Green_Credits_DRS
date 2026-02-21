# GreenCredits — Final Sprint Plan

> **Purpose:** This document is the source of truth for the final round of changes before project submission.
> Claude Code should read this file at the start of each session to understand scope, context, and constraints before planning any implementation or generating Cursor prompts.
>
> **Rules:**
> - Do NOT refactor existing working code unless directly required by a task below
> - Do NOT upgrade dependencies
> - Do NOT modify auth/authorization core without explicit approval
> - Do NOT change the database schema of already-completed features
> - Always check `GreenCredits_-_Project_Progress_-_10-02-2026.txt` and `DEPLOYMENT_COMPLETE.md` for current state before planning
> - Always check `Email_Notifications_Implementation_Session.md` for the email/event system details

---

## Current Stack (Reference)

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4, TanStack Query v5 |
| Backend | FastAPI (Python 3.12), async SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL (Railway) / SQLite (tests) |
| Auth | JWT Bearer tokens |
| Payments | Stripe (test mode, simulated) |
| Email | Resend SDK (`onboarding@resend.dev` sandbox sender) |
| Event Bus | In-process async event bus (`backend/app/core/events.py`) |
| Maps | Leaflet + react-leaflet + OpenStreetMap |
| Testing | pytest + httpx (backend), Vitest + RTL + MSW (frontend) |
| CI/CD | GitHub Actions → Railway (backend) + Vercel (frontend) |

**Live URLs:**
- Frontend: https://green-credits-drs.vercel.app
- Backend: https://greencreditsdrs-production.up.railway.app

---

## Task 1 — Fix: Recurring Schedule User Filtering Bug

**Priority:** 🔴 Critical (fix before anything else)
**Effort:** ~30 minutes
**Status:** 📋 To Do

### Problem
`GET /collection-slots/me` returns the first active schedule in the database regardless of which user is calling it. New users see other users' recurring schedules on their Collections page.

### Root Cause
The query is missing a `user_id` filter.

### Expected Fix
```python
# In the collection-slots endpoint
select(CollectionSlot).where(
    CollectionSlot.user_id == current_user.id,
    CollectionSlot.status == "active"
)
```

### Verification Steps
1. Create two separate user accounts
2. User A creates a recurring schedule (e.g. Sunday 6–8pm)
3. Log in as User B (brand new account)
4. Confirm User B does NOT see User A's schedule
5. Confirm User A still sees their own schedule correctly

---

## Task 2 — Post-MVP Enhancements

### 2a — Driver Assignment by Zone

**Priority:** 🟡 Medium
**Effort:** ~half day
**Status:** 📋 To Do

#### What to build
- Add a `zone` field to the `drivers` table (migration required)
- Add a `zone` field to `users` or `collection_slots` so collections have a zone
- When admin assigns a driver to a collection, filter available drivers by matching zone
- Driver dashboard shows their assigned zone
- Admin can see zone in the collections table

#### Notes
- Zone can be a simple string enum (e.g. "Dublin 1", "Dublin 2–4", "Dublin 6–8", "South County", "North County")
- No complex geo-routing needed — a sorted daily run sheet (collections ordered by time slot) for each driver is sufficient for MVP

---

### 2b — Glass Collection with Differentiated Pricing

**Priority:** 🟡 Medium
**Effort:** ~half day
**Status:** 📋 To Do

#### What to build
- Add a `collection_type` field to collections: enum of `bottles`, `glass`, `both`
- Keep the same subscription plans (weekly/monthly/yearly) — pricing does NOT change at subscription level
- When a user schedules a collection, they choose what material type they are putting out
- This choice is shown to the driver and the admin
- No new Stripe price IDs needed — it's a service option, not a pricing tier

#### UI
- On the collection booking form: a material selector (Bottles / Glass / Both)
- Show the material type badge on the collections list for users, drivers, and admin

---

## Task 3 — Claims Page + Notification Centre

**Priority:** 🟠 High
**Effort:** ~1 day
**Status:** 📋 To Do

### 3a — Claims Page

#### What to build

**Database (new migration required):**
```
claims table:
  - id
  - user_id (FK → users)
  - description (text)
  - image_url (optional, string)
  - status (enum: open | in_review | resolved)
  - admin_response (optional text)
  - created_at
  - updated_at
```

**Backend endpoints:**
- `POST /claims` — user submits a claim (description + optional image URL)
- `GET /claims/me` — user views their own claims and their status
- `GET /admin/claims` — admin views all claims with filtering by status
- `PATCH /admin/claims/{id}/status` — admin updates status and optionally adds a response

**Frontend:**
- New "Claims" page for users: form to submit a claim, list of their previous claims with status badges
- Admin dashboard: new "Claims" tab showing all claims, status management, ability to write a response

#### Notes
- Image upload: store a URL (same pattern as `proof_url` on collections — user provides a link or uploads to a simple host). Do not implement file storage infrastructure.
- Wire into the event bus: when admin resolves a claim, publish a `claim.resolved` event → send email to user via Resend

---

### 3b — Notification Centre

#### What to build

**Database (new migration required):**
```
notifications table:
  - id
  - user_id (FK → users, nullable — null = broadcast to all)
  - title (string)
  - body (text)
  - is_read (boolean, default false)
  - created_at
```

**Backend endpoints:**
- `GET /notifications/me` — user fetches their notifications (personal + broadcasts), ordered newest first
- `PATCH /notifications/{id}/read` — mark a notification as read
- `POST /admin/notifications` — admin sends a notification to a specific user or broadcasts to all
- `GET /admin/notifications` — admin views sent notifications

**Frontend:**
- Bell icon in the navbar with unread count badge
- Clicking opens a side drawer or dropdown with the notification list
- Admin dashboard: "Send Notification" form (select user or "All Users", title, body)

#### Notes
- Polling is fine (fetch on page load + on bell click) — no websockets needed
- Wire into event bus: admin posting a notification also triggers an email via Resend if the notification is marked as important

---

## Task 4 — Frontend Polish

**Priority:** 🟠 High
**Effort:** ~1 day
**Status:** 📋 To Do

### 4a — Homepage Improvements

- **Hero section:** Add a carousel or animated section showing the 3-step user journey (Subscribe → Schedule → Get Credited) with the existing Unsplash photos
- **Blog cards:** Fill in the 3 blog cards with real placeholder content:
  - Card 1: "How Ireland's DRS Scheme Works" — brief explanation of the national deposit return scheme with a link to re-turn.ie
  - Card 2: "Why Subscription Recycling Makes a Difference" — environmental impact angle
  - Card 3: "GreenCredits and the Circular Economy" — how the platform connects to broader sustainability goals
- **Pricing section:** Fix the displayed prices to match production Stripe prices (€4.99/week, €14.99/month, €149.99/year)
- **CTA button:** Change "Get Started for Free" to "Start Collecting" or "Choose a Plan" — there is no free tier, so this wording is misleading

### 4b — Global UI Consistency

Apply the same visual polish pass to all pages, not only the homepage:

- Collections page
- Settings page
- Driver dashboard
- Admin dashboard
- Claims page (new)
- Notifications (new)

Specific improvements:
- Consistent spacing, card shadows, and border radius across all pages
- Empty states (e.g. "No collections yet — schedule your first pickup") on all list views that can be empty
- Loading skeletons instead of blank screens while data fetches
- Subtle hover transitions on interactive elements
- Mobile responsiveness check on all pages

### 4c — General UX

- Add a confirmation modal before any destructive action (cancel subscription, delete account)
- Toast notifications for all success/error actions that currently have none
- Ensure all form validation errors are visible and user-friendly

---

## Task 5 — Additional Features

### 5a — Wallet → Donation Flow

**Priority:** 🟡 Medium
**Effort:** ~half day
**Status:** 📋 To Do

#### Context
When a driver deposits bottles at a DRS return point, the machine prints a voucher. Based on what the user selected at collection booking time, the driver either:
- Scans/uploads the voucher → credits are added to the user's in-app wallet
- Selects "Donate" on the deposit point screen → voucher value is donated to a charity

#### What to build

**User side (at collection booking):**
- Add a `voucher_preference` field to collections: enum of `wallet` | `donate`
- If donate: show a charity selector (predefined list, e.g. "Friends of the Earth Ireland", "Irish Cancer Society", "Barnardos")
- Store `charity_id` on the collection

**Driver side (at mark-completed step):**
- Show the user's preference clearly on the driver's mark-completed screen
- If `wallet`: driver enters voucher amount → credited to user wallet (existing flow)
- If `donate`: driver confirms donation was made → log a `donation` wallet transaction with amount (no wallet credit, just a record)

**Database:**
- Add `voucher_preference` (enum) and `charity_id` (nullable FK or string) to collections table (new migration)
- Add a `charities` table or hardcode a small list — hardcoded list is fine for MVP

**Frontend:**
- User: charity selector shown conditionally on booking form when "Donate" is chosen
- Driver: preference badge shown prominently on the collection detail
- User wallet/history page: show donation transactions distinctly from credit transactions (e.g. green badge "Donated to Barnardos — €0.25")

---

### 5b — User Account Deletion (GDPR)

**Priority:** 🟡 Medium
**Effort:** ~2–3 hours
**Status:** 📋 To Do

#### What to build

**Backend:**
- `DELETE /users/me` endpoint
- On deletion:
  - Anonymise or hard-delete personal data (name, email, hashed password)
  - Cancel active Stripe subscription via Stripe API (`stripe.subscriptions.cancel`)
  - Soft-delete or anonymise related records (collections, wallet transactions) — replace name/email with "Deleted User"
  - Do NOT delete collections/transaction records entirely (needed for admin audit trail)
  - Return `204 No Content`

**Frontend:**
- "Delete Account" button in Settings page, behind a confirmation modal ("This action is permanent and cannot be undone")
- On success: log user out, redirect to homepage, show a goodbye message
- Add a brief "Privacy & Data" section to Settings explaining what data is stored and that users can request deletion

**Notes:**
- Document this in the project report as GDPR Article 17 compliance (Right to Erasure)
- The Stripe cancellation must happen before DB deletion to avoid orphaned subscriptions

---

## Task 6 — Implement Playwright E2E Tests

**Priority:** 🟠 High
**Effort:** ~half day setup + tests
**Status:** 📋 To Do

### Setup

```bash
cd frontend
npm init playwright@latest
# Choose: TypeScript, tests/ folder, yes to GitHub Actions, yes to install browsers
```

### Test Suites to Write

Write tests covering the following critical user journeys. Run against production URLs or localhost.

| Test file | Journey covered |
|---|---|
| `auth.spec.ts` | Register new account → log in → log out |
| `subscription.spec.ts` | Log in → choose monthly plan → complete Stripe test checkout → verify subscription active in Settings |
| `collections.spec.ts` | Log in with active subscription → schedule a collection → verify it appears in collections list |
| `admin.spec.ts` | Log in as admin → view metrics → change a collection status |
| `driver.spec.ts` | Log in as driver → view assigned collections → mark one as collected |
| `claims.spec.ts` | Log in → submit a claim → verify it appears in claims list |

### Codegen Tip

Use Playwright's recorder to generate test scaffolding automatically:
```bash
npx playwright codegen https://green-credits-drs.vercel.app
```

### CI Integration

Add a Playwright job to `.github/workflows/ci.yml` that runs against the production Vercel URL on every push to `main`. Playwright generates an HTML report with screenshots and video — include this in the project report appendix.

### Notes
- Playwright is free and open source (MIT licence)
- Use Stripe's test card `4242 4242 4242 4242` for payment tests
- Store test credentials (admin email/password, test user email/password) in GitHub Secrets, not hardcoded

---

## Task 7 — Codebase Cleanup

**Priority:** 🟢 Low (do last)
**Effort:** ~1–2 hours
**Status:** 📋 To Do

### What to do

- Remove any unused files, dead routes, or commented-out code identified during the other tasks
- Ensure folder structure is clean and consistent:
  - `backend/app/routers/` — one file per domain
  - `backend/app/services/` — one file per domain
  - `frontend/src/views/` — one file per page
  - `frontend/src/lib/` — one file per API domain
- Update `GreenCredits_-_Project_Progress_-_10-02-2026.txt` to reflect all completed features from this sprint
- Update `README.md` (or create one if missing) to accurately describe:
  - What the app does
  - How to run it locally (Docker Compose + frontend dev server)
  - How to run tests (pytest, vitest, playwright)
  - Environment variables required
  - Deployment overview
- Update the project description in any documentation to reflect the actual implemented scope (glass collection, claims, notification centre, GDPR deletion, Playwright tests)

---

## Suggested Implementation Order

| # | Task | Why this order |
|---|---|---|
| 1 | Fix collection slots bug | Privacy bug — fix immediately |
| 2 | Claims + Notification Centre | High demo impact, standalone feature |
| 3 | Frontend polish + blog cards | Visual quality for submission |
| 4 | Wallet → Donation Flow | Closes a core feature from the original proposal |
| 5 | GDPR Account Deletion | Closes GDPR compliance gap from the proposal |
| 6 | Driver Zone Assignment | Operational logic, good academic story |
| 7 | Glass Collection Type | Extends booking form, clean feature |
| 8 | Playwright E2E Tests | Add after features are stable |
| 9 | Codebase Cleanup | Always last |

---

## Execution Order (Detailed — Claude Code Verified)

> This section was generated by Claude Code after inspecting the actual codebase.
> It refines the suggested order above with dependency analysis, risk notes, and sub-task sequencing.

### Dependency Graph

```
Task 1 (Bug Fix)
  └─ no dependencies — do first

Task 3a (Claims backend)
  └─ requires: new DB migration (claims table)
Task 3b (Notification Centre backend)
  └─ requires: new DB migration (notifications table)
  └─ can run in parallel with 3a

Task 3a + 3b frontend
  └─ blocked by: backend endpoints being merged

Task 4 (Frontend Polish)
  └─ depends on: Tasks 3a/3b being done (Claims & Notifications pages need polish too)
  └─ can partially start earlier (homepage, settings) while 3a/3b are in progress

Task 5a (Wallet → Donation Flow)
  └─ requires: new DB migration (voucher_preference + charity fields on collections)
  └─ depends on: nothing else — standalone

Task 5b (GDPR Account Deletion)
  └─ requires: Stripe API access (already configured)
  └─ no DB migration needed — soft-delete / anonymise existing rows

Task 2a (Driver Zone Assignment)
  └─ requires: new DB migration (zone field on drivers/users)
  └─ depends on: nothing critical, but do after core features

Task 2b (Glass Collection Type)
  └─ requires: new DB migration (collection_type field on collections)
  └─ can be done in parallel with 2a

Task 6 (Playwright E2E Tests)
  └─ blocked by: all features above being stable on production

Task 7 (Codebase Cleanup)
  └─ always last
```

### Confirmed Execution Order

| Step | Task | Sub-tasks | Risk | Effort |
|---|---|---|---|---|
| **1** | **Task 1 — Fix collection slots bug** | Add `status == "active"` filter to `get_me` service query | Low | ~20 min |
| **2** | **Task 3a — Claims (backend)** | Migration → model → schemas → router → event bus hook | Medium | ~3 h |
| **3** | **Task 3b — Notification Centre (backend)** | Migration → model → schemas → router | Medium | ~2 h |
| **4** | **Task 3a+3b — Frontend (Claims + Notifications UI)** | Claims page, bell icon, drawer, admin tabs | Medium | ~4 h |
| **5** | **Task 4 — Frontend Polish** | Homepage, global UI consistency, UX modals/toasts | Low | ~4 h |
| **6** | **Task 5a — Wallet → Donation Flow** | DB migration, booking form update, driver screen, wallet history | Medium | ~3 h |
| **7** | **Task 5b — GDPR Account Deletion** | Backend endpoint, Stripe cancel, Settings page button + modal | Medium | ~2 h |
| **8** | **Task 2a — Driver Zone Assignment** | DB migration, zone filter logic, admin/driver UI | Medium | ~3 h |
| **9** | **Task 2b — Glass Collection Type** | DB migration, collection_type field, booking form selector, badges | Low | ~2 h |
| **10** | **Task 6 — Playwright E2E Tests** | Setup, write 6 test suites, CI integration | Low | ~4 h |
| **11** | **Task 7 — Codebase Cleanup** | Dead code removal, README update, progress doc update | Low | ~2 h |

### Code Review Notes (Task 1)

Actual state found in `backend/app/services/collection_slots.py` (line 18–20):

```python
async def get_me(session: AsyncSession, user_id: int) -> CollectionSlot | None:
    stmt = select(CollectionSlot).where(CollectionSlot.user_id == user_id).limit(1)
    return (await session.execute(stmt)).scalars().first()
```

- The `user_id` filter **is present** — the privacy bug may have been partially addressed.
- The `status == "active"` filter is **missing** — a `cancelled` or `paused` slot could be returned instead of an active one, or a stale slot could shadow a new one.
- The fix is small: add `.where(CollectionSlot.status == "active")` to this query.

---

## Out of Scope (Deliberately Excluded)

- **RabbitMQ migration** — not implemented. The in-process event bus is appropriate for MVP scale. The project report will document that a production system would migrate to RabbitMQ or similar for durability and horizontal scaling. This is sufficient for the academic context.
- **Mobile app**
- **Real DRS machine integration**
- **Custom email domain** (Resend sandbox is sufficient for academic scope)
- **Stripe live mode** (test mode is sufficient)
- **Real-time websocket notifications**
- **Voucher upload simulation** — already implemented, no changes needed

---

*Last updated: February 19, 2026*
*To be handed to Claude Code at the start of each implementation session.*
