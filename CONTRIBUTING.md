# Contributing to GreenCredits

## Branching

- `feat/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — maintenance / docs / tooling

Open a PR early; mark it as draft if still in progress. Every PR requires review from at least one teammate before merging.

## Local development

```bash
# Full stack (Postgres + backend + Adminer)
docker compose up

# Frontend dev server
cd frontend && npm install && npm run dev

# Backend only (SQLite, no Docker)
USE_SQLITE_DEV=true uvicorn app.main:app --app-dir backend --reload
```

## Running tests

```bash
# Backend (SQLite, no Docker needed)
PYTHONPATH=backend pytest backend/tests/

# Frontend unit tests (Vitest + React Testing Library)
cd frontend && npm test

# End-to-end tests (Playwright, runs against production by default)
cd frontend && npx playwright test --project=chromium
```

## Code style

Pre-commit hooks (Black, Ruff, isort for Python; Prettier for TypeScript/CSS/JSON) run automatically on `git commit` if `pre-commit` is installed:

```bash
pip install pre-commit
pre-commit install
```

CI runs `npm run lint` (ESLint) and `npm run build` for the frontend. Both must pass before a PR can merge.

## Commit messages

Keep messages concise and descriptive. Reference issues when relevant, e.g. `Fixes #123`.

## Pull Requests

- Summarise what changed and how to test it.
- Ensure CI checks pass (backend pytest, frontend lint + vitest + build, Playwright E2E).
- Request review from the other team member.
- Update `docs/PROJECT_PROGRESS.md` if you add or complete a feature.
