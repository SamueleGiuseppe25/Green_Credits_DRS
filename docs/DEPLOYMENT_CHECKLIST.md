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
