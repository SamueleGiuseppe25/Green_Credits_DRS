# Wallet + Return Points Testing

Prereqs:
- Backend running (Docker/Postgres) and reachable via `VITE_API_BASE_URL`
- Frontend running with React/Vite
- MSW is disabled by default; ensure `VITE_USE_DEV_AUTH` is not `true`

Env:
- `.env` in `frontend/`:
  - `VITE_API_BASE_URL=http://localhost:8000` (or your backend URL)

Run:
- Backend: `docker compose up` from repo root (or your usual backend command)
- Frontend: `cd frontend && npm install && npm run dev`

Credentials:
- `demo@example.com` / `myStrongP@ssw0rd`

Flow:
1) Logout if logged in (header Logout)
2) Go to `/login` and log in with the above credentials
3) Navigate to `/wallet`
   - See balance in Euro with 2 decimals
   - See “Last updated” timestamp
   - Transactions list shows date/time, type, amount (green/red), and note (if present)
   - Loading and error states are user-friendly
   - Pagination controls work; empty list shows “No transactions yet.”
4) Refresh the page at `/wallet`
   - The page still works using token from localStorage
5) Navigate to `/map`
   - See list populated from `/return-points`
   - Click an item to highlight and show its details (name, type, retailer/eircode, lat/lng)
   - Loading and error states are user-friendly; empty list is handled
6) Logout from header
   - Redirected to `/login` and protected routes are inaccessible
7) Try visiting `/wallet` or `/map` directly when logged out
   - Redirected to `/login`

Notes:
- All authenticated requests include `Authorization: Bearer <token>`
- 401/403 responses automatically clear token and redirect to `/login`
- API base URL is sourced from `VITE_API_BASE_URL`; no hard-coded URLs

Known Limitations:
- Map visualization is a placeholder panel for now; data and selection are wired and ready for map integration


