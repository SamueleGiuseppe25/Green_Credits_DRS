Subscriptions UI (MVP)

Prereqs
- Backend running at `http://localhost:8000`
- Env: set `VITE_API_BASE=http://localhost:8000`

Dev auth
- In the header, use the Dev Auth dropdown to set token:
  - `Bearer user` for user routes
  - `Bearer admin` for admin routes (not required here)

Routes
- `/subscription` — shows current subscription status and details
- `/subscription/manage` — activate/cancel actions

Manual QA
1) Set token to `Bearer user` in the header Dev Auth.
2) Go to `/subscription` — verify status renders without errors.
3) Go to `/subscription/manage` — test Activate and Cancel.
   - Expect 200 responses.
   - A success message should display.
   - The header badge should update.
   - Navigating back to `/subscription` should show updated status.

Notes
- The badge in the header always reflects current status.
- API base URL is read from `VITE_API_BASE`.
- Tokens are read from `localStorage.token` and sent as Authorization.


