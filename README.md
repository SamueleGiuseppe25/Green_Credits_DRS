# GreenCredits

GreenCredits is a subscription-based bottle collection platform. Users pay a monthly fee for weekly bottle pickups; collected bottles are redeemed at DRS return points and the voucher value is credited to an in-app wallet or donated to a charity of the user's choice. Payments (Stripe) and voucher scanning are simulated for the MVP.

## Live URLs

| | URL |
|--|--|
| Frontend | https://green-credits-drs.vercel.app |
| Backend API | https://greencreditsdrs-production.up.railway.app |
| API docs (OpenAPI) | https://greencreditsdrs-production.up.railway.app/docs |

---

## Running locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine on Linux)
- Node.js 20+
- Python 3.12

### 1. Start the full backend stack (Docker Compose)

```bash
docker compose up
```

This starts PostgreSQL on `:5432`, the FastAPI backend on `:8000`, and Adminer on `:8081`.
Alembic migrations run automatically on container start.

### 2. Start the frontend dev server

```bash
cd frontend
cp .env.example .env        # first time only; sets VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                 # http://localhost:5173
```

### 3. SQLite dev mode (no Docker required)

```bash
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload
```

---

## Running tests

### Backend (pytest)

```bash
# Uses an isolated SQLite DB per test — no Docker needed
PYTHONPATH=backend pytest backend/tests/
```

### Frontend unit tests (Vitest + React Testing Library)

```bash
cd frontend
npm test
```

### End-to-end tests (Playwright)

```bash
cd frontend
npx playwright test --project=chromium
```

By default Playwright runs against `https://green-credits-drs.vercel.app`. Override with `BASE_URL=<url>`.
Tests that mutate production data are tagged `@local-only` and automatically skipped in CI.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL async URL (`postgresql+asyncpg://...`) |
| `USE_SQLITE_DEV` | `true` to use SQLite instead of Postgres (dev only) |
| `JWT_SECRET_KEY` | Secret for signing JWT tokens |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime (default `30`) |
| `STRIPE_SECRET_KEY` | Stripe test secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `RESEND_API_KEY` | Resend email API key |
| `FRONTEND_URL` | Frontend origin (for CORS and email links) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `ENVIRONMENT` | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL (default `http://localhost:8000`) |

### CI / GitHub Actions (Secrets)

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway account token (not project token) |
| `RAILWAY_SERVICE_ID` | Railway backend service UUID |
| `SONAR_TOKEN` | SonarCloud analysis token |
| `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` | Admin credentials for Playwright |
| `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | User credentials for Playwright |
| `TEST_DRIVER_EMAIL` / `TEST_DRIVER_PASSWORD` | Driver credentials for Playwright |

---

## Deployment overview

```
git push origin main
    |
    v
GitHub Actions CI (.github/workflows/ci.yml)
    +-- backend: pytest
    +-- frontend: eslint + vitest + build
    +-- playwright: E2E against production Vercel URL
    |
    v (on CI success)
GitHub Actions Deploy (.github/workflows/deploy.yml)
    +-- Deploy to Railway (backend)

Vercel: auto-deploys frontend on push to main (independent of CI)
```

- **Backend:** Railway — Python 3.12, FastAPI, PostgreSQL, Alembic migrations on startup
- **Frontend:** Vercel — Vite + React 18, TypeScript, Tailwind CSS v4
- **Stripe:** test mode; webhook endpoint at `<railway-url>/webhooks/stripe`
- **Email:** Resend sandbox (`onboarding@resend.dev` sender)

For full deployment instructions see [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md).

---

## Project documentation

| File | Contents |
|------|----------|
| [`docs/PROJECT_PROGRESS.md`](docs/PROJECT_PROGRESS.md) | Feature-by-feature build log with status and file lists |
| [`docs/PROJECT_HISTORY.md`](docs/PROJECT_HISTORY.md) | Session notes, testing guides, deployment history |
| [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) | Env vars, Railway/Vercel/Stripe setup steps |
| [`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md) | Testing philosophy, tools, and CI plan |
| [`docs/SETUP.md`](docs/SETUP.md) | Full local setup guide |
| [`docs/adr/`](docs/adr/) | Architecture decision records |
| [`frontend/GreenCredits_Final_Sprint_Plan.md`](frontend/GreenCredits_Final_Sprint_Plan.md) | Final sprint task breakdown |
| [`CLAUDE.md`](CLAUDE.md) | Instructions for Claude Code |

---

## Python version note

We standardise on Python 3.12 across local development, CI, and Docker. Avoid Python 3.13 until `asyncpg` provides compatible wheels.

## Contributors

- Giuseppe Samuele Quaarato
- Thomas Mateo Paredes
