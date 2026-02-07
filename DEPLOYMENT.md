# LendFlow Deployment Guide

Deploy **frontend on Vercel** + **backend on Railway**.

### Quick summary

1. **Railway** (backend): Deploy `server/` with `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` → get backend URL.
2. **Vercel** (frontend): Deploy root with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL` (Railway URL).
3. **Supabase**: Add your Vercel URL to Auth redirect URLs.

---

## Prerequisites

- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account
- [Railway](https://railway.app) account
- [Supabase](https://supabase.com) project (Auth + Database)

---

## Part 1: Deploy Backend to Railway

### Step 1: Push your code to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in (GitHub).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your `lendwise-hub` repository.
4. Railway will detect the repo. Do **not** use auto-deploy yet — we need to configure the backend service.

### Step 3: Configure the backend service

1. After the project is created, click **Add Service** or the existing service.
2. Go to **Settings** and set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Watch Paths** (optional): `server/**`

3. Set environment variables (Settings → Variables):

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `DATABASE_URL` | Your Supabase connection string | From Supabase: Settings → Database → Connection string (use **Connection pooling** for Supabase, or direct Postgres URL) |
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` | From Supabase: Settings → API |
   | `SUPABASE_SERVICE_KEY` | `eyJ...` (service_role key) | From Supabase: Settings → API → service_role (secret) |
   | `NODE_ENV` | `production` | Optional; Railway sets this by default |
   | `PORT` | Railway sets this automatically | Do not override unless needed |

4. Get your Supabase values:
   - **Supabase Dashboard** → Your project → **Settings** → **API**:
     - Project URL → `SUPABASE_URL`
     - `service_role` key (secret) → `SUPABASE_SERVICE_KEY`
   - **Settings** → **Database** → **Connection string**:
     - Use "Connection pooling" (port 6543) or "Direct connection" (port 5432)
     - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

### Step 4: Deploy and get the backend URL

1. Click **Deploy** (or push to GitHub if you connected a repo).
2. Go to **Settings** → **Networking** → **Generate Domain**.
3. Copy the URL, e.g. `https://lendwise-hub-backend-production.up.railway.app` — this is your **backend API URL**.

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Connect the repo to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. Click **Add New** → **Project**.
3. Import your `lendwise-hub` repository.

### Step 2: Configure the frontend

1. **Framework Preset**: Vite (auto-detected).
2. **Root Directory**: Leave as `.` (project root).
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### Step 3: Add environment variables

In **Settings** → **Environment Variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Same as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJ...` (anon/public key) | From Supabase: Settings → API → `anon` `public` key |
| `VITE_API_URL` | `https://your-railway-backend.up.railway.app` | The Railway backend URL from Part 1, Step 4 |

### Step 4: Deploy

1. Click **Deploy**.
2. Vercel will build and deploy. Your app will be at `https://your-project.vercel.app`.

---

## Part 3: Update Vercel config for frontend-only

Because the backend runs on Railway, Vercel should only serve the static frontend (no `/api` serverless). Update `vercel.json` to:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This sends all routes to the SPA. API calls from the frontend go to `VITE_API_URL` (Railway), not to Vercel.

---

## Part 4: CORS and Supabase Auth

1. **Supabase Auth URL**: In Supabase Dashboard → **Authentication** → **URL Configuration**, add:
   - Site URL: `https://your-project.vercel.app`
   - Redirect URLs: `https://your-project.vercel.app/**`

2. **Railway CORS**: The backend already uses `cors()`, so requests from your Vercel domain are allowed. If you use a custom domain, ensure CORS accepts it.

---

## Checklist

- [ ] Backend on Railway with `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- [ ] Railway domain generated and copied
- [ ] Frontend on Vercel with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL`
- [ ] Supabase Auth URL and redirect URLs updated
- [ ] `vercel.json` is already set for frontend-only (SPA rewrites)

---

## Optional: Vercel-only (Frontend + API)

If you want to run everything on Vercel:

- The existing `vercel.json` sends `/api/*` to the Express app.
- The server uses `pg`, `tesseract.js`, `pdf-parse` — bundle size and cold starts can be slow.
- Vercel serverless has size (50MB) and timeout (10s hobby, 60s pro) limits.
- For a simpler setup with lighter APIs, Vercel-only can work; for OCR and DB-heavy logic, Railway is more reliable.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend returns 500 | Check Railway logs; verify `DATABASE_URL` and Supabase keys. |
| "Failed to fetch" from frontend | Ensure `VITE_API_URL` points to the Railway URL (with `https://`). |
| Auth redirect fails | Add Vercel URL to Supabase Auth redirect URLs. |
| CORS errors | Backend uses `cors()`; add your Vercel domain to allowed origins if needed. |
