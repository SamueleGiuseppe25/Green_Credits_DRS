# GreenCredits CI/CD Deployment - Claude Code Implementation Guide

**Context:** GitHub Actions workflow exists (`.github/workflows/ci.yml`) but currently only runs tests. Need to add deployment step to Railway.

---

## Current State

✅ **Already exists:**
- `.github/workflows/ci.yml` - runs backend/frontend tests + lint
- Backend tests: 24 tests passing
- Frontend tests: 11 tests passing
- Docker setup working locally

❌ **Missing:**
- Deployment step in GitHub Actions
- Railway project setup
- Vercel project setup
- Production environment variables
- Stripe webhook configuration for Railway

---

## Tasks for Claude Code

### Task 1: Update GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

**Current state:** Workflow runs tests but doesn't deploy

**Required changes:**
1. Rename workflow to `deploy.yml`
2. Add deployment job that runs after tests pass
3. Use `bervProject/railway-deploy@main` action
4. Only trigger on push to `main` branch (and manual dispatch)

**Expected workflow structure:**
```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    # ... existing test jobs ...
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bervProject/railway-deploy@main
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        with:
          service: ${{ secrets.RAILWAY_SERVICE_ID }}
```

### Task 2: Verify Dockerfile

**File:** `backend/Dockerfile`

**Required CMD:**
```dockerfile
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Critical:** Must run migrations before starting server

### Task 3: Create Environment Variables Checklist

**Create file:** `docs/DEPLOYMENT_CHECKLIST.md`

**Content:** List all environment variables needed for:
- Railway backend
- Vercel frontend
- GitHub Secrets
- Stripe webhook configuration

### Task 4: Install Railway CLI (Optional - For Debugging)

**Purpose:** View logs in terminal during deployment

```bash
npm install -g @railway/cli
railway login
```

**Usage after deployment:**
```bash
railway logs --follow          # Live logs in terminal
railway connect Postgres       # Database shell
railway run alembic current    # Check migration status
```

---

## Manual Steps (User Will Do)

### Step 1: Railway Setup (~10 minutes)

**1.1 Create Project:**
- Go to https://railway.app
- New Project → Deploy from GitHub repo
- Select `greencredits` repository
- Railway auto-detects `backend/Dockerfile`

**1.2 Add PostgreSQL:**
- Right-click canvas → Database → PostgreSQL
- Wait 30 seconds for provisioning

**1.3 Connect Backend to Database:**
- Backend service → Variables tab
- Add: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (use Reference button)

**1.4 Add Environment Variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Reference from Postgres |
| `STRIPE_SECRET_KEY` | `sk_test_...` | From Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Created in Step 2 |
| `JWT_SECRET_KEY` | Random string | Generate secure key |
| `JWT_ALGORITHM` | `HS256` | - |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | - |
| `ENVIRONMENT` | `production` | - |
| `FRONTEND_URL` | Update after Vercel | Initially `http://localhost:5173` |
| `CORS_ORIGINS` | Update after Vercel | Initially `["http://localhost:5173"]` |
| `PYTHONUNBUFFERED` | `1` | For proper logging |

**1.5 Get Railway Credentials:**
- **Service ID:** Copy from URL: `railway.app/project/xxx/service/[THIS_PART]`
- **Token:** Project Settings → Tokens → Create Token → Copy `railway_xxxxx...`

### Step 2: Configure Stripe Webhooks for Railway

**Problem:** Locally you run `stripe listen --forward-to localhost:8000/webhooks/stripe`

**Solution for Railway:**

1. **Get Railway backend URL:**
   - Railway Dashboard → Backend service → Settings → Domains
   - Copy: `https://your-backend.up.railway.app`

2. **Create webhook endpoint in Stripe:**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-backend.up.railway.app/webhooks/stripe`
   - Select events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Click "Add endpoint"

3. **Copy webhook signing secret:**
   - Click on your new endpoint
   - Click "Reveal" under "Signing secret"
   - Copy `whsec_...` value

4. **Add to Railway:**
   - Railway → Backend service → Variables
   - Update: `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from step 3)
   - Railway auto-redeploys

**Result:** Stripe will send webhooks directly to Railway (no CLI needed in production)

### Step 3: GitHub Secrets

**Location:** GitHub repo → Settings → Secrets and variables → Actions

| Secret Name | Value | Source |
|-------------|-------|--------|
| `RAILWAY_TOKEN` | `railway_xxxxx...` | From Railway Step 1.5 |
| `RAILWAY_SERVICE_ID` | `abc123-def456...` | From Railway Step 1.5 |

### Step 4: Vercel Setup (~5 minutes)

**4.1 Create Project:**
- Go to https://vercel.com
- New Project → Import from GitHub
- Select `greencredits` repository

**4.2 Configure:**
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**4.3 Environment Variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://your-backend.up.railway.app` | From Railway |

Check: Production, Preview, Development

**4.4 Deploy:**
- Click "Deploy"
- Wait 2-3 minutes
- Copy Vercel URL: `https://your-project.vercel.app`

### Step 5: Update Railway CORS

**After Vercel deploys:**
- Railway → Backend service → Variables
- Update `FRONTEND_URL`: `https://your-project.vercel.app`
- Update `CORS_ORIGINS`: `["https://your-project.vercel.app","http://localhost:5173"]`
- Railway auto-redeploys

---

## Deployment Flow (After Setup)

```bash
# Developer workflow:
git add .
git commit -m "feat: new feature"
git push origin main

# Automatic process:
1. GitHub Actions runs tests (2-3 min)
2. If tests pass → Deploy to Railway (3-5 min)
3. Vercel auto-deploys frontend (2-3 min)
4. Total: ~5-8 minutes → Live! ✅

# Debug in terminal (optional):
railway logs --follow
```

---

## Debugging

### View Logs

**Option 1: Railway Dashboard (easiest)**
- Railway → Service → Deployments → Click deployment → View logs

**Option 2: Railway CLI (terminal)**
```bash
railway logs --follow
railway logs --service=backend
```

**Option 3: GitHub Actions**
- GitHub → Actions tab → Click workflow run → View logs

**Option 4: Vercel Dashboard**
- Vercel → Deployments → Click deployment → View logs

### Common Issues

**Issue: Build fails**
- Check: Railway Dashboard → Build logs
- Fix: Missing dependency, wrong Python version, file path error

**Issue: Migrations fail**
- Check: Railway Dashboard → Deployment logs
- Fix: Run `railway connect Postgres` to check DB state

**Issue: Runtime errors**
- Check: Railway Dashboard → Runtime logs
- Fix: Missing environment variable, CORS misconfigured

**Issue: Frontend can't reach backend**
- Check: Browser DevTools → Network tab
- Fix: VITE_API_URL in Vercel, CORS_ORIGINS in Railway

**Issue: Stripe webhooks not working**
- Check: Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries
- Fix: Verify webhook URL, signing secret, backend endpoint responding

---

## Architecture

```
GitHub Repository
    ↓ (git push main)
GitHub Actions
    ├─ Run tests (pytest, vitest, lint)
    └─ If pass → Deploy to Railway
         ↓
    Railway
    ├─ Build Docker image (from Dockerfile)
    ├─ Run migrations (alembic upgrade head)
    ├─ Start FastAPI server
    └─ Connect to PostgreSQL
         ↑
    Stripe Webhooks
    └─ Send events directly to Railway

Vercel (watches GitHub separately)
    ├─ Detect push to main
    ├─ Build frontend (npm run build)
    └─ Deploy to global CDN
```

---

## Stripe Webhook Differences

| Environment | Webhook Delivery | Setup |
|-------------|------------------|-------|
| **Local** | Stripe CLI forwards | Run `stripe listen --forward-to localhost:8000/webhooks/stripe` |
| **Railway** | Stripe sends directly | Configure endpoint in Stripe Dashboard |

**Key point:** No CLI needed in production. Stripe sends webhooks directly to your Railway URL.

---

## Expected File Changes

```
.github/workflows/
├── ci.yml (existing)      → Rename to deploy.yml + add deploy job
└── deploy.yml (new)       → Full CI/CD workflow

docs/
└── DEPLOYMENT_CHECKLIST.md (new) → Environment variables list

backend/
└── Dockerfile             → Verify CMD runs migrations

PROJECT_PROGRESS.md        → Update with CI/CD setup
```

---

## Success Criteria

After setup complete:

✅ `git push main` triggers GitHub Actions
✅ Tests run automatically
✅ Railway deploys backend on test success
✅ Vercel deploys frontend automatically
✅ Can view logs via Railway CLI: `railway logs --follow`
✅ Backend accessible: `https://your-backend.up.railway.app/healthz`
✅ Frontend accessible: `https://your-project.vercel.app`
✅ Frontend can call backend (no CORS errors)
✅ Stripe webhooks delivered directly to Railway
✅ Subscriptions work in production

---

## Cost

- **Railway:** ~$15-20/month (backend + PostgreSQL)
- **Vercel:** Free (generous free tier)
- **Total:** ~$15-20/month

---

## Claude Code Prompt

```bash
claude-code "Prepare GreenCredits for Railway/Vercel deployment:

1. Read PROJECT_PROGRESS.md for context
2. Check .github/workflows/ci.yml
3. Create new .github/workflows/deploy.yml based on ci.yml but:
   - Rename from 'CI' to 'Deploy to Railway'
   - Keep all test jobs exactly as they are
   - Add deploy job after tests that uses bervProject/railway-deploy@main
   - Only trigger on push to main (+ workflow_dispatch)
4. Verify backend/Dockerfile has: CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
5. Create docs/DEPLOYMENT_CHECKLIST.md with:
   - All environment variables needed for Railway
   - All environment variables needed for Vercel
   - GitHub secrets needed
   - Stripe webhook setup instructions
6. Update PROJECT_PROGRESS.md to track CI/CD setup

PLAN-ONLY mode - prepare files, don't deploy anything yet."
```

---

Last Updated: Feb 11, 2026
