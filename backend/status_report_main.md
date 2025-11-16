## Backend Status Report (main)

### Features vs Goals Matrix
- **JWT auth, /me**: Partially
  - Routers: `backend/app/routers/auth.py` (mock register/login), auth deps mock `backend/app/dependencies/auth.py`.
  - Missing real JWT issuance/verification; no `/me` endpoint on auth.
- **Subscription management**: Implemented
  - Routers: `backend/app/routers/subscriptions.py` (`/me`, `/activate`, `/cancel`)
  - Services: `backend/app/services/subscriptions.py`
  - Model: `backend/app/models/subscription.py`
- **Collections booking & preferences**: Implemented
  - Routers: `backend/app/routers/collection_slots.py` (GET/PUT `/me`), `backend/app/routers/collections.py` (POST `/`, GET `/me`, PATCH `/{id}/cancel`)
  - Services: `backend/app/services/collection_slots.py` (referenced), `backend/app/services/collections.py`
  - Models: `backend/app/models/collection_slot.py`, `backend/app/models/collection.py`
- **Return points directory/selection**: Implemented
  - Router: `backend/app/routers/return_points.py` (GET list)
  - Service: `backend/app/services/return_points.py`
  - Model: `backend/app/models/return_point.py`
- **Wallet ledger (computed)**: Implemented
  - Router: `backend/app/routers/wallet.py` (GET `/balance`, `/history`)
  - Service: `backend/app/services/wallet.py`
  - Model: `backend/app/models/wallet_transaction.py`
- **Admin read-only panels**: Partially
  - Some admin-like endpoints exist (collections status planned, vouchers recording not yet exposed). No RBAC enforcement yet.
- **OpenAPI alignment**: Partially
  - Spec present: `backend/openapi.yaml`. Many endpoints match; some gaps noted below.

### API Contract Health
- **Spec presence**: `backend/openapi.yaml` exists and is reasonably complete for MVP.
- **Notable divergences**:
  - `/auth/*`: runtime returns mock tokens without JWT; no `/auth/me`. Spec includes register/login only (OK), but JWT behavior is not implemented.
  - `/collections/{id}/status` (admin) present in spec; missing in routers.
  - `/vouchers` POST (admin) present in spec; missing router/service.
  - `/return-points` spec has paging/filter; runtime supports `chain,q,page,pageSize` (OK). `near` ignored.
  - Schemas use camelCase in responses; routers map accordingly (mostly OK).

### Architecture Inventory
- **DB session/engine**: Async engine created in `backend/app/services/db.py` using SQLAlchemy 2.x asyncio. URL derived from `Settings.database_url` or `USE_SQLITE_DEV`.
- **Alembic target_metadata**: In `backend/alembic/env.py` → `target_metadata = Base.metadata` (Base from `app.services.db`).
- **Alembic engine**: Uses sync engine via `engine_from_config` with derived `DATABASE_URL_SYNC` or translated Postgres URL (psycopg3). Offline/online modes supported.
- **Feature flags/mocks**: Mock auth dependency (`get_current_user_mock`) providing user id 1. Simulator endpoints under `backend/app/routers/simulate.py`. Claims upload stub under `backend/app/routers/claims.py`.

### Deployment Readiness
- **CORS**: Configured in `backend/app/main.py` allowing localhost dev origins; production origins commented placeholder.
- **Env vars**: `backend/app/config.py` expects `DATABASE_URL` (async), optional `USE_SQLITE_DEV`, `SECRET_KEY`. Compose sets `DATABASE_URL`, `DATABASE_URL_SYNC`, `SECRET_KEY`. README lists additional envs for deploy.
- **Dockerfile/entrypoint**: Present. Entry script `backend/docker/entrypoint.sh` waits for DB via Alembic, runs `alembic upgrade head`, then launches Uvicorn.

---

## Alembic & SQLAlchemy Health
- **Commands run**: Local audit attempted; results captured in `backend/migration_audit_main.txt`.
- **Observed heads/lineage**:
  - Head: `0003_rp_external_id_unique`
  - History linear: `0001_initial` → `0002_mvp_tables` → `0003_rp_external_id_unique`
- **Upgrade head (fresh DB)**: Attempted from host venv. Alembic env failed to load due to settings validation (unexpected env vars `debug`, `port`). Likely inherited from process environment when importing `Settings` in Alembic `env.py`.
- **Autogenerate dry-run**: `--stdout` unsupported in current Alembic. No diff shown.
- **env.py checks**:
  - Uses sync SQLAlchemy engine (psycopg3) for migrations (OK).
  - `target_metadata` imported from `app.services.db.Base` (OK).
  - `compare_type/server_default`: not enabled (could add to reduce drift visibility).
- **Models vs migrations**: Naming conventions not defined; models mostly align with created columns. Return points `external_id` handled via 0003 with backfill + unique.

### Risks / Notes
- Pydantic Settings validation errors during Alembic because extraneous env vars (`DEBUG`, `PORT`) exist in environment. Suggest configuring Settings to ignore unknown or set `model_config = {"extra": "ignore"}` or avoid loading Settings in Alembic context.
- `revision --autogenerate --stdout` not supported; use standard `revision --autogenerate` (no write was requested for audit).
- Potential ENUM/string type consistency: status/kind fields are strings; no DB ENUMs -> low risk of duplicate types.

---

## Minimal Runtime Smoke Test
- Backend container started via Compose; host curl failed (PowerShell curl mismatch). Not captured:
  - `/healthz`: not verified in this run.
  - `/docs` and `openapi.json`: not verified in this run.
- File `backend/endpoint_smoke_main.txt` may be empty or partial; backend likely up on `http://localhost:8000` per Compose.

---

## Proposed Next Moves
Prioritized, smallest safe edits with verification steps.

1) Fix Alembic env Settings import issues
   - **Files**: `backend/alembic/env.py`, `backend/app/config.py`
   - **Change**: Avoid importing full Settings in Alembic or make Settings ignore extra env keys. Option A: in `env.py`, derive sync URL from plain `os.getenv` only and remove `get_settings()` usage. Option B: set `Settings.model_config = { "extra": "ignore" }`.
   - **Test**: `DATABASE_URL=postgresql+psycopg://gc:gc@localhost:5432/greencredits alembic -c alembic.ini current` succeeds.

2) Enable richer Alembic diff
   - **Files**: `backend/alembic/env.py`
   - **Change**: `context.configure(compare_type=True, compare_server_default=True)`.
   - **Test**: `alembic revision --autogenerate -m test` produces expected diffs (then discard).

3) Implement missing admin endpoints per OpenAPI
   - **Files**: `backend/app/routers/collections.py`, `backend/app/routers/vouchers.py` (new), `backend/app/services/vouchers.py` (new)
   - **Change**: Add `PATCH /collections/{id}/status` (admin) and `POST /vouchers` with wallet side-effects.
   - **Test**: `pytest -k wallet` or manual `curl` to verify voucher creates ledger entry and updates `/wallet/balance`.

4) Replace mock auth with JWT
   - **Files**: `backend/app/routers/auth.py`, `backend/app/dependencies/auth.py`, `backend/app/config.py`
   - **Change**: Issue/verify JWTs using `SECRET_KEY`; add `/auth/me`. Keep a dev toggle for mock mode.
   - **Test**: Obtain token via `/auth/login`, call `/wallet/balance` with `Authorization: Bearer`.

5) CORS and env hardening
   - **Files**: `backend/app/main.py`, `backend/app/config.py`
   - **Change**: Make CORS origins configurable via env; document required envs in README.
   - **Test**: Start with different origins and confirm `Access-Control-Allow-Origin` headers.

6) Optional: Respect `near` filter for return points
   - **Files**: `backend/app/services/return_points.py`
   - **Change**: Parse `near=lat,lng` and order by distance (Haversine or PostGIS later).
   - **Test**: Call `/return-points?near=...` and verify ordering.

Verification commands (after edits):
```
cd backend
alembic -c alembic.ini current
alembic -c alembic.ini upgrade head
uvicorn app.main:app --app-dir backend --port 8000
```


