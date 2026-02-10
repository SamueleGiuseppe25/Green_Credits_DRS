# GreenCredits – Subscription Bottle Collection Platform

## Overview
GreenCredits is a subscription-based web platform that makes plastic bottle returns hassle-free.  
Users pay a monthly fee to have their bottles collected weekly instead of returning them in person.  
After each collection, our team redeems the bottles at the selected return point (e.g., Tesco, Lidl), and the voucher value is either credited to the user’s in-app wallet with proof attached, or donated on their behalf with a confirmation photo.

This repository contains a FastAPI backend and a React frontend for the MVP. Payments (e.g., Stripe) and voucher scanning are simulated for development and demo purposes.

---

## Features
- User registration & authentication (JWT).
- Subscription management (activate/cancel) – simulated payment for MVP.
- Weekly collection slot preference and bookings (collections).
- Return points directory and selection per booking.
- Wallet credits from redeemed vouchers, or donation confirmation with proof.
- Admin: manage subscriptions, collections lifecycle, and return points.
- Health checks and basic observability.

---

## Tech Stack
- **Backend:** Python FastAPI  
- **Frontend:** React (Vite) + TailwindCSS, Leaflet/OSM (or Google Maps)  
- **Database:** PostgreSQL  
- **Security:** OAuth2/JWT, RBAC, HTTPS  
- **Deployment:** Docker + Docker Compose (dev), Railway/Azure (prod)  
- **Observability:** Structured logs; optional Sentry/Prometheus (future)  

---

## Setup (Local Development)
See also: `docs/SETUP.md` for a full step-by-step guide.
1. Clone repo  
   ```bash
   git clone https://github.com/<your-org>/greencredits.git
   cd greencredits
   ```
2. Backend – temporary SQLite/Postgres dev mode:
   ```bash
   # Option A (Dev fast):
   # Leave DATABASE_URL empty and opt-in to sqlite dev
   export USE_SQLITE_DEV=true
   uvicorn app.main:app --app-dir backend --reload
   # /healthz → { status: "ok", db: "ok" }
   ```
   ```bash
   # Option B (Future Postgres):
   export DATABASE_URL=postgresql+asyncpg://gc:gc@localhost:5432/greencredits
   uvicorn app.main:app --app-dir backend --reload
   # /healthz → { status: "ok", db: "ok" }
   ```
3. Frontend:
   ```bash
   cd frontend
   cp .env.example .env
   npm i
   npm run dev
   # http://localhost:5173
   ```

---

### Python version note
We standardize on Python 3.12 for local development, CI, and Docker. Avoid Python 3.13 until `asyncpg` publishes compatible wheels.

## Architecture
- **backend/** → FastAPI app, DB models, services, OpenAPI spec

- **frontend/** → React app (Vite + Tailwind)

- **docs/** → requirements.md, ADR-000, reports, diagrams

### Useful docs
- Requirements → `docs/requirements.md`
- ADR-000 → `docs/adr/ADR-000-tech-choices.md`
- OpenAPI → `backend/openapi.yaml`
- Smoke tests → `docs/SMOKE.md`

- **tests/** → pytest suite

---

## Scrum & Development Process
- **Version Control:** GitHub (weekly feature branches, PRs reviewed by teammate).
- **Planning:** GitHub Projects or Trello.
- **Methodology:** Scrum – 2-week sprints, daily stand-ups, retrospectives.
- **Deliverables:** Proposal (Nov), Prototype (Jan), Final Software (Mar), Report (Apr), Presentation (Apr).

---

## Deployment (Railway)
### Services
- api (FastAPI): Dockerfile at `backend/Dockerfile`
- web (React + Nginx): Dockerfile at `frontend/Dockerfile`
- postgres (managed)

### Required Variables (api)
- DATABASE_URL
- SECRET_KEY
- CORS_ORIGINS
- MAPS_PROVIDER (osm or google)
- GOOGLE_MAPS_API_KEY (only if using Google Maps)

### Required Variables (web)
- VITE_API_BASE_URL (e.g. https://api.greencredits.up.railway.app)

### Steps
1. Create a Railway project, add Postgres (+ Redis if needed).
2. Deploy api service from GitHub (root `/backend`).
3. Deploy web service from GitHub (root `/frontend`).
4. Configure environment variables:
   - API: DB/Redis/Secrets, CORS allows https://<web-domain>.
   - Web: `VITE_API_BASE_URL=https://<api-domain>`.
5. Run migrations on API:
   ```bash
   alembic upgrade head
   ```
   or project equivalent.
6. Visit https://<web-domain> and test flows.

### Health
- GET `/healthz` should return 200 OK.
- Backend: check DB/Redis connections.
- Frontend: Nginx serves static build correctly.

---

## Scope Notes (MVP)
- Payments (e.g., Stripe) and voucher scanning are OUT OF SCOPE for the MVP and are simulated.
- Admin-only endpoints require JWT with `role=admin`.
- Wallet balance is computed from transaction ledger.

## License
MIT License

## Contributors
- Giuseppe Samuele Quaarato
- Thomas Mateo Paredes 
