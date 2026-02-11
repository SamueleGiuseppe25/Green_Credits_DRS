# GreenCredits – Fixes & Enhancements Plan (Post-Feature C & D)

## Current State Summary

After analyzing the entire codebase, here is the current state relevant to each fix:

| Area | Current State | Gap |
|------|--------------|-----|
| **Proof upload** | `proof_url` is a string field on `Collection`; driver submits a URL string via `MarkCollectedRequest.proofUrl` | No real file upload; no image storage |
| **Driver collection workflow** | Driver marks "collected" (status assigned→collected), stores proof_url, earning created (€0.50/bag). Admin separately marks "processed" which credits user wallet (€5.00/bag). | Driver doesn't enter voucher amount; wallet credit is hardcoded `bag_count × 500`; no proof image linked to wallet tx |
| **Driver availability** | `Driver.is_available` field exists (default True), updatable via `PATCH /drivers/me/profile` | No toggle in driver dashboard UI; admin can't see availability; no filtering on assignment |
| **Driver earnings** | €0.50/bag via `EARNING_PER_BAG_CENTS = 50` in `driver_payouts.py` | Already works correctly |
| **Admin recurring schedules** | `CollectionSlot` model exists with `frequency` field (weekly/fortnightly/monthly) | Admin `/metrics` doesn't include recurring schedules; admin dashboard doesn't display them |
| **Admin voucher total** | `/admin/metrics` computes `SELECT SUM(amount_cents) FROM vouchers` | Returns demo/seed values; no real voucher records from driver workflow |
| **Admin financial metrics** | Only: total_users, active_subscriptions, total_collections, total_voucher_value | Missing: subscription revenue, driver earnings total, driver payouts total, recurring schedules |
| **Access control (nav)** | Frontend `AppLayout` sidebar shows all nav items to all roles; `RouteGuard` checks auth but not role-based nav filtering | Admin/driver see wallet, claims, subscriptions, collections, map – should be restricted |
| **Map page** | List-only view with "Open in Google Maps" links; `ReturnPointsMap` component exists but may not be wired | No Leaflet map with markers |
| **Return points dataset** | 3 return points seeded | Need more for realistic MVP |
| **Wallet demo data** | `seed_demo_wallet_transactions()` creates 3 fake `[DEMO]` transactions per user on startup | Must be removed; wallet should only show real transactions |
| **Collection status visibility** | User sees collections list with status field | No explicit "collection status" view linked to wallet transactions |

---

## Task Breakdown

Tasks are ordered by priority and dependency. Each task is self-contained with a Cursor prompt.

---

## Task 1: Real Image Upload (Backend + Driver Frontend)

**Priority:** HIGH | **Depends on:** Nothing | **Estimated files:** 8-10

### Feature Breakdown

**Backend changes:**
- Add `/uploads/` endpoint that accepts multipart file, saves to `backend/uploads/` directory, returns URL path
- Add static file serving for `backend/uploads/` in `main.py`
- Replace `proof_url` string input with uploaded file path in driver mark-collected flow
- Add image validation (max 5MB, JPEG/PNG only)

**Frontend changes:**
- Replace text input for `proofUrl` in DriverPage with `<input type="file" accept="image/*">`
- Upload image first, get URL, then pass URL to mark-collected API
- Show image preview before submit

**DB changes:** None (reuse existing `proof_url` VARCHAR(512) on `collections`)

**Edge cases:**
- Large file uploads (enforce 5MB limit)
- Invalid file types
- Upload failure before mark-collected

### Cursor Prompt

---

### Context
GreenCredits is a FastAPI + React (Vite/TS/Tailwind v4) bottle collection app. Drivers mark collections as "collected" and must provide proof. Currently `proof_url` is a text string field. We need real image upload.

Backend: FastAPI with async SQLAlchemy 2.0, JWT auth. Entry: `backend/app/main.py` (`create_app()` factory).
Frontend: React 18 + Vite + TypeScript + Tailwind CSS v4. API calls via `frontend/src/lib/api.ts` (`apiFetch()`).

### Scope / Boundaries
- **Must do:**
  - Create a new router `backend/app/routers/uploads.py` with `POST /uploads/proof` endpoint
  - Accept multipart `image: UploadFile`, validate MIME (image/jpeg, image/png), max 5MB
  - Save file to `backend/uploads/` directory with UUID filename (preserve extension)
  - Return `{"url": "/uploads/<filename>"}`
  - Mount `backend/uploads/` as static files in `main.py` (add `StaticFiles` mount)
  - Create `backend/uploads/` directory with `.gitkeep`
  - Update `frontend/src/lib/driverApi.ts` to add `uploadProofImage(file: File): Promise<{url: string}>` using `FormData` and raw `fetch` (not `apiFetch` since it sets JSON content-type)
  - Update `frontend/src/views/DriverPage.tsx` mark-collected flow: replace proof URL text input with file input + preview, upload image first, then call mark-collected with returned URL
  - Auth: require JWT (any authenticated user) for upload endpoint

- **Must NOT do:**
  - Do not change the `Collection` model or DB schema
  - Do not use S3 or external storage (local files for MVP)
  - Do not modify any other pages or components
  - Do not add new npm dependencies

### Files to inspect first
- `backend/app/main.py` (router registration, app factory)
- `backend/app/routers/drivers.py` (mark-collected endpoint)
- `backend/app/services/drivers.py` (`mark_collected()` function)
- `backend/app/schemas.py` (`MarkCollectedRequest`)
- `backend/app/dependencies/auth.py` (auth dependencies)
- `frontend/src/lib/driverApi.ts` (driver API functions)
- `frontend/src/views/DriverPage.tsx` (driver UI with mark-collected form)
- `frontend/src/lib/api.ts` (apiFetch utility)

### Implementation steps
1. Create `backend/uploads/` directory with a `.gitkeep` file
2. Create `backend/app/routers/uploads.py`:
   - `POST /uploads/proof` endpoint
   - Requires `get_current_user` dependency (JWT auth)
   - Accepts `image: UploadFile = File(...)`
   - Validates: `image.content_type in ("image/jpeg", "image/png")` → 400 if not
   - Validates: file size ≤ 5MB (read content, check len) → 400 if too large
   - Generate filename: `f"{uuid4().hex}{Path(image.filename).suffix}"`
   - Save to `backend/uploads/{filename}` using `aiofiles` or sync write
   - Return `{"url": f"/uploads/{filename}"}`
3. In `backend/app/main.py`:
   - Add `from starlette.staticfiles import StaticFiles` and `from pathlib import Path`
   - After CORS middleware, mount: `app.mount("/uploads", StaticFiles(directory=Path(__file__).resolve().parent.parent / "uploads"), name="uploads")`
   - Import and include the uploads router: `app.include_router(uploads_router, prefix="/uploads", tags=["Uploads"])`
   - Note: since we mount static at `/uploads` AND have a router at `/uploads`, register the router BEFORE the static mount, or use a different prefix like `/api/uploads` for the router. Use prefix `/api/uploads` for the upload endpoint to avoid conflict.
4. Update `frontend/src/lib/driverApi.ts`:
   - Add function:
     ```typescript
     export async function uploadProofImage(file: File): Promise<{ url: string }> {
       const token = localStorage.getItem("gc_access_token");
       const form = new FormData();
       form.append("image", file);
       const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/uploads/proof`, {
         method: "POST",
         headers: { Authorization: `Bearer ${token}` },
         body: form,
       });
       if (!res.ok) throw new Error((await res.json()).detail || "Upload failed");
       return res.json();
     }
     ```
5. Update `frontend/src/views/DriverPage.tsx`:
   - In the mark-collected section/modal, replace proof URL text input with:
     - `<input type="file" accept="image/jpeg,image/png" onChange={...}>`
     - Show image preview using `URL.createObjectURL(file)`
     - On submit: first call `uploadProofImage(file)`, get `url`, then call `markCollected(id, url)`
   - Add loading state for upload
   - Show error toast on upload failure

### Acceptance criteria
- [ ] `POST /api/uploads/proof` accepts image file and returns URL
- [ ] Rejects non-image files with 400
- [ ] Rejects files > 5MB with 400
- [ ] Uploaded images are accessible at `/uploads/<filename>`
- [ ] Driver page shows file picker instead of URL text input
- [ ] Image preview shown before submission
- [ ] Mark-collected flow uploads image then marks collection
- [ ] Proof image URL stored in `collections.proof_url`

### Commands to run
**Backend:**
```bash
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload
# Test upload: curl -X POST http://localhost:8000/api/uploads/proof -H "Authorization: Bearer <token>" -F "image=@test.jpg"
```
**Frontend:**
```bash
cd frontend && npm run dev
```

### Notes / Risks
- `aiofiles` may not be installed – use synchronous file write with `shutil.copyfileobj` or add aiofiles to requirements
- Static mount path conflict: use `/api/uploads` for the POST router and `/uploads` for static serving
- The uploads directory should be in `.gitignore` (except `.gitkeep`)

---

## Task 2: Driver Collection Workflow – Voucher Amount + User Wallet Credit

**Priority:** HIGH | **Depends on:** Task 1 (image upload) | **Estimated files:** 6-8

### Feature Breakdown

**Backend changes:**
- Add `voucher_amount_cents` field to `MarkCollectedRequest` schema (required integer)
- When driver marks collected AND submits voucher amount:
  - Change status to "collected" (already happens)
  - Create `WalletTransaction` for the **user** with `amount_cents = voucher_amount_cents` and `kind = "collection_completed"`
  - Link the transaction via note to collection ID, driver ID, and proof image
- Remove the admin "processed" step auto-credit logic (€5/bag hardcoded) since driver now enters real amount
- OR: keep "processed" as admin approval step but use the driver-entered voucher amount instead of hardcoded value

**Frontend changes:**
- Add numeric voucher amount input (in cents or euros with conversion) to driver mark-collected form
- Clear "Process Collection" action label

**DB changes:**
- Add `voucher_amount_cents` column to `collections` table (nullable integer, for storing the driver-entered amount)
- New Alembic migration

**Business rule decision:**
- Option A: Driver enters amount → wallet credited immediately (no admin approval)
- Option B: Driver enters amount → stored on collection → admin approves "processed" → wallet credited with driver's amount

**Recommended: Option B** (admin approval provides oversight)

### Cursor Prompt

---

### Context
GreenCredits FastAPI + React app. Drivers collect bottles and return them to return points, receiving a voucher. The voucher amount must be entered by the driver and credited to the user's wallet when admin approves.

Currently: driver marks collected (status: assigned→collected), admin marks processed (status: collected→processed) which auto-credits user wallet with hardcoded `bag_count × 500` cents (€5/bag). This must change to use the real voucher amount entered by the driver.

### Scope / Boundaries
- **Must do:**
  - Add `voucher_amount_cents` (nullable Integer) column to `collections` table via new Alembic migration
  - Add `voucher_amount_cents` to `Collection` SQLAlchemy model
  - Update `MarkCollectedRequest` schema to include `voucherAmountCents: int` (required)
  - Update `mark_collected()` service to store `voucher_amount_cents` on the collection
  - Update `admin_transition_status()` in `backend/app/services/collections.py`: when transitioning to "processed", use `collection.voucher_amount_cents` instead of `bag_count × 500` for wallet credit amount
  - Update `Collection` Pydantic response schema to include `voucherAmountCents`
  - Update driver frontend form: add numeric input for voucher amount (in euros, converted to cents)
  - Update driver mark-collected API call to include `voucherAmountCents`
  - Add validation: `voucher_amount_cents` must be > 0 and ≤ 50000 (€500 cap)

- **Must NOT do:**
  - Do not remove the admin "processed" approval step
  - Do not change the collection status state machine
  - Do not modify wallet transaction kinds (keep using `collection_credit`)
  - Do not change the earning per bag for drivers (stays €0.50/bag)
  - Do not change any unrelated endpoints

### Files to inspect first
- `backend/app/models/collection.py` (Collection model)
- `backend/app/schemas.py` (MarkCollectedRequest, Collection response)
- `backend/app/services/drivers.py` (`mark_collected()`)
- `backend/app/services/collections.py` (`admin_transition_status()` – wallet credit logic)
- `backend/app/services/wallet.py` (`credit_wallet_for_collection()`)
- `backend/app/routers/drivers.py` (mark-collected endpoint)
- `frontend/src/views/DriverPage.tsx` (mark-collected form)
- `frontend/src/lib/driverApi.ts` (markCollected API function)

### Implementation steps
1. Create new Alembic migration:
   ```bash
   cd backend
   DATABASE_URL_SYNC=postgresql+psycopg://gc:gc@localhost:5432/greencredits alembic revision --autogenerate -m "add_voucher_amount_to_collections"
   ```
   - Adds `voucher_amount_cents = Column(Integer, nullable=True)` to `collections`
2. Update `backend/app/models/collection.py`:
   - Add `voucher_amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)`
3. Update `backend/app/schemas.py`:
   - `MarkCollectedRequest`: add `voucherAmountCents: int` (required field)
   - `Collection` response: add `voucherAmountCents: Optional[int] = None`
4. Update `backend/app/services/drivers.py` `mark_collected()`:
   - Accept new param `voucher_amount_cents: int`
   - Validate: 0 < voucher_amount_cents ≤ 50000
   - Set `col.voucher_amount_cents = voucher_amount_cents`
5. Update `backend/app/routers/drivers.py` mark-collected endpoint:
   - Pass `body.voucherAmountCents` to `mark_collected()` service
6. Update `backend/app/services/collections.py` `admin_transition_status()`:
   - Replace `amount = col.bag_count * 500` with `amount = col.voucher_amount_cents or 0`
   - Skip wallet credit if `voucher_amount_cents` is None or 0
   - Update note to include voucher amount: `f"Voucher credit for collection #{col.id} (€{amount/100:.2f})"`
7. Update `frontend/src/lib/driverApi.ts`:
   - Update `markCollected()` to accept and send `voucherAmountCents`
8. Update `frontend/src/views/DriverPage.tsx`:
   - Add euro amount input field (type="number", step="0.01", min="0.01", max="500")
   - Convert to cents before API call: `Math.round(euroValue * 100)`
   - Validation: required, positive, max €500
   - Label: "Voucher Total (€)"

### Acceptance criteria
- [ ] New migration adds `voucher_amount_cents` to collections table
- [ ] Driver must enter voucher amount when marking collected
- [ ] Voucher amount stored on collection record
- [ ] Admin "processed" transition credits user wallet with driver-entered amount (not hardcoded)
- [ ] Wallet transaction note references collection and amount
- [ ] API rejects voucher amounts ≤ 0 or > 50000 cents
- [ ] Frontend shows euro input with proper conversion to cents

### Commands to run
**Backend:**
```bash
cd backend
DATABASE_URL_SYNC=postgresql+psycopg://gc:gc@localhost:5432/greencredits alembic revision --autogenerate -m "add_voucher_amount_to_collections"
DATABASE_URL_SYNC=postgresql+psycopg://gc:gc@localhost:5432/greencredits alembic upgrade head
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload
```
**Frontend:**
```bash
cd frontend && npm run dev
```

### Notes / Risks
- Existing collections won't have `voucher_amount_cents` set – the admin transition must handle `None` gracefully (skip credit or use 0)
- If using SQLite dev mode, migration won't auto-run – the model change + nullable column handles it

---

## Task 3: Role-Based Navigation & Access Control

**Priority:** HIGH | **Depends on:** Nothing | **Estimated files:** 5-7

### Feature Breakdown

**Frontend changes:**
- Filter sidebar navigation based on user role (admin, driver, regular user)
- Admin sees: Admin Dashboard, Map (optional)
- Driver sees: Driver Dashboard, Map
- Regular user sees: Wallet, Collections, Claims, Map, Settings
- Remove subscription requirement checks for admin/driver roles

**Backend changes:**
- Update `require_active_subscription` dependency to skip check for admin/driver users
- Or: don't apply subscription check to admin/driver routes (already done via separate guards)

### Cursor Prompt

---

### Context
GreenCredits React + FastAPI app with 3 user roles: regular user (`is_admin=false, is_driver=false`), admin (`is_admin=true`), driver (`is_driver=true`). Currently all roles see the same sidebar navigation (Wallet, Claims, Collections, Map, Settings, Admin, Driver). Admin and driver should NOT see user-specific pages like Wallet, Claims, Subscriptions, Collections.

Frontend uses React Router v7 with `AppLayout` component containing the sidebar. Auth state from `AuthContext` includes `isAdmin` and `isDriver` flags on the user object.

### Scope / Boundaries
- **Must do:**
  - Update `frontend/src/ui/AppLayout.tsx` sidebar to filter nav items by role:
    - **Admin**: only "Admin Dashboard" and "Map" links
    - **Driver**: only "Driver Dashboard" and "Map" links
    - **Regular user**: "Wallet", "Collections", "Claims", "Map", "Settings" (NO Admin or Driver links)
  - Update route guards: admin/driver routes should NOT require active subscription
  - Check `backend/app/dependencies/auth.py` `require_active_subscription` – ensure it's only applied to user-facing collection creation, NOT to admin/driver endpoints
  - Update `frontend/src/ui/RouteGuard.tsx` if it checks subscription for all authenticated routes
  - Ensure admin/driver can access the app without a subscription (no redirect to subscribe page)

- **Must NOT do:**
  - Do not remove any routes from `routes.tsx` (keep them registered, just hide nav links)
  - Do not change the auth flow or token structure
  - Do not modify the admin or driver page components themselves
  - Do not change backend endpoint auth decorators (they already use separate `require_admin`/`require_driver`)

### Files to inspect first
- `frontend/src/ui/AppLayout.tsx` (sidebar navigation)
- `frontend/src/ui/RouteGuard.tsx` (auth guard, subscription check)
- `frontend/src/context/AuthContext.tsx` (user state with isAdmin, isDriver)
- `frontend/src/routes.tsx` (route definitions)
- `frontend/src/types/api.ts` (User type definition)
- `backend/app/dependencies/auth.py` (`require_active_subscription`)
- `backend/app/routers/collections.py` (where subscription check is applied)

### Implementation steps
1. Read `frontend/src/ui/AppLayout.tsx` and identify the navigation items array/list
2. Get the current user from `AuthContext` (or `useAuth()` hook)
3. Define role-based nav items:
   ```typescript
   const adminNavItems = [
     { label: "Admin Dashboard", path: "/admin", icon: ShieldIcon },
     { label: "Map", path: "/map", icon: MapIcon },
   ];
   const driverNavItems = [
     { label: "Driver Dashboard", path: "/driver", icon: TruckIcon },
     { label: "Map", path: "/map", icon: MapIcon },
   ];
   const userNavItems = [
     { label: "Wallet", path: "/wallet", icon: WalletIcon },
     { label: "Collections", path: "/collections", icon: RecycleIcon },
     { label: "Claims", path: "/claims", icon: FileTextIcon },
     { label: "Map", path: "/map", icon: MapIcon },
     { label: "Settings", path: "/settings", icon: SettingsIcon },
   ];
   ```
4. Select nav items based on role:
   ```typescript
   const navItems = user?.isAdmin ? adminNavItems : user?.isDriver ? driverNavItems : userNavItems;
   ```
5. Update `RouteGuard.tsx`: if user is admin or driver, skip subscription check / redirect
6. Verify `backend/app/routers/collections.py` – the `require_active_subscription` dependency should only be on `POST /collections` (collection creation), not on other routes. Confirm this is already the case.

### Acceptance criteria
- [ ] Admin user sees only "Admin Dashboard" and "Map" in sidebar
- [ ] Driver user sees only "Driver Dashboard" and "Map" in sidebar
- [ ] Regular user sees "Wallet", "Collections", "Claims", "Map", "Settings"
- [ ] Admin can log in and access app without subscription
- [ ] Driver can log in and access app without subscription
- [ ] Direct URL access to restricted pages still works (route guards handle auth, not nav hiding)
- [ ] No backend changes needed if subscription check is already scoped correctly

### Commands to run
**Frontend:**
```bash
cd frontend && npm run dev
# Test: log in as admin, driver, and regular user – verify sidebar
```
**Backend:**
```bash
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload
```

### Notes / Risks
- Check if AppLayout uses Lucide icons or another icon set to match existing style
- The route definitions in `routes.tsx` should NOT be changed – we're only hiding nav links, not removing route access
- If a user is both admin and driver (unlikely but possible), admin takes priority

---

## Task 4: Admin Dashboard – Recurring Schedules & Financial Metrics

**Priority:** HIGH | **Depends on:** Task 2 (voucher amount) | **Estimated files:** 4-6

### Feature Breakdown

**Backend changes:**
- Extend `GET /admin/metrics` to include:
  - `total_recurring_schedules`: count of active CollectionSlots
  - `total_subscription_revenue_cents`: sum based on active subscriptions × plan price
  - `total_driver_earnings_cents`: sum of all DriverEarning.amount_cents
  - `total_driver_payouts_cents`: sum of all DriverPayout.amount_cents
- Fix `total_voucher_value_cents`: sum from real `collections.voucher_amount_cents` where status = "processed" (not from vouchers table)

**Frontend changes:**
- Display new metrics cards in AdminPage
- Add recurring schedules section/summary

### Cursor Prompt

---

### Context
GreenCredits FastAPI + React admin dashboard. The `GET /admin/metrics` endpoint currently returns: `total_users`, `active_subscriptions`, `total_collections`, `total_voucher_value_cents`. The voucher value is computed from the `vouchers` table which contains demo data. We need accurate financial metrics.

Subscription plans: weekly (€4.99), monthly (€14.99), yearly (€149.99) – these are business prices, but for MVP calculate revenue as: count of active subscriptions per plan × plan price.

### Scope / Boundaries
- **Must do:**
  - Update `GET /admin/metrics` endpoint in `backend/app/routers/admin.py` to add:
    - `totalRecurringSchedules`: `SELECT COUNT(*) FROM collection_slots`
    - `totalSubscriptionRevenueCents`: sum of active subscription revenue (count per plan × price in cents: weekly=499, monthly=1499, yearly=14999)
    - `totalDriverEarningsCents`: `SELECT COALESCE(SUM(amount_cents), 0) FROM driver_earnings`
    - `totalDriverPayoutsCents`: `SELECT COALESCE(SUM(amount_cents), 0) FROM driver_payouts`
    - `availablePayoutBalanceCents`: totalSubscriptionRevenueCents - totalDriverPayoutsCents (simplistic model)
  - Fix `totalVoucherValueCents`: compute from `SUM(collections.voucher_amount_cents) WHERE status = 'processed'` instead of vouchers table
  - Update `frontend/src/views/AdminPage.tsx` to display all new metrics as cards
  - Add a "Recurring Schedules" summary section showing count and breakdown by frequency

- **Must NOT do:**
  - Do not change the admin page tab structure
  - Do not modify other admin endpoints
  - Do not add new DB tables or migrations
  - Do not change the subscription model

### Files to inspect first
- `backend/app/routers/admin.py` (`get_metrics()` endpoint)
- `backend/app/models/collection_slot.py` (CollectionSlot model)
- `backend/app/models/driver_earning.py` (DriverEarning model)
- `backend/app/models/driver_payout.py` (DriverPayout model)
- `backend/app/models/subscription.py` (Subscription model)
- `backend/app/models/collection.py` (Collection model – voucher_amount_cents)
- `frontend/src/views/AdminPage.tsx` (admin dashboard UI)
- `frontend/src/lib/adminApi.ts` (admin API functions)

### Implementation steps
1. Update `backend/app/routers/admin.py` `get_metrics()`:
   ```python
   # Recurring schedules
   total_recurring = await session.scalar(
       select(func.count(CollectionSlot.id))
   )

   # Driver totals
   total_driver_earnings = await session.scalar(
       select(func.coalesce(func.sum(DriverEarning.amount_cents), 0))
   )
   total_driver_payouts = await session.scalar(
       select(func.coalesce(func.sum(DriverPayout.amount_cents), 0))
   )

   # Subscription revenue (count per plan × price)
   PLAN_PRICES = {"weekly": 499, "monthly": 1499, "yearly": 14999}
   revenue = 0
   for plan, price in PLAN_PRICES.items():
       count = await session.scalar(
           select(func.count(Subscription.id))
           .where(Subscription.status == "active", Subscription.plan_code == plan)
       )
       revenue += (count or 0) * price

   # Fix voucher total: use collections.voucher_amount_cents
   total_voucher = await session.scalar(
       select(func.coalesce(func.sum(Collection.voucher_amount_cents), 0))
       .where(Collection.status == "processed")
   )
   ```
2. Return all new fields in the metrics response dict
3. Update `frontend/src/lib/adminApi.ts` types to include new metric fields
4. Update `frontend/src/views/AdminPage.tsx`:
   - Add metric cards for: Subscription Revenue, Recurring Schedules, Driver Earnings, Driver Payouts, Available Payout Balance
   - Fix Voucher Value card to use corrected value
   - Format all monetary values as euros (÷100, 2 decimal places)

### Acceptance criteria
- [ ] `/admin/metrics` returns `totalRecurringSchedules`
- [ ] `/admin/metrics` returns `totalSubscriptionRevenueCents` based on active plans
- [ ] `/admin/metrics` returns `totalDriverEarningsCents` and `totalDriverPayoutsCents`
- [ ] `/admin/metrics` returns `availablePayoutBalanceCents`
- [ ] `totalVoucherValueCents` is computed from real collection data (not vouchers table)
- [ ] Admin dashboard displays all new metrics as formatted cards
- [ ] All monetary values displayed as euros with 2 decimal places

### Commands to run
**Backend:**
```bash
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload
# Test: curl -H "Authorization: Bearer <admin_token>" http://localhost:8000/admin/metrics
```
**Frontend:**
```bash
cd frontend && npm run dev
```

### Notes / Risks
- `Collection.voucher_amount_cents` may be None for old collections – use COALESCE
- Subscription revenue is a simplistic calculation (count × price per period); real revenue tracking would need payment records
- Import all required models at the top of the admin router

---

## Task 5: Leaflet Map Integration

**Priority:** MEDIUM | **Depends on:** Nothing | **Estimated files:** 3-5

### Feature Breakdown

**Frontend changes:**
- Add Leaflet map to MapPage showing all return points as markers
- Each marker popup shows: name, address/eircode, type, "Open in Google Maps" button
- Keep existing list view below or as toggle
- Use `react-leaflet` (check if already installed) + OpenStreetMap tiles

### Cursor Prompt

---

### Context
GreenCredits React app has a MapPage at `frontend/src/views/MapPage.tsx` that currently shows return points as a list with "Open in Google Maps" links. The app already has `leaflet` and `react-leaflet` listed as dependencies. There may be an existing `ReturnPointsMap` component at `frontend/src/components/ReturnPointsMap.tsx`.

Return points have: `id`, `name`, `type`, `eircode`, `retailer`, `lat`, `lng`.

### Scope / Boundaries
- **Must do:**
  - Add a Leaflet map at the top of MapPage showing all return points as markers
  - Center map on Ireland (approx lat: 53.35, lng: -6.26 for Dublin area)
  - Use OpenStreetMap tile layer (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
  - Each marker shows popup with: name, type (RVM / Manual / bottle_bank / supermarket), eircode
  - Popup includes "Open in Google Maps" button/link (existing logic: `https://www.google.com/maps?q={lat},{lng}`)
  - Import Leaflet CSS (`import "leaflet/dist/leaflet.css"`)
  - Fix default marker icon issue (Leaflet + bundler icon path fix)
  - Keep existing list view below the map
  - Map height: ~400px, responsive width

- **Must NOT do:**
  - Do not add new npm packages (leaflet + react-leaflet should already be installed)
  - Do not change the return points API
  - Do not modify other pages
  - Do not add clustering (keep it simple for MVP)

### Files to inspect first
- `frontend/src/views/MapPage.tsx` (current list-only implementation)
- `frontend/src/components/ReturnPointsMap.tsx` (may exist already)
- `frontend/src/hooks/useReturnPoints.ts` (data fetching hook)
- `frontend/src/types/api.ts` (ReturnPoint type)
- `frontend/package.json` (verify leaflet/react-leaflet installed)

### Implementation steps
1. Verify `leaflet` and `react-leaflet` are in `package.json`. If not: `npm install leaflet react-leaflet @types/leaflet`
2. In `MapPage.tsx` (or a new `ReturnPointsMap` component):
   - Import: `import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"`
   - Import: `import "leaflet/dist/leaflet.css"`
   - Fix Leaflet default icon:
     ```typescript
     import L from "leaflet";
     import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
     import markerIcon from "leaflet/dist/images/marker-icon.png";
     import markerShadow from "leaflet/dist/images/marker-shadow.png";
     delete (L.Icon.Default.prototype as any)._getIconUrl;
     L.Icon.Default.mergeOptions({
       iconRetinaUrl: markerIcon2x,
       iconUrl: markerIcon,
       shadowUrl: markerShadow,
     });
     ```
3. Render map:
   ```tsx
   <MapContainer center={[53.35, -6.26]} zoom={11} style={{ height: "400px", width: "100%" }}>
     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
     {returnPoints.map(rp => (
       <Marker key={rp.id} position={[rp.lat, rp.lng]}>
         <Popup>
           <strong>{rp.name}</strong><br/>
           Type: {rp.type}<br/>
           {rp.eircode && <>Eircode: {rp.eircode}<br/></>}
           <a href={`https://www.google.com/maps?q=${rp.lat},${rp.lng}`} target="_blank">Open in Google Maps</a>
         </Popup>
       </Marker>
     ))}
   </MapContainer>
   ```
4. Keep existing list view below the map

### Acceptance criteria
- [ ] Leaflet map renders on MapPage with OpenStreetMap tiles
- [ ] All return points shown as markers on the map
- [ ] Clicking marker shows popup with name, type, eircode
- [ ] Popup has "Open in Google Maps" link
- [ ] Map centered on Dublin/Ireland area
- [ ] List view still visible below map
- [ ] No console errors related to Leaflet icons
- [ ] Map is responsive (full width, 400px height)

### Commands to run
**Frontend:**
```bash
cd frontend && npm run dev
# Navigate to /map page
```

### Notes / Risks
- Leaflet icon fix is essential – without it, markers show broken images
- If `react-leaflet` is not installed, it needs to be added
- Tailwind may conflict with Leaflet CSS – ensure Leaflet CSS is imported

---

## Task 6: Expand Return Points Dataset

**Priority:** MEDIUM | **Depends on:** Nothing | **Estimated files:** 1-2

### Feature Breakdown

**Backend changes:**
- Add more return points to the seed data (currently 3)
- Add 15-20 real Dublin/Ireland return points with realistic coordinates
- Update seed service to insert them on startup (idempotent)

### Cursor Prompt

---

### Context
GreenCredits backend seeds 3 return points on startup. We need a more realistic dataset for the MVP demo. The seed logic is in `backend/app/services/seed.py` (or return_points service). Return points are stored in the `return_points` table with: `external_id` (unique), `name`, `type`, `eircode`, `retailer`, `lat`, `lng`.

### Scope / Boundaries
- **Must do:**
  - Add 15-20 return points to the seed data, representing realistic Dublin/Ireland locations
  - Include a mix of types: "supermarket" (Tesco, Dunnes, Lidl, Aldi), "bottle_bank", "recycling_centre"
  - Use real Dublin-area coordinates (lat ~53.2-53.4, lng ~-6.1 to -6.4)
  - Use realistic eircodes (e.g., D01, D02, D04, D06, D08, etc.)
  - Seed must be idempotent (skip if `external_id` already exists)
  - Run on app startup

- **Must NOT do:**
  - Do not modify the ReturnPoint model or schema
  - Do not add new migrations
  - Do not change the return points API endpoint

### Files to inspect first
- `backend/app/services/seed.py` (current seed logic)
- `backend/app/services/return_points.py` (may have seed function)
- `backend/app/models/return_point.py` (ReturnPoint model)
- `backend/app/main.py` (startup events)

### Implementation steps
1. Find where return points are currently seeded (check `seed.py` and `main.py` startup)
2. Create or update a `seed_return_points()` function with ~18 return points:
   ```python
   RETURN_POINTS = [
       {"external_id": "rp_tesco_baggot", "name": "Tesco Baggot Street", "type": "supermarket", "retailer": "Tesco", "eircode": "D04 V2N9", "lat": 53.3345, "lng": -6.2428},
       {"external_id": "rp_dunnes_stephens", "name": "Dunnes Stores St Stephen's Green", "type": "supermarket", "retailer": "Dunnes", "eircode": "D02 XY88", "lat": 53.3398, "lng": -6.2614},
       {"external_id": "rp_lidl_rathmines", "name": "Lidl Rathmines", "type": "supermarket", "retailer": "Lidl", "eircode": "D06 E8N2", "lat": 53.3228, "lng": -6.2672},
       {"external_id": "rp_aldi_phibsboro", "name": "Aldi Phibsborough", "type": "supermarket", "retailer": "Aldi", "eircode": "D07 N8K1", "lat": 53.3592, "lng": -6.2728},
       {"external_id": "rp_bb_sandymount", "name": "Sandymount Bottle Bank", "type": "bottle_bank", "retailer": None, "eircode": "D04 P2X6", "lat": 53.3283, "lng": -6.2183},
       # ... 13 more entries
       {"external_id": "rp_tesco_clearwater", "name": "Tesco Clearwater", "type": "supermarket", "retailer": "Tesco", "eircode": "D15 YR62", "lat": 53.3882, "lng": -6.3675},
       {"external_id": "rp_rc_ringsend", "name": "Ringsend Recycling Centre", "type": "recycling_centre", "retailer": None, "eircode": "D04 R2C8", "lat": 53.3395, "lng": -6.2222},
       {"external_id": "rp_supervalu_dalkey", "name": "SuperValu Dalkey", "type": "supermarket", "retailer": "SuperValu", "eircode": "A96 T2F8", "lat": 53.2773, "lng": -6.1004},
   ]
   ```
3. Insert each point, skipping if `external_id` already exists
4. Call from `main.py` startup (after existing seed calls)

### Acceptance criteria
- [ ] 15+ return points in database after startup
- [ ] Mix of supermarket, bottle_bank, recycling_centre types
- [ ] All within Dublin/Ireland area
- [ ] Idempotent: re-running seed doesn't create duplicates
- [ ] Return points visible on map and in list

### Commands to run
```bash
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload
# Verify: curl http://localhost:8000/return-points
```

### Notes / Risks
- Use realistic but not necessarily exact real-world coordinates
- Ensure external_ids are unique and descriptive

---

## Task 7: Remove Demo Wallet Data + Collection Status in User Wallet

**Priority:** HIGH | **Depends on:** Task 2 | **Estimated files:** 4-5

### Feature Breakdown

**Backend changes:**
- Remove `seed_demo_wallet_transactions()` call from app startup
- Remove or keep the function but don't call it
- Wallet should only show real transactions from processed collections

**Frontend changes:**
- Ensure wallet page displays collection status info with each transaction
- Link transactions to collection details (show collection ID, status, proof image if available)
- User can see collection status progression

### Cursor Prompt

---

### Context
GreenCredits seeds 3 demo wallet transactions per user on startup (`[DEMO]` prefix). These show fake data. After Task 2 (voucher amount), wallet transactions are created from real processed collections. Demo data must be removed.

The user also needs to see the status of their collections linked to wallet transactions.

### Scope / Boundaries
- **Must do:**
  - Remove the `seed_demo_wallet_transactions()` call from `backend/app/main.py` startup
  - Keep the function in `seed.py` but comment out / don't call it (for reference)
  - Update `frontend/src/views/WalletPage.tsx`: display collection status next to each transaction
  - In wallet transaction display, if `kind` is `collection_credit` or `collection_completed`, extract collection ID from note and show status
  - Alternatively: enhance wallet history endpoint to include collection details
  - Update `GET /wallet/history` response to optionally include `collectionId` parsed from note
  - Display proof image thumbnail if available (linked via collection)

- **Must NOT do:**
  - Do not delete existing wallet transactions from DB (users may have real ones)
  - Do not change the wallet balance computation
  - Do not modify the WalletTransaction model (no migration needed)
  - Do not change the wallet balance endpoint

### Files to inspect first
- `backend/app/main.py` (startup seed call)
- `backend/app/services/seed.py` (`seed_demo_wallet_transactions()`)
- `backend/app/routers/wallet.py` (history endpoint)
- `backend/app/services/wallet.py` (`get_history()`)
- `frontend/src/views/WalletPage.tsx` (wallet UI)
- `frontend/src/hooks/useWallet.ts` (wallet data hook)
- `frontend/src/types/api.ts` (Transaction type)

### Implementation steps
1. In `backend/app/main.py`: find and remove/comment out the line calling `seed_demo_wallet_transactions()`
2. In `backend/app/services/seed.py`: add a comment `# Demo seeding disabled – wallet shows real transactions only`
3. Update `backend/app/routers/wallet.py` GET `/history`:
   - For each transaction with kind `collection_credit`, parse collection ID from note (pattern: `"collection #(\d+)"`)
   - Optionally query collection status and proof_url
   - Add `collectionId`, `collectionStatus`, `proofUrl` fields to the transaction response
4. Update `frontend/src/types/api.ts` Transaction type:
   - Add optional fields: `collectionId?: number`, `collectionStatus?: string`, `proofUrl?: string`
5. Update `frontend/src/views/WalletPage.tsx`:
   - For collection-related transactions, show status badge (scheduled/assigned/collected/processed)
   - If `proofUrl` exists, show small clickable thumbnail
   - Show collection ID as reference

### Acceptance criteria
- [ ] No demo transactions created on app startup
- [ ] Wallet only shows real transactions
- [ ] Collection-related transactions show collection status
- [ ] Proof image thumbnail shown when available
- [ ] Existing real transactions unaffected
- [ ] Empty wallet shows appropriate "No transactions yet" message

### Commands to run
**Backend:**
```bash
# Delete dev.db to start fresh without demo data:
del backend\dev.db
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload
```
**Frontend:**
```bash
cd frontend && npm run dev
```

### Notes / Risks
- If the note format changes in Task 2, the parsing regex must match
- Collections table JOIN may impact performance for users with many transactions – consider lazy loading
- The wallet page should gracefully handle transactions without collection links

---

## Task 8: Driver Availability Toggle UI

**Priority:** MEDIUM | **Depends on:** Task 3 (role-based nav) | **Estimated files:** 3-4

### Feature Breakdown

**Frontend changes:**
- Add availability toggle switch to Driver Dashboard
- Show current status (Available / Not Available)
- Call `PATCH /drivers/me/profile` with `isAvailable` on toggle

**Backend changes:**
- None (endpoint already exists)

**Admin visibility:**
- Show driver availability status in admin driver list

### Cursor Prompt

---

### Context
GreenCredits driver dashboard at `frontend/src/views/DriverPage.tsx`. The `Driver` model has `is_available` (boolean, default true). The `PATCH /drivers/me/profile` endpoint accepts `isAvailable` in the body. The admin `GET /admin/drivers` returns driver profiles with `isAvailable`.

### Scope / Boundaries
- **Must do:**
  - Add a prominent toggle switch at the top of the Driver Dashboard showing "Available" / "Not Available"
  - Toggle calls `PATCH /drivers/me/profile` with `{ isAvailable: true/false }`
  - Show visual indicator: green for available, red/gray for unavailable
  - Update `frontend/src/views/AdminPage.tsx` drivers tab: show availability status badge next to each driver
  - Show green dot/badge for available, gray/red for unavailable

- **Must NOT do:**
  - Do not add filtering logic for collection assignment (future task)
  - Do not change the driver model or backend API
  - Do not modify other pages

### Files to inspect first
- `frontend/src/views/DriverPage.tsx` (driver dashboard)
- `frontend/src/lib/driverApi.ts` (updateProfile function)
- `frontend/src/views/AdminPage.tsx` (admin drivers tab)
- `frontend/src/lib/adminApi.ts` (listDrivers function)

### Implementation steps
1. In `DriverPage.tsx`, at the top of the dashboard (above collections list):
   - Add a toggle component:
     ```tsx
     <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
       <span className={`w-3 h-3 rounded-full ${isAvailable ? "bg-green-500" : "bg-gray-400"}`} />
       <span className="font-medium">{isAvailable ? "Available" : "Not Available"}</span>
       <button
         onClick={() => toggleAvailability()}
         className={`ml-auto relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAvailable ? "bg-green-500" : "bg-gray-300"}`}
       >
         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAvailable ? "translate-x-6" : "translate-x-1"}`} />
       </button>
     </div>
     ```
   - `toggleAvailability` calls `updateProfile({ isAvailable: !isAvailable })` and invalidates profile query
2. In `AdminPage.tsx` drivers list:
   - Add status badge next to driver name:
     ```tsx
     <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${driver.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
       {driver.isAvailable ? "Available" : "Unavailable"}
     </span>
     ```

### Acceptance criteria
- [ ] Driver dashboard shows availability toggle at the top
- [ ] Toggle switches between Available/Not Available
- [ ] API call updates driver profile on toggle
- [ ] Visual indicator (green/gray) reflects status
- [ ] Admin drivers list shows availability status per driver
- [ ] Toggle state persists after page refresh

### Commands to run
```bash
cd frontend && npm run dev
```

### Notes / Risks
- Use the existing `updateProfile` API function from `driverApi.ts`
- Ensure optimistic update or loading state during toggle

---

## Task 9: Driver Earnings per Collection (€0.50 per completed deposit)

**Priority:** LOW | **Depends on:** Nothing | **Estimated files:** 0-1

### Assessment
**This is already implemented correctly.** The `EARNING_PER_BAG_CENTS = 50` constant in `backend/app/services/driver_payouts.py` already creates a €0.50 earning per bag when a driver marks a collection as collected. The `create_earning()` function calculates `amount = bag_count * EARNING_PER_BAG_CENTS`.

**No changes needed.** This task is included for documentation completeness.

---

## Task Summary & Dependency Graph

```
Task 1: Image Upload ──────────────┐
                                    ├──→ Task 2: Voucher Amount + Wallet Credit ──→ Task 4: Admin Metrics
                                    │                                              Task 7: Remove Demo Data
Task 3: Role-Based Nav ────────────→ Task 8: Driver Availability Toggle
Task 5: Leaflet Map (independent)
Task 6: Return Points Seed (independent)
Task 9: Already done (no work)
```

### Recommended Execution Order
1. **Task 1** – Image Upload (unblocks Task 2)
2. **Task 3** – Role-Based Nav (independent, quick win)
3. **Task 5** – Leaflet Map (independent, can parallel with 1-3)
4. **Task 6** – Return Points Seed (independent, quick, can parallel)
5. **Task 2** – Voucher Amount + Wallet Credit (after Task 1)
6. **Task 7** – Remove Demo Data (after Task 2)
7. **Task 4** – Admin Financial Metrics (after Task 2)
8. **Task 8** – Driver Availability Toggle (after Task 3)

### Parallelization
- **Parallel batch 1:** Tasks 1, 3, 5, 6
- **Parallel batch 2:** Tasks 2, 8
- **Parallel batch 3:** Tasks 4, 7
