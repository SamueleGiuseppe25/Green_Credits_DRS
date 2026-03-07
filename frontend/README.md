# GreenCredits Frontend

React 18 + Vite + TypeScript + Tailwind CSS v4 web client for GreenCredits.

## Development

```bash
cp .env.example .env   # first time only — set VITE_API_BASE_URL
npm install
npm run dev            # http://localhost:5173
npm run build          # production build (tsc -b && vite build)
npm run lint           # eslint
```

## Tests

```bash
npm test               # Vitest + React Testing Library (unit/component)
npx playwright test    # Playwright E2E (requires credentials in env)
```

See the repo-root [`README.md`](../README.md) for full setup and environment variable reference.
