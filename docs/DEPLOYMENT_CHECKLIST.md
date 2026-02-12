# GreenCredits Deployment Checklist

This document lists all environment variables, secrets, and manual setup steps required for deploying GreenCredits to Railway (backend) and Vercel (frontend).

---

## Railway Environment Variables

Configure these in the Railway backend service → Variables tab:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Reference from Railway Postgres (use Reference button) |
| `STRIPE_SECRET_KEY` | `sk_test_...` | From Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe webhook endpoint (see Stripe Webhook Setup below) |
| `JWT_SECRET_KEY` | *(generate secure random string)* | e.g. `openssl rand -hex 32` |
| `JWT_ALGORITHM` | `HS256` | — |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | — |
| `ENVIRONMENT` | `production` | — |
| `FRONTEND_URL` | `https://your-project.vercel.app` | Update after Vercel setup (see Post-deploy step) |
| `CORS_ORIGINS` | `["https://your-project.vercel.app","http://localhost:5173"]` | Update after Vercel setup (see Post-deploy step) |
| `PYTHONUNBUFFERED` | `1` | For proper logging |

---

## Vercel Environment Variables

Configure these in Vercel project → Settings → Environment Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_BASE_URL` | `https://your-backend.up.railway.app` | From Railway backend service URL (Settings → Domains) |

---

## GitHub Secrets

Add these in GitHub repo → Settings → Secrets and variables → Actions:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `RAILWAY_TOKEN` | `railway_xxxxx...` | Railway project → Settings → Tokens → Create Token |
| `RAILWAY_SERVICE_ID` | *(service UUID)* | Copy from Railway service URL: `railway.app/project/xxx/service/[THIS_PART]` |

---

## Stripe Webhook Setup for Production

1. **Get Railway backend URL**
   - Railway Dashboard → Backend service → Settings → Domains
   - Copy: `https://your-backend.up.railway.app`

2. **Create webhook endpoint in Stripe**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-backend.up.railway.app/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Click "Add endpoint"

3. **Copy signing secret**
   - Click on your new endpoint
   - Click "Reveal" under "Signing secret"
   - Copy `whsec_...` value

4. **Add to Railway**
   - Railway → Backend service → Variables
   - Set `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from step 3)
   - Railway auto-redeploys

---

## Manual Setup Steps

### a. Railway Setup

1. Create new project at https://railway.app
2. Deploy from GitHub → select `greencredits` repository
3. Add PostgreSQL: Right-click canvas → Database → PostgreSQL
4. Configure backend service:
   - Root directory: `backend` (or ensure Dockerfile path is correct)
   - Add all Railway environment variables (see table above)
   - Set `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (use Reference button)
5. Get credentials:
   - **Service ID:** Copy from URL `railway.app/project/xxx/service/[SERVICE_ID]`
   - **Token:** Project Settings → Tokens → Create Token → Copy

### b. GitHub Secrets

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add `RAILWAY_TOKEN` (from step a.5)
3. Add `RAILWAY_SERVICE_ID` (from step a.5)

### c. Vercel Setup

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select `greencredits` repository
3. Configure:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Add environment variable: `VITE_API_BASE_URL` = `https://your-backend.up.railway.app` (from Railway)
5. Deploy
6. Copy Vercel URL: `https://your-project.vercel.app`

### d. Post-deploy: Update Railway CORS

After Vercel deploys:

1. Railway → Backend service → Variables
2. Update `FRONTEND_URL`: `https://your-project.vercel.app` (from step c.6)
3. Update `CORS_ORIGINS`: `["https://your-project.vercel.app","http://localhost:5173"]`
4. Railway auto-redeploys

---

## Deployment Flow (After Setup)

```
git push origin main
    ↓
GitHub Actions (.github/workflows/deploy.yml)
    ├─ Run backend tests (pytest)
    ├─ Run frontend tests (lint, test, build)
    └─ If pass → Deploy to Railway (bervProject/railway-deploy)
```

Vercel watches the GitHub repo separately and auto-deploys the frontend on push to main.

---

## Testing Your Deployment

Replace `YOUR_BACKEND_URL` and `YOUR_FRONTEND_URL` with your actual Railway and Vercel URLs.

### 1. GitHub Actions
- Go to **GitHub → Actions** tab
- Open the latest "Deploy to Railway" run
- **✅ Pass:** All jobs (backend, frontend, deploy) are green
- **❌ Fail:** Check logs for test failures or missing `RAILWAY_TOKEN` / `RAILWAY_SERVICE_ID`

### 2. Backend (Railway)
```bash
# Health check (no DB)
curl https://YOUR_BACKEND_URL/health

# Expected: {"status":"ok"}

# DB-aware health check
curl https://YOUR_BACKEND_URL/healthz

# Expected: {"status":"ok","db":"ok","version":"..."}
```

### 3. Frontend (Vercel)
- Open `https://YOUR_FRONTEND_URL` in a browser
- **✅ Pass:** Landing page loads with no blank screen or console errors
- **✅ Pass:** Login/Register links work (even if you don't have an account yet)

### 4. Frontend → Backend Connectivity
- Open `https://YOUR_FRONTEND_URL`, open DevTools (F12) → Network tab
- Try to **Register** or **Login**
- **✅ Pass:** Requests to `YOUR_BACKEND_URL/auth/...` return 200/201 or expected error (e.g. 422)
- **❌ CORS error:** Make sure `FRONTEND_URL` and `CORS_ORIGINS` in Railway include your Vercel URL exactly

### 5. Quick curl test (from terminal)
```powershell
# Windows PowerShell
$backend = "https://YOUR_BACKEND_URL"
Invoke-RestMethod "$backend/health"
Invoke-RestMethod "$backend/healthz"
```

### Common issues
| Symptom | Fix |
|---------|-----|
| Deploy job fails with "RAILWAY_TOKEN not found" | Add `RAILWAY_TOKEN` and `RAILWAY_SERVICE_ID` in GitHub → Settings → Secrets |
| 502 Bad Gateway on Railway | Check Railway logs; DB may not be ready or migrations failed |
| CORS errors in browser | Update `CORS_ORIGINS` in Railway with exact Vercel URL (no trailing slash) |
| Frontend shows "Failed to fetch" | Verify `VITE_API_BASE_URL` in Vercel points to Railway backend URL |
