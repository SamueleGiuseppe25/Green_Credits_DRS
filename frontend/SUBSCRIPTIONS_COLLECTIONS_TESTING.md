Subscriptions & Collections – Manual Testing (feat/subscriptions-collections)

Prereqs
- Backend running (Docker or local). Default API base: http://localhost:8000
- Frontend running: `npm run dev` from `frontend/`
- Login: `demo@example.com` / `myStrongP@ssw0rd`

Routes
- /subscriptions (protected)
- /collections (protected)

What to verify
1) Subscription summary
   - Visit /subscriptions
   - While loading: “Loading subscription…”
   - On error: “Could not load subscription.”
   - Shows status badge, plan code, start/end (formatted) if present
   - If none, shows “You don’t have a subscription yet.”

2) Pickup schedule
   - Shows weekly rows; only one active day/time (backend supports a single weekly slot)
   - Click “Edit schedule” → change weekday/time → Save
   - After save, values persist on refresh

3) Collections list and creation
   - Visit /collections
   - While loading: loading message
   - On error: “Could not load your collections.”
   - If no items: “You have no collections scheduled yet.”
   - Create a collection using date + time, select a return point, optional notes/bags
   - On success, form clears and the list refetches; new entry appears

4) Auth guard
   - If not logged in and navigating to /subscriptions or /collections, redirected to /login

Assumptions
- Subscription statuses include: active, paused, cancelled, inactive (forward-compatible).
- CollectionSlot schema is a single weekly preference (weekday 0–6, start/end time, preferredReturnPointId).
- Collections list endpoint: GET /collections/me (paginated).

Troubleshooting
- Ensure VITE_API_BASE_URL is set if backend is not on localhost:8000.
- Check browser console/network for 401 responses; session might be expired.


