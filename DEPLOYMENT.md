# HackMitra Production Deployment Guide

This guide details the complete production deployment procedure for **HackMitra** across **Vercel** (frontend and edge API), **Supabase** (PostgreSQL database, Row Level Security, and Auth), and background workers (automated recurring discovery and deadline reminders).

---

## 1. Supabase PostgreSQL Setup & Migrations

### 1.1 Project Creation
1. Create a Supabase project at [database.new](https://database.new).
2. Recommended region: `ap-south-1` (Mumbai, India) for lowest latency across Karnataka.
3. Record the generated database password and Project Reference ID (`nciqqkrnrdtuzwskjyqn`).

### 1.2 Applying Sequential Database Migrations
HackMitra uses versioned SQL migrations in `supabase/migrations/`:

| Migration File | Purpose |
| :--- | :--- |
| [`001_create_districts_table.sql`](file:///c:/Users/Lenovo/HackMitra/supabase/migrations/001_create_districts_table.sql) | Creates 31 Karnataka districts table with division & cluster enums |
| [`002_seed_districts.sql`](file:///c:/Users/Lenovo/HackMitra/supabase/migrations/002_seed_districts.sql) | Seeds all 31 Karnataka districts with Kannada names and NAIN counts |
| [`003_create_backend_schema.sql`](file:///c:/Users/Lenovo/HackMitra/supabase/migrations/003_create_backend_schema.sql) | Core tables: `hackathons`, `event_sources`, `discovery_runs`, `verification_logs`, RLS |
| [`004_seed_sources_and_initial_data.sql`](file:///c:/Users/Lenovo/HackMitra/supabase/migrations/004_seed_sources_and_initial_data.sql) | Seeds monitored sources (Devfolio, Unstop, VTU, SIH, NAIN) |
| [`005_registration_verification_engine.sql`](file:///c:/Users/Lenovo/HackMitra/supabase/migrations/005_registration_verification_engine.sql) | Verification engine indices, audit checks, and liveness columns |
| [`006_user_accounts_and_notifications.sql`](file:///c:/Users/Lenovo/HackMitra/supabase/migrations/006_user_accounts_and_notifications.sql) | `scheduled_reminders`, `notification_delivery_logs`, and user preferences |

**Automated Migration Execution:**
From your local terminal with `.env.local` configured:
```bash
npm run build # Validates TypeScript and models
npx tsx --env-file=.env.local scripts/run-migration.ts
```

Alternatively, copy each SQL file in sequence and execute it within the **Supabase Dashboard SQL Editor**.

---

## 2. Vercel Frontend Deployment

### 2.1 Connecting the Repository
1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import the `HackMitra` Git repository (`Sharan126/HackMitra`).
3. Framework Preset: **Next.js** (Turbopack).
4. Root Directory: `./` (current root).

### 2.2 Environment Variables on Vercel
In the Vercel Project Dashboard (**Settings -> Environment Variables**), configure:

| Key | Environment | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Public Supabase endpoint (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Public Anon key (safe for browser, RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **Server-Only** key for background ingestion & verification |
| `NEXT_PUBLIC_APP_URL` | Production | Canonical site URL (e.g. `https://hackmitra.in`) |
| `ADMIN_SECRET_KEY` | Production | 32+ character HMAC key for moderator sessions |
| `ADMIN_EMAIL` | Production | Production administrator email |
| `ADMIN_PASSWORD` | Production | Strong administrator password |
| `CRON_SECRET` | Production | Bearer token authenticating Vercel Cron jobs |
| `RESEND_API_KEY` | Production (Optional) | API key for transactional emails via Resend |
| `NOTIFICATION_FROM_EMAIL` | Production (Optional) | Verified sender address (e.g. `alerts@hackmitra.in`) |

### 2.3 Build & Deploy
Click **Deploy**. Vercel will execute `npm run build` and generate all static pages (including all 31 district routes via `generateStaticParams`), edge middleware, and serverless API endpoints.

---

## 3. Recurring Discovery & Verification Workers

HackMitra supports two background orchestration strategies:

### Option A: Vercel Cron (Serverless, Zero Maintenance)
The repository includes [`vercel.json`](file:///c:/Users/Lenovo/HackMitra/vercel.json) configured with scheduled cron jobs:
- `/api/cron/worker` scheduled every 6 hours (`0 */6 * * *`)
- `/api/cron/process-notifications` scheduled every hour (`0 * * * *`)

Vercel automatically dispatches an authenticated HTTP POST with `Authorization: Bearer <CRON_SECRET>` to these endpoints.

### Option B: Standalone Continuous Background Daemon
For high-frequency polling and streaming logs, deploy the standalone worker daemon to Railway, Render, Fly.io, or an AWS EC2 / Lightsail instance:

```bash
# Start standalone worker daemon with 5-minute interval
npx tsx --env-file=.env.local scripts/worker.ts --interval=300
```

**Docker Deployment for Standalone Worker:**
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
RUN npm install -g tsx
COPY . .
CMD ["npx", "tsx", "scripts/worker.ts", "--interval=300"]
```

---

## 4. Post-Deployment Verification Checklist

Run the production verification script against your deployed production environment:
```bash
npx tsx --env-file=.env.local scripts/test-production-readiness.ts
```

Checklist to manually verify:
1. **Search & Filters**: Test search keywords (e.g. "AI", "Hubballi"), district filters, format filters, and deadline sorting.
2. **Districts Directory**: Navigate to `/districts` and test at least three different divisions:
   - Bengaluru Division: `/districts/bengaluru-urban`
   - Belagavi Division: `/districts/dharwad`
   - Kalaburagi Division: `/districts/kalaburagi`
   - Mysuru Division: `/districts/dakshina-kannada`
3. **Event Registration Flow**: Click "Go to Official Registration" on any event card and ensure it opens the verified organizer URL in a new tab with `rel="noopener noreferrer"`.
4. **Administrative Console**:
   - Access `/admin/login` and log in with your configured moderator credentials.
   - Verify the review queue, source status toggles, and duplicate cluster resolution.
5. **Student Radar & Reminders**:
   - Sign in via the Header ("Sign In").
   - Click "Save Hackathon" on an event card.
   - Navigate to `/profile` and verify that the event appears with the "24h & 48h Deadline Reminders Armed" indicator.
   - In "Delivery History & Reminders", click "Send Test Notification" and verify that a delivery log appears.
