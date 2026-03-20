# JobTrack — Job Application Tracking System

A production-ready, multi-user job application tracker built with React + TypeScript + PocketBase.

## Features

- **Multi-user with full data isolation** — each user sees only their own data, enforced at the database level
- **Job management** — add, edit, delete applications with company, role, link, location, status, CTC, rating, notes, resume PDF
- **Search & filters** — search by company/role, filter by status and location
- **Dashboard stats** — total applications, per-status counts, donut chart visualization
- **PDF resume upload** — upload and link resumes to applications (validated server-side)
- **Responsive** — works on desktop and mobile
- **Dark mode** — automatically adapts to system preference

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, TypeScript, Vite        |
| Backend   | PocketBase (SQLite, Go)           |
| Hosting   | Vercel (frontend), any VPS (PB)   |
| Charts    | Chart.js + react-chartjs-2        |
| Routing   | React Router v6                   |

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url>
cd jobtrack
npm install
```

### 2. Set up PocketBase

Download PocketBase from https://pocketbase.io/docs/

```bash
# Linux/macOS
./pocketbase serve

# Windows
pocketbase.exe serve
```

PocketBase admin UI will be at: http://127.0.0.1:8090/_/

### 3. Import the schema

1. Open PocketBase Admin UI → Settings → Import collections
2. Upload `pocketbase_schema.json`
3. Confirm import

This creates the `jobs` collection with all fields and security rules pre-configured.

### 4. Configure environment

```bash
cp .env.example .env.local
# .env.local is already set to http://127.0.0.1:8090 for local dev
```

### 5. Start the dev server

```bash
npm run dev
# App runs at http://localhost:5173
```

---

## Deployment

### Deploy PocketBase (backend)

PocketBase is a single binary — run it on any VPS (DigitalOcean, Hetzner, Railway, Fly.io, etc.)

```bash
# On your server
./pocketbase serve --http="0.0.0.0:8090"

# Recommended: run behind nginx with SSL
# Example nginx config:
# server {
#   listen 443 ssl;
#   server_name pb.yourdomain.com;
#   location / { proxy_pass http://localhost:8090; }
# }
```

**After deploying PocketBase:**
1. Open `https://pb.yourdomain.com/_/` and create your admin account
2. Import `pocketbase_schema.json` via Settings → Import collections

### Deploy Frontend to Vercel

1. Push this repo to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add environment variable in Vercel dashboard:
   - `VITE_PB_URL` = `https://pb.yourdomain.com`
4. Deploy — Vercel handles the build automatically

`vercel.json` is already configured to handle SPA routing (all routes → `index.html`).

---

## Security Architecture

Data isolation is enforced at the **PocketBase collection rule level**, not just in the frontend:

```
listRule:   "@request.auth.id = user.id"
viewRule:   "@request.auth.id = user.id"
createRule: "@request.auth.id != ''"
updateRule: "@request.auth.id = user.id"
deleteRule: "@request.auth.id = user.id"
```

This means even if someone calls the PocketBase API directly with another user's token, they cannot read or modify another user's job records. The server rejects the request.

Additional security measures:
- PDF uploads are MIME-type validated server-side (only `application/pdf` accepted)
- File size limit: 5MB per resume
- Passwords are hashed by PocketBase using bcrypt
- JWT-based auth tokens with automatic refresh

---

## Project Structure

```
jobtrack/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── JobModal.tsx          # Add/Edit job form modal
│   │   ├── JobModal.module.css
│   │   ├── ProtectedRoute.tsx    # Auth guard for routes
│   │   ├── StatusBadge.tsx       # Color-coded status pill
│   │   ├── StatusBadge.module.css
│   │   ├── StatsChart.tsx        # Donut chart + legend
│   │   └── StatsChart.module.css
│   ├── hooks/
│   │   ├── useAuth.tsx           # Auth context + login/register/logout
│   │   └── useJobs.ts            # CRUD operations for jobs
│   ├── lib/
│   │   └── pb.ts                 # PocketBase client instance
│   ├── pages/
│   │   ├── Auth.tsx              # Login + Register page
│   │   ├── Auth.module.css
│   │   ├── Dashboard.tsx         # Main dashboard
│   │   └── Dashboard.module.css
│   ├── types/
│   │   └── index.ts              # TypeScript types + constants
│   ├── App.tsx                   # Router + AuthProvider
│   ├── index.css                 # Global styles + design tokens
│   └── main.tsx                  # Entry point
├── .env.example                  # Environment variable template
├── .gitignore
├── index.html
├── package.json
├── pocketbase_schema.json        # DB schema — import into PocketBase
├── tsconfig.json
├── vercel.json                   # Vercel SPA routing config
└── vite.config.ts
```

---

## Extending the App

### Add email reminders (future)
- Use PocketBase hooks (JS hooks or Go hooks) to trigger emails on status change
- Integrate with Resend, SendGrid, or SMTP

### Add interview scheduling
- Add `interview_date` field to the `jobs` collection schema
- Display upcoming interviews in a calendar view

### Add resume version tracking
- Create a separate `resumes` collection linked to users
- Allow selecting from previously uploaded resumes per job

### Analytics
- Add a `/analytics` route using Chart.js bar charts
- Track application rate over time, conversion rates by company size, etc.

---

## Scripts

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```
