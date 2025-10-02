# GreenCredits – Requirements

## Problem Statement
Participating in the Deposit Return Scheme (DRS) is inconvenient when users must store bottles and travel to a return machine, which can be busy or out of service. People would rather have bottles collected at home on a predictable schedule, while still receiving credits or donating the value.

The solution is a subscription-based web platform where users pay a monthly fee for weekly bottle collection. Users pick a preferred weekly slot and a return point (e.g., Tesco, Lidl). After collection, our team redeems bottles at that return point; the voucher value is credited to the user’s wallet with proof attached, or donated with confirmation.

Payments (e.g., Stripe) and voucher scanning are simulated in the MVP.

---

## MVP User Stories

### Recycler (End-User)
1. **Register & Login**  
   As a user, I can create an account and sign in.

2. **Manage Subscription**  
   As a user, I can activate/cancel a monthly subscription (simulated payment) and see current status.

3. **Set Weekly Collection Slot Preference**  
   As a user, I can select a weekday and time window and an optional preferred return point.

4. **Book Collections (Pickups)**  
   As a user, I can request/see scheduled pickups and cancel if still scheduled.

5. **Choose Return Point Per Booking**  
   As a user, I can select a store location for voucher redemption.

6. **Wallet & Donation**  
   As a user, I can see wallet balance and history. After processing, value is credited to my wallet or donated (with proof).

### Admin
7. **Manage Return Points**  
   As an admin, I can manage return points and their active status.

8. **Manage Collections Lifecycle**  
   As an admin, I can transition collections from scheduled → collected → processed.

9. **Record Vouchers**  
   As an admin, I can create vouchers for processed collections which credit wallets or mark donations.

10. **Manage Subscriptions**  
   As an admin, I can view and manage user subscription statuses.

---

## API (MVP)

### Public/Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET  /healthz`

### Subscriptions
- `GET  /subscriptions/me` → returns current status `{status, plan_code, start_date, end_date}`
- `POST /subscriptions/activate` → (MVP: mock/flag) activate monthly plan
- `POST /subscriptions/cancel` → set status `canceled`

### Return Points
- `GET  /return-points?chain=&q=&near=lat,lng` → list and filter
- `GET  /return-points/{id}`

### Collection Slots (preference)
- `GET  /collection-slots/me`
- `PUT  /collection-slots/me` → upsert `{weekday, start_time, end_time, preferred_return_point_id}`

### Collections (bookings)
- `POST /collections` → `{scheduled_at, return_point_id, bag_count?, notes?}`
- `GET  /collections/me?status=&page=&pageSize=`
- `GET  /collections/{id}`
- `PATCH /collections/{id}/cancel`   → only if `scheduled`
- (Admin) `PATCH /collections/{id}/status` → transition: scheduled→collected→processed

### Vouchers & Wallet
- (Admin) `POST /vouchers` → `{collection_id, amount_cents, store_chain, voucher_code?, proof_url?, donated}`
  - Side-effect: create a `wallet_transactions` entry if `donated=false`
- `GET /wallet/balance`
- `GET /wallet/history?page=&pageSize=`

Error format: `{code, message, details?}`

---

## Database Schema (PostgreSQL)

### 1) users
- id (uuid, pk, default gen_random_uuid())
- email (varchar(255), unique, not null)
- password_hash (varchar(255), not null)
- full_name (varchar(255))
- role (varchar(20), default 'user')  -- enum-like: user | admin | collector
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

Indexes: `idx_users_email (unique)`

---

### 2) return_points
Represents the DRS machines / return locations (e.g., Tesco, Lidl) the user can choose for voucher redemption.

- id (uuid, pk)
- name (varchar(120), not null)           -- e.g. "Tesco Rathmines"
- chain (varchar(60))                      -- e.g. "Tesco", "Lidl", "SuperValu"
- address (varchar(255))
- lat (decimal(9,6))                       -- latitude
- lng (decimal(9,6))                       -- longitude
- is_active (boolean, default true)
- created_at (timestamptz, default now())

Indexes: `idx_return_points_chain`, `idx_return_points_geo (lat, lng)`

---

### 3) subscriptions
Tracks whether a user is subscribed (MVP can simulate "active").

- id (uuid, pk)
- user_id (uuid, fk -> users.id, not null)
- plan_code (varchar(50), default 'monthly_basic')   -- future-proofing
- status (varchar(20), not null)                     -- 'active' | 'inactive' | 'canceled'
- start_date (date, not null)
- end_date (date)                                    -- nullable for active
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

Indexes: `idx_subscriptions_user`, `idx_subscriptions_status`

---

### 4) collection_slots
User’s preferred standing weekly slot (e.g., every Wednesday 18:00–20:00).

- id (uuid, pk)
- user_id (uuid, fk -> users.id, not null)
- weekday (smallint, not null)          -- 0=Mon ... 6=Sun
- start_time (time, not null)           -- e.g. 18:00:00
- end_time (time, not null)
- preferred_return_point_id (uuid, fk -> return_points.id)  -- default for bookings
- is_active (boolean, default true)
- created_at (timestamptz, default now())

Indexes: `idx_collection_slots_user`, `idx_collection_slots_active`

Note: this table stores the preference. Actual bookings live in `collections`.

---

### 5) collections (aka bookings / pickup orders)
Each scheduled pickup request.

- id (uuid, pk)
- user_id (uuid, fk -> users.id, not null)
- scheduled_at (timestamptz, not null)        -- actual date+time of pickup
- return_point_id (uuid, fk -> return_points.id, not null)
- status (varchar(20), not null)               -- 'scheduled' | 'collected' | 'processed' | 'canceled'
- bag_count (integer, default 1)               -- optional estimation
- notes (text)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

Indexes: `idx_collections_user`, `idx_collections_return_point`, `idx_collections_status`, `idx_collections_scheduled_at`

---

### 6) vouchers
Represents the redemption proof from the machine/store.

- id (uuid, pk)
- collection_id (uuid, fk -> collections.id, not null, unique)  -- one voucher per collection (simplify MVP)
- store_chain (varchar(60))           -- copy from return_points.chain for redundancy
- store_name (varchar(120))           -- human label
- amount_cents (integer, not null)    -- integer cents to avoid floating-point
- voucher_code (varchar(120))         -- optional code or reference
- proof_url (varchar(500))            -- optional image/pdf link (if uploaded)
- donated (boolean, default false)    -- whether user chose donation
- processed_at (timestamptz)          -- when voucher credited/donated
- created_at (timestamptz, default now())

Indexes: `idx_vouchers_collection (unique)`, `idx_vouchers_store_chain`

---

### 7) wallet_transactions
Ledger of user’s credits (from vouchers or adjustments) and optional donations.

- id (uuid, pk)
- user_id (uuid, fk -> users.id, not null)
- collection_id (uuid, fk -> collections.id)   -- nullable if manual adjustment
- type (varchar(20), not null)                 -- 'credit' | 'debit' | 'donation'
- amount_cents (integer, not null)             -- positive integer; debits represented with negative amount or via type semantics
- currency (varchar(3), default 'EUR')
- metadata (jsonb)                              -- {store_chain: 'Tesco', voucher_code: '...'}
- created_at (timestamptz, default now())

Indexes: `idx_wallet_user`, `idx_wallet_type`, `idx_wallet_created_at`

Wallet balance can be computed as SUM(amount_cents) per user.

---

## Relationships Summary (ERD ASCII)

users (1) ──< subscriptions (N)
     │
     └──< collection_slots (N)
     │
     └──< collections (N) ──< vouchers (1)
                           └──< wallet_transactions (N)

return_points (1) ──< collections (N)

collections.user_id → users.id  
collections.return_point_id → return_points.id  
vouchers.collection_id → collections.id (unique, 1–1)  
wallet_transactions.user_id → users.id

---

## Alembic Migrations (notes)
- Create new revisions for `subscriptions`, `collection_slots`, `collections`, `vouchers`, `wallet_transactions`.
- Backfill `return_points` with a small seed (2–3 Tesco/Lidl).
- Ensure idempotent seed for demo user(s).

---

## MSW (mocks) adjustments (frontend dev only)
- Add handlers for:
  - `/subscriptions/*` (active/inactive toggle)
  - `/collection-slots/me` (GET/PUT)
  - `/collections` CRUD + status transitions
  - `/vouchers` (admin-create) side-effecting `/wallet/*`
- Update existing:
  - `/wallet/balance`, `/wallet/history`
  - `/return-points`

Return realistic sample payloads matching the OpenAPI.

---

## Non-Functional Goals

- **Security**  
  - JWT auth (access + refresh tokens).  
  - Role-based access control (User, Admin).  
  - Strong input validation and rate limiting.  

- **Privacy & Compliance**  
  - Store minimal personal data.  
  - GDPR compliance: allow export/delete of account data.  

- **Reliability & Availability**  
  - Target uptime ≥ 99% (Railway).  
  - Health check endpoint `/healthz`.  
  - Graceful timeouts and error handling.  

- **Performance**  
  - p95 < 300 ms for simple GET requests.  
  - Indexed queries and paginated lists.  

- **Scalability**  
  - Backend and frontend containerized separately.  

- **Observability**  
  - Structured JSON logs with request IDs.  
  - Optional Sentry/metrics (future).  

- **Maintainability**  
  - OpenAPI contract–first development.  
  - Clear module boundaries, typed models (Pydantic).  
  - ADRs for recording key architecture decisions.  

- **Testability**  
  - Backend: pytest unit + integration tests with DB containers.  
  - Frontend: MSW + component tests, a few E2E smoke tests.  

- **Accessibility**  
  - WCAG AA: keyboard navigation, alt text, contrast compliance.  

- **CI/CD**  
  - GitHub Actions: lint, test, build on every PR.  
  - Auto-deploy to Railway on merge to `main`.  


