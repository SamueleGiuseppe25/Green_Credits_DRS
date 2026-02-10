# Testing Strategy — GreenCredits

## 1. Testing Philosophy

GreenCredits follows a **pragmatic, MVP-first** testing approach. Rather than pursuing 100% coverage, we focus on meaningful tests that:

- Protect critical user flows (auth, wallet, collections, admin)
- Catch regressions early in CI
- Run fast without external dependencies (no Docker, no running backend)
- Serve as living documentation of expected behaviour

We follow the **testing pyramid**: many fast unit/integration tests, fewer slow end-to-end tests.

```
        /  E2E  \          (future — Playwright / Cypress)
       /----------\
      / Integration \       (API tests via httpx, component tests via RTL)
     /----------------\
    /    Unit Tests     \   (pure functions, utilities, service logic)
   /--------------------\
```

## 2. Test Environment vs Development Environment

| Concern | Development | Backend Tests (pytest) | Frontend Tests (Vitest) |
|---|---|---|---|
| **Database** | Postgres via Docker Compose | SQLite in-memory (`USE_SQLITE_DEV=true`) | N/A (no backend) |
| **Backend server** | FastAPI on `:8000` | ASGI test client (no HTTP server) | N/A |
| **API calls** | Real `fetch()` to `:8000` | `httpx.AsyncClient` with `ASGITransport` | MSW intercepts `fetch()` |
| **External services** | Stripe test mode | Not called | Not called |
| **Speed** | Seconds (Docker boot) | Milliseconds | Milliseconds |
| **Docker required?** | Yes | No | No |

### Why SQLite for backend tests?

- **Fast**: no container startup, no network overhead
- **Isolated**: each test run starts with a fresh database
- **Same ORM layer**: tests exercise real SQLAlchemy models, real Pydantic schemas, real FastAPI routes — only the engine differs
- **CI-friendly**: runs anywhere Python is installed

### Why MSW for frontend tests?

- **No backend dependency**: tests run without a server
- **Deterministic**: mock handlers return predictable data
- **Network-level fidelity**: MSW intercepts `fetch()` the same way the browser does, so components use their real API code paths
- **Fast**: no HTTP latency

## 3. Tools

### Backend

| Tool | Purpose |
|---|---|
| **pytest** | Test runner and assertion framework |
| **pytest-asyncio** | Async test support (`asyncio_mode = "auto"`) |
| **httpx** | Async HTTP client with `ASGITransport` for testing FastAPI apps |

### Frontend

| Tool | Purpose |
|---|---|
| **Vitest** | Test runner (Vite-native, fast, Jest-compatible API) |
| **React Testing Library (RTL)** | Component rendering and DOM queries |
| **@testing-library/jest-dom** | Custom DOM matchers (`toBeInTheDocument`, etc.) |
| **@testing-library/user-event** | Simulates realistic user interactions |
| **MSW (Mock Service Worker)** | Intercepts `fetch()` at the network level for deterministic API mocking |
| **jsdom** | Browser-like DOM environment for Node.js |

## 4. Test Categories

### Backend

| Category | Directory | What it tests |
|---|---|---|
| Health | `backend/tests/test_healthz.py` | `/healthz` endpoint, DB connectivity detection |
| Auth | `backend/tests/test_auth.py` | Register, login, `/auth/me`, JWT validation |
| Wallet & Return Points | `backend/tests/test_wallet_and_return_points.py` | Public return-points list, auth-gated wallet endpoints |
| Admin | `backend/tests/test_admin.py` | Admin-only endpoints, role-based access control |
| Drivers | `backend/tests/test_drivers.py` | Driver creation, profile access, role enforcement |
| Collections | `backend/tests/test_collections.py` | Collection listing, auth requirement, subscription gating |

### Frontend

| Category | Directory | What it tests |
|---|---|---|
| Auth utilities | `frontend/src/lib/auth.test.ts` | `getToken`, `setToken`, `isAuthenticated`, `logout` (pure functions, localStorage) |
| Landing page | `frontend/src/views/LandingPage.test.tsx` | Renders hero, CTA, pricing, How It Works sections; newsletter form behaviour |

## 5. Directory Structure

```
backend/
  tests/
    conftest.py                    # Shared fixtures (app, client, auth tokens)
    test_healthz.py                # 2 tests
    test_wallet_and_return_points.py # 3 tests
    test_auth.py                   # 7 tests
    test_admin.py                  # 5 tests
    test_drivers.py                # 4 tests
    test_collections.py            # 3 tests

frontend/
  src/
    test/
      setup.ts                     # Vitest setup (jest-dom matchers)
      server.ts                    # MSW server for Node test environment
    lib/
      auth.test.ts                 # 5 tests
    views/
      LandingPage.test.tsx         # 5 tests
```

## 6. Coverage Targets

| Layer | Target | Rationale |
|---|---|---|
| Backend | ~21 tests | Covers auth, admin, drivers, collections, wallet, health |
| Frontend | ~11 tests | Covers auth utilities and main landing page |
| **Total** | **~32 tests** | Meaningful coverage for an MVP; easy to extend |

We do not enforce a percentage-based coverage threshold at this stage. The goal is to have every critical path tested, not to chase a number.

## 7. How to Run Tests

### Backend

```bash
# Install test dependencies (one-time)
cd backend && pip install -r requirements.txt

# Run all backend tests (uses SQLite, no Docker needed)
PYTHONPATH=backend pytest -q backend/tests/

# Run a specific test file
PYTHONPATH=backend pytest -q backend/tests/test_auth.py

# Run with verbose output
PYTHONPATH=backend pytest -v backend/tests/
```

### Frontend

```bash
# Install dependencies (one-time)
cd frontend && npm install

# Run all frontend tests
npm run test

# Run in watch mode (re-runs on file changes)
npm run test:watch
```

## 8. CI Integration

Tests run automatically on every push to `main` and on every pull request via GitHub Actions (`.github/workflows/ci.yml`).

### Backend CI job

1. Checkout code
2. Set up Python 3.12 with pip cache
3. Install dependencies from `requirements.txt` (includes pytest, pytest-asyncio, httpx)
4. Run `pytest -q backend/tests/` with `PYTHONPATH=backend`

### Frontend CI job

1. Checkout code
2. Set up Node 20
3. `npm ci`
4. `npm run lint` (ESLint)
5. `npm run test` (Vitest)
6. `npm run build` (TypeScript check + Vite build)

### Failure policy

- Any test failure blocks the PR from merging
- Lint failures also block the PR
- Build failures block the PR

## 9. Future Improvements

Once the MVP is stable, consider:

- **E2E tests** with Playwright or Cypress for critical user journeys
- **Coverage reporting** via `pytest-cov` and Vitest's built-in coverage
- **Snapshot tests** for complex UI components
- **Contract tests** between frontend and backend API schemas
- **Load testing** for the collection scheduling flow
