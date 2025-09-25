# ADR-000: Tech Choices for GreenCredits

## Context
We need a modern, testable stack that supports:
- Web-first MVP (image upload + web camera scanning).  
- Clear API contracts for parallel frontend/backend work.  
- Cheap cloud deployment suitable for students.  
- Strong security, observability, and extensibility.  
- Later extension with a Kotlin mobile app.

## Decision
- **Backend:** FastAPI (Python 3.12), SQLAlchemy, Alembic, Pydantic Settings.  
- **Databases:** PostgreSQL (core data); MongoDB (optional, for event/logs).  
- **Async tasks:** Celery + Redis (optional for OCR/notifications).  
- **Frontend:** React (Vite), Tailwind CSS, shadcn/ui, TanStack Query, MSW for API mocks.  
- **Maps:** Leaflet + OpenStreetMap (MVP), optional Google Maps upgrade.  
- **Scanning (Phase 1):** Web upload + browser camera (ZXing + Tesseract.js).  
- **Scanning (Phase 2):** Android Kotlin app + Google ML Kit.  
- **Auth:** JWT (access + refresh), RBAC (User/Admin/Charity).  
- **Deployment:** Dockerized API & Web on Railway; managed Postgres; optional Redis.  
- **Observability:** Sentry (errors), structured JSON logs, Prometheus/Grafana (future).  
- **Contracts:** OpenAPI spec (`backend/openapi.yaml`) is the source of truth.  

## Consequences
**Benefits**
- Fast developer experience, parallelizable work (API + frontend).  
- Low hosting cost, student-friendly (Railway free tier).  
- Modern, widely used tools (FastAPI, React, Tailwind).  
- Secure and extensible foundation.  

**Trade-offs**
- OCR with Tesseract can be inaccurate; may require preprocessing or cloud OCR.  
- Managing two DBs (Postgres + Mongo) adds complexity → Mongo optional until needed.  
- Leaflet has fewer features vs Google Maps.  
- Kotlin mobile app adds overhead but satisfies optional future expansion.  
