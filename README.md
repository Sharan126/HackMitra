# HackMitra (ಹ್ಯಾಕ್‌ಮಿತ್ರ)

> **Every Hackathon. Every District. One Platform.**  
> Karnataka's authoritative, statewide hackathon discovery and verification network.

---

## 1. Overview & Mission

Most developer platforms exclusively track hackathons occurring in Bengaluru. **HackMitra** was built to bridge this geographical divide by systematically indexing genuine collegiate, university, government, incubator, and corporate hackathons across **all 31 districts of Karnataka**—from Bagalkot and Bidar in Kalyana Karnataka, to Belagavi and Dharwad in the north, to Mysuru, Mandya, Dakshina Kannada, and Udupi in the south.

### Key Pillars
- **Statewide 31-District Coverage**: Individual dedicated directories for all 31 districts organized across 4 administrative divisions (Belagavi, Kalaburagi, Mysuru, Bengaluru) and 6 KDEM clusters.
- **Strict Verification Standards**: Every listing is verified against authoritative registration evidence (official college circulars, Devfolio, Unstop, NAIN portals) with complete audit logging.
- **Honest District Coverage Tracking**: Clearly distinguishes active hackathons (`verified_active`) from thoroughly monitored districts with no current hackathons (`verified_zero`), and districts actively seeking student scouts (`seeking_leads`).
- **Timezone-Aware Deadlines**: All registration deadlines and closing countdowns are calculated using Indian Standard Time (`Asia/Kolkata`, UTC+05:30), preventing timezone drift.
- **Automated Deadline Reminders**: Students can bookmark hackathons to automatically arm verified 48-hour and 24-hour registration deadline notifications.
- **Secure Moderator Controls**: Full administrative dashboard with server-side HMAC authorization, review queues, duplicate resolution, source controls, and audit trails.

---

## 2. Technology Stack & Architecture

- **Frontend & Routing**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, TypeScript, Tailwind CSS)
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL 17, Row Level Security, Foreign Keys, Triggers, Indices)
- **Authentication**: Supabase Auth (JWT tokens, cryptographic validation) & HMAC-SHA256 Moderator Tokens
- **Icons & UI**: [Lucide React](https://lucide.dev/), curated Karnataka palette (`#142D4E` Navy, `#2563EB` Accent Blue, `#16805D` Success Green)
- **Background Orchestration**: Dual-mode scheduler (Vercel Cron serverless runners + standalone Node.js background worker)
- **Transactional Notifications**: Pluggable email delivery engine (Resend API + built-in transactional service)

---

## 3. Directory Structure

```text
HackMitra/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Statewide discovery homepage & live statistics
│   │   ├── layout.tsx                        # Root layout with AuthProvider & global header/footer
│   │   ├── hackathons/                       # Search, multi-faceted filtering & individual event detail pages
│   │   ├── districts/                        # Karnataka 31-district searchable directory & individual district hubs
│   │   ├── sources/                          # Source transparency & data freshness dashboard
│   │   ├── profile/                          # User watchlist, district preferences, & notification delivery logs
│   │   ├── admin/                            # Secure administrative moderation console & login portal
│   │   ├── submit/                           # Public college hackathon submission form
│   │   └── api/
│   │       ├── admin/                        # Guarded administrative endpoints (events, sources, duplicates)
│   │       ├── cron/                         # Background worker and notification processing triggers
│   │       ├── user/                         # Guarded user saved events, preferences, & notification endpoints
│   │       ├── hackathons/                   # Public search and filtering API
│   │       └── reports/                      # User inaccuracy report submission endpoint
│   ├── components/
│   │   ├── layout/                           # Responsive Header, Announcement bar, Footer
│   │   ├── hackathons/                       # SaveEventButton, Hackathon cards
│   │   ├── admin/                            # AdminDashboardView & verification dossier review
│   │   ├── auth/                             # AuthModal (Sign In, Sign Up, Demo Access)
│   │   └── ui/                               # StatusLabel, Button, Select, EmptyState, LoadingState
│   ├── lib/
│   │   ├── auth/                             # admin-auth.ts (HMAC-SHA256) & user-auth.ts (Supabase JWT)
│   │   ├── discovery/                        # Configurable source registry & scrapers (Devfolio, Unstop, VTU)
│   │   ├── verification/                     # Status evaluator (Asia/Kolkata), audit logging, link liveness
│   │   ├── notifications/                    # email-provider.ts, notification-engine.ts (reminders, deduplication)
│   │   ├── scheduler/                        # Background orchestration cycle, lock acquisition, coverage sync
│   │   ├── supabase/                         # Client, Server, and Admin Supabase client factories
│   │   └── karnataka-data.ts                 # Authoritative 31 Karnataka districts registry
├── supabase/
│   └── migrations/                           # Versioned SQL migrations (001 to 006)
├── scripts/                                  # CLI tools & verification test suites
│   ├── worker.ts                             # Standalone background discovery & verification daemon
│   ├── test-production-readiness.ts          # Comprehensive 12-pillar audit suite
│   ├── test-user-notifications.ts            # Saved events & notification engine test suite
│   ├── test-admin-security.ts                # Server-side authorization & security test suite
│   └── run-migration.ts                      # Direct PostgreSQL migration runner
├── vercel.json                               # Vercel deployment configuration, headers, and cron schedules
├── DEPLOYMENT.md                             # Step-by-step production deployment runbook
└── package.json
```

---

## 4. Local Development Setup

### 4.1 Prerequisites
- [Node.js](https://nodejs.org/) v20+ or v24+
- A [Supabase](https://supabase.com/) project (PostgreSQL database)

### 4.2 Installation
```bash
git clone https://github.com/Sharan126/HackMitra.git
cd HackMitra
npm install
```

### 4.3 Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_DB_PASSWORD=your-db-password
ADMIN_SECRET_KEY=hackmitra_karnataka_secure_admin_hmac_secret_2026_key
ADMIN_EMAIL=admin@hackmitra.in
ADMIN_PASSWORD=HackMitra@AdminKarnataka2026!
CRON_SECRET=hackmitra_cron_secure_token_2026
```

### 4.4 Apply Migrations to Supabase
```bash
npx tsx --env-file=.env.local scripts/run-migration.ts
```

### 4.5 Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Automated Background Worker & Scheduling

HackMitra features an autonomous discovery and verification engine that routinely sweeps configured sources, checks deadline liveness, identifies duplicates, and schedules notifications.

### Run Single Orchestration Cycle
```bash
npx tsx --env-file=.env.local scripts/worker.ts --once
```

### Run Continuous Background Daemon
```bash
# Polls sources and audits reminders every 300 seconds (5 minutes)
npx tsx --env-file=.env.local scripts/worker.ts --interval=300
```

---

## 6. Production Deployment

Refer to [`DEPLOYMENT.md`](file:///c:/Users/Lenovo/HackMitra/DEPLOYMENT.md) for detailed deployment runbooks.

**Quick Summary (Vercel + Supabase):**
1. Push your repository to GitHub.
2. Link the repository to **Vercel** (`Framework: Next.js`).
3. Add the environment variables from `.env.local` to Vercel Project Settings.
4. Vercel automatically deploys the frontend and activates the scheduled cron jobs specified in [`vercel.json`](file:///c:/Users/Lenovo/HackMitra/vercel.json).

---

## 7. Verification & Automated Test Suites

Run the automated test suites to verify system integrity before deploying to production:

```bash
# 1. 12-Pillar Production Readiness & Live Database Audit
npx tsx --env-file=.env.local scripts/test-production-readiness.ts

# 2. User Accounts, Saved Events & Email Notification Delivery
npx tsx --env-file=.env.local scripts/test-user-notifications.ts

# 3. Administrative Security, Server-Side Guards & RBAC
npx tsx --env-file=.env.local scripts/test-admin-security.ts

# 4. Search and Multi-Faceted Filtering
npx tsx --env-file=.env.local scripts/test-search-and-filtering.ts

# 5. Production Build Type Check
npm run build
```

---

## 8. Data Integrity & Honest Coverage Manifesto

1. **No Fabricated Production Data**: We never generate artificial events or fabricate live counters.
2. **Transparent District Coverage**: Districts with zero currently discovered hackathons are reported accurately as `Verified Zero (Audited)` rather than hidden or artificially populated.
3. **Evidence-Based Registration Links**: Every event detail page presents the canonical registration URL along with verifiable source proof (college circular, university portal, or platform origin).
4. **Timezone Accuracy**: All deadlines explicitly document Asia/Kolkata (`IST`) context to protect student applicants from missing cutoff times.

---

## 9. License

This project is licensed under the MIT License.
