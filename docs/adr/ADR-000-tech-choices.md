# ADR-000: Technology Choices for GreenCredits

**Date:** September 2025 (initial) — updated March 2026 to reflect what was actually implemented.

## Context

We need a modern, testable stack for a subscription-based bottle collection platform that:
- Supports a web-first MVP.
- Provides clear API contracts for parallel frontend/backend work.
- Deploys cheaply (student project, academic submission).
- Handles auth, payments, email notifications, and map-based return point selection.

## Decisions and Outcomes

### Backend — FastAPI (Python 3.12) ✅ Implemented

- FastAPI with async SQLAlchemy 2.0 and Alembic for DB migrations.
- Pydantic Settings for environment variable management.
- JWT Bearer tokens for auth (access token, no refresh token for MVP simplicity).
- Deployed to Railway (Docker, Postgres add-on).

### Database — PostgreSQL ✅ Implemented

- PostgreSQL on Railway (production).
- SQLite (via `aiosqlite`) as a dev/test fallback (`USE_SQLITE_DEV=true`).
- MongoDB (originally planned for event logs) — **dropped**: in-process event bus covers the use case at MVP scale without the added complexity.

### Async tasks / event bus — In-process event bus ✅ Implemented (scoped down from Celery)

- Original plan: Celery + Redis for background tasks and OCR.
- **Decision:** In-process async event bus (`backend/app/core/events.py`) — sufficient for MVP; no external infrastructure dependency.
- **Trade-off:** Events are not durable across restarts. A production system would migrate to RabbitMQ or a similar broker. This is documented in the project report.
- Redis — **dropped**: no longer needed without Celery.

### Frontend — React 18 + Vite + TypeScript + Tailwind CSS v4 ✅ Implemented

- TanStack Query v5 for data fetching and cache management.
- MSW (Mock Service Worker) for API mocking in tests.
- Deployed to Vercel (auto-deploy on push to `main`).

### Maps — Leaflet + react-leaflet + OpenStreetMap ✅ Implemented

- No API key required, zero cost.
- Google Maps — **dropped**: not needed given Leaflet meets all map requirements.

### Payments — Stripe (test mode) ✅ Implemented

- Stripe Checkout for subscription sign-up.
- Stripe webhooks for subscription lifecycle events.
- Live mode not activated (academic scope).

### Email — Resend SDK ✅ Implemented

- Resend chosen over SendGrid for simpler API and generous free tier.
- Sandbox sender `onboarding@resend.dev` (no custom domain needed for MVP).
- Events that trigger emails: collection completed, claim resolved, collection assigned to driver.

### Auth — JWT Bearer tokens ✅ Implemented

- Access-token-only (no refresh token) for MVP simplicity.
- RBAC: `is_admin` and `is_driver` flags on the User model.
- Charity role — **dropped**: donation flow is handled via a preference field on collections, not a separate user role.

### Scanning — Web upload ✅ Implemented (scoped down)

- Proof photos uploaded via `POST /api/uploads/proof` (JPEG/PNG, 5 MB max, stored locally).
- Voucher scanning (Tesseract.js / ZXing) — **dropped**: voucher amounts entered manually by drivers for MVP.
- Android Kotlin app (Phase 2) — **deferred**: out of scope for academic submission.

### CI/CD ✅ Implemented

- GitHub Actions: pytest (backend) + ESLint + Vitest + build (frontend) + Playwright E2E on push to `main`.
- Railway: deploys backend after CI succeeds.
- Vercel: auto-deploys frontend on push to `main`.
- SonarCloud: static analysis runs after backend + frontend jobs.

### Observability

- Structured logging via Python `logging` module.
- Sentry — **deferred**: not configured for academic MVP.
- Prometheus/Grafana — **deferred**: out of scope.

## Consequences

**Benefits of final stack:**
- Minimal infrastructure dependencies (no Redis, no Mongo, no Celery).
- Fast local development with SQLite fallback.
- End-to-end type safety (Pydantic on backend, TypeScript on frontend).
- All CI/CD and testing tooling is free (GitHub Actions, Railway free tier, Vercel free tier).

**Accepted trade-offs:**
- In-process event bus is not durable; a production system needs a proper message broker.
- Local file storage for proof photos; production would use S3 or similar.
- Stripe is test-mode only; live mode requires business verification.
