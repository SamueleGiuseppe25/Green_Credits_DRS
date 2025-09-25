# GreenCredits – Digital Bottle Return Platform

## Overview
GreenCredits is a Python-based platform for Ireland’s Deposit Return Scheme (DRS).  
It allows users to register, track credits from returned bottles, redeem or donate,  
and view nearby return machines on an interactive map.

The project starts **web-first**, supporting receipt image uploads and web camera scanning.  
Later, it may extend with a **Kotlin mobile companion app** for native QR/receipt scanning.  

---

## Features
- User registration & authentication (OAuth2/JWT).
- Credits wallet with donation & redemption options.
- Google Maps/Leaflet integration for return points.
- Admin dashboard for analytics & claim moderation.
- Machine simulator API to test bottle returns.
- Receipt scanning workflow:
  - Phase 1 → Upload image or scan with web camera.
  - Phase 2 → Extend with Kotlin mobile app (Google ML Kit).
- Secure QR/barcode system for redemptions.
- Cloud deployment with monitoring & logs.

---

## Tech Stack
- **Backend:** Python FastAPI, Celery, Redis  
- **Frontend:** React + TailwindCSS, Leaflet/Google Maps  
- **Databases:** PostgreSQL (core), MongoDB (logs)  
- **Security:** OAuth2, JWT, RBAC, HTTPS  
- **Deployment:** Docker, Railway/Azure  
- **Observability:** Sentry, Prometheus + Grafana  

---

## Setup (Local Development)
See also: `docs/SETUP.md` for a full step-by-step guide.
1. Clone repo  
   ```bash
   git clone https://github.com/<your-org>/greencredits.git
   cd greencredits
   ```
2. Backend – temporary SQLite dev mode (fast):
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

## Architecture
- **backend/** → FastAPI app, DB models, services, OpenAPI spec

- **frontend/** → React app (Vite + Tailwind)

- **machine-simulator/** → Placeholder for simulated bottle returns (optional route in backend)

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
- redis (optional, managed)

### Required Variables (api)
- DATABASE_URL
- SECRET_KEY
- CORS_ORIGINS
- MAPS_PROVIDER (osm or google)
- GOOGLE_MAPS_API_KEY (only if using Google Maps)
- REDIS_URL (if using Celery/Redis)

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

## License
MIT License

## Contributors
- Student A – Backend, APIs, DB
- Student B – Frontend, Maps, Mobile (optional)
