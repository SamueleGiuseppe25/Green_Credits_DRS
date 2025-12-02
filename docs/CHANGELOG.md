# GreenCredits – Auth UX and Collections Cleanup

Date: 2025-12-01

Changes:

- Subscriptions
  - Fixed PUT /collection-slots/me by parsing/validating weekday and times; added preferredReturnPointId validation and 400 errors for invalid input.
  - Success/error toasts added; dark-mode select/options styling improved.

- Collections
  - Added PATCH /collections/{id}/cancel (existing) wiring in UI with toasts.
  - New DELETE /collections/{id}: owner-only; allowed only for canceled collections; now soft-deletes (archives) instead of hard delete.
  - Enforced weekly pickup rule in create: only 1 pickup per ISO week per user (400 on conflict).
  - Corrected timestamp handling; updated_at now changes on updates via ORM.
  - UI: Cancel and Remove buttons shown per-row based on status.

- Wallet
  - Demo seed on startup adds a few transactions for users without history.
  - Increased wallet_transactions.kind length to 32 (migration) to avoid seed errors.

- Auth UX
  - Split routing into PublicLayout (/, /login, /signup) and AppLayout (authenticated app pages).
  - New LandingPage and SignupPage; signup auto-logs in and redirects to /wallet.
  - Added RequireAdmin wrapper and hid Admin link unless user.is_admin (optional).

- Navigation & Map
  - Responsive sidebar with collapsed mode and toggle button.
  - Map page simplified to a list with “Open in Google Maps” links.

How to test:

- Subscriptions: Edit weekly slot and save → success toast; refresh persists. Invalid return point → 400 + error toast.
- Collections: Create a collection; Cancel a scheduled one; Remove a canceled one → list updates with toasts.
- Weekly rule: Try to schedule a second pickup in the same week → 400 with clear message.
- Wallet: Demo transactions visible after backend start (for users with empty history).
- Auth: Visit / or /login to see public layout; sign up then auto-login to /wallet; sidebar hidden on public pages.
 - Map: Open “Return Points”, click “Open in Google Maps” to navigate to coordinates.

---

Date: 2025-12-02

Changes:

- Collections & Schedule UX
  - Recurring schedule summary shown with frequency, weekday, time and preferred return point.
  - Create-one-off form is dimmed/disabled while a recurring schedule is enabled, with clear guidance.
  - “Disable schedule” action added (DELETE /collection-slots/me).
  - Friendly business-rule errors surfaced from backend detail messages.

- Settings
  - Account name is editable (PATCH /users/me).
  - Delete account added (DELETE /users/me) with guards for active subscriptions and upcoming collections.
  - Logout navigates to Landing page (/).

- Navigation
  - Icons added to sidebar items.
  - Mobile hamburger + drawer implemented; sidebar hidden on small screens.

- Admin
  - /admin now pings a protected endpoint and displays an access confirmation.
  - Show Admin nav link only when user.is_admin is true.

Admin testing:
- Make any user an admin by running:
  UPDATE users SET is_admin = TRUE WHERE email = 'demo@example.com';
- Log in as that user and open /admin – you should see “Admin area – you are logged in as admin”.




