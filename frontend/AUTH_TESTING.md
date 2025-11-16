# Frontend Auth Integration - Manual Testing Guide

This document describes how to manually test the Phase 1 frontend authentication integration with the FastAPI backend.

## Prerequisites

1. **Backend running**: The FastAPI backend must be running on `http://localhost:8000`
   ```bash
   # From project root
   docker compose up -d
   ```

2. **Frontend dependencies installed**:
   ```bash
   cd frontend
   npm install
   ```

3. **Test credentials**: Use the demo account:
   - Email: `demo@example.com`
   - Password: `myStrongP@ssw0rd`

## Environment Setup

The frontend uses real backend auth by default. MSW (Mock Service Worker) is **disabled** unless explicitly enabled.

- **Default (Real Auth)**: No environment variables needed
- **Fake Auth (MSW)**: Set `VITE_USE_DEV_AUTH=true` in `.env` file (only for development/testing)

## Testing Steps

### 1. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend should start on `http://localhost:5173` (or another port if 5173 is busy).

### 2. Test Initial Load (Token Persistence)

1. Open the browser to `http://localhost:5173`
2. Open browser DevTools → Application → Local Storage
3. Check that there is **no** `gc_access_token` key initially
4. You should be redirected to `/login` if trying to access a protected route

### 3. Test Login Flow

1. Navigate to `http://localhost:5173/login`
2. Enter credentials:
   - Email: `demo@example.com`
   - Password: `myStrongP@ssw0rd`
3. Click "Sign in"
4. **Expected behavior**:
   - Loading state shows "Signing in…"
   - On success, redirects to `/wallet`
   - Token is stored in localStorage as `gc_access_token`
   - User object is fetched and stored in context

### 4. Verify Token Storage

1. After successful login, open DevTools → Application → Local Storage
2. Verify `gc_access_token` exists and contains a JWT token
3. The token should be a long string starting with something like `eyJ...`

### 5. Test Token Validation on Page Refresh

1. While logged in, refresh the page (F5 or Ctrl+R)
2. **Expected behavior**:
   - Brief "Loading session…" message appears
   - App automatically calls `/auth/me` with the stored token
   - If token is valid, user remains logged in
   - If token is invalid/expired, user is logged out and redirected to `/login`

### 6. Test Protected Routes

1. **While logged out**, try to access:
   - `http://localhost:5173/wallet`
   - `http://localhost:5173/claims`
   - `http://localhost:5173/map`
   - `http://localhost:5173/admin`

2. **Expected behavior**:
   - All routes redirect to `/login`
   - The original route is preserved in navigation state
   - After login, user is redirected back to the originally requested route

### 7. Test Logout

1. While logged in, find the logout functionality (if implemented in UI)
   - Or manually call `logout()` from browser console: `localStorage.removeItem('gc_access_token')` and refresh
2. **Expected behavior**:
   - Token is removed from localStorage
   - User state is cleared
   - User is redirected to `/login` (if accessing protected route)

### 8. Test Invalid Credentials

1. Navigate to `/login`
2. Enter invalid credentials:
   - Email: `wrong@example.com`
   - Password: `wrongpassword`
3. Click "Sign in"
4. **Expected behavior**:
   - Error message appears: "Invalid credentials" (or similar)
   - User remains on login page
   - No token is stored

### 9. Test Network Error Handling

1. Stop the backend: `docker compose down`
2. Try to log in with valid credentials
3. **Expected behavior**:
   - Error message appears (network error)
   - App does not crash
   - User can retry after backend is restarted

4. Restart backend: `docker compose up -d`
5. Try logging in again - should work normally

### 10. Test Already Authenticated Redirect

1. Log in successfully
2. Manually navigate to `/login` (or refresh while on login page)
3. **Expected behavior**:
   - Automatically redirected to `/wallet` (or previously requested page)
   - Login form is not shown

## Verification Checklist

- [ ] Login with valid credentials works
- [ ] Token is stored in localStorage as `gc_access_token`
- [ ] Token persists across page refreshes
- [ ] `/auth/me` is called on app startup to validate token
- [ ] Protected routes redirect to `/login` when not authenticated
- [ ] After login, user is redirected to originally requested route
- [ ] Invalid credentials show error message
- [ ] Network errors are handled gracefully
- [ ] Already-authenticated users are redirected away from login page
- [ ] Logout clears token and user state

## Troubleshooting

### Issue: Login fails with CORS error
**Solution**: Ensure backend CORS is configured to allow requests from frontend origin (usually `http://localhost:5173`)

### Issue: Token not persisting
**Solution**: Check browser console for localStorage errors. Some browsers/incognito modes block localStorage.

### Issue: MSW intercepting requests
**Solution**: Ensure `VITE_USE_DEV_AUTH` is not set to `true` in `.env` file. MSW should only run when explicitly enabled.

### Issue: 401 errors on protected routes
**Solution**: 
- Verify token is present in localStorage
- Check backend is running and accessible
- Verify token hasn't expired (check backend JWT expiry settings)

## API Endpoints Used

- `POST /auth/login` - Authenticate user and receive JWT token
- `GET /auth/me` - Get current user info (requires Bearer token)

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: `http://localhost:8000`)
- `VITE_USE_DEV_AUTH` - Enable MSW fake auth (default: `false`, set to `true` to enable)

