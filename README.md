<div align="center">

# 💼 JobTrack — Job Application Tracking System

<p>A production-ready <strong>Full-Stack Job Tracker</strong> built with React, TypeScript & PocketBase</p>

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-Fast-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/PocketBase-Backend-0EA5E9?style=for-the-badge" />
</p>

<p>
  <img src="https://img.shields.io/badge/SQLite-Embedded-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Railway-Backend-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

</div>

---

## 📌 Overview

**JobTrack** is a modern, multi-user job application tracking system designed to help users manage their job search efficiently.

It provides **secure data isolation**, **intuitive analytics**, and **resume management**, making it ideal for students, job seekers, and professionals.

---

## 🏗️ Architecture

```
Browser (React App)
│
▼
┌──────────────────────┐
│   Vercel Frontend    │  (React + Vite + nginx)
└─────────┬────────────┘
          │ REST API (HTTPS)
          ▼
┌──────────────────────┐
│   PocketBase API     │  (Go binary on Railway)
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  SQLite DB + Files   │  (Railway persistent volume)
└──────────────────────┘
```

| Layer | Role |
|-------|------|
| 🌐 Frontend | UI, routing, charts, state management — hosted on Vercel |
| ⚙️ Backend | Auth, REST API, file storage — PocketBase on Railway |
| 🗄️ Database | SQLite embedded in PocketBase, persisted via Railway volume |

---

## ✨ Features

### 🔐 Authentication & Security
- Multi-user system with **strict data isolation** — enforced at database level
- JWT-based authentication with auto-refresh via PocketBase SDK
- Server-side access rules prevent any cross-user data access

### 📊 Job Management
- Add / Edit / Delete job applications
- Fields: company, role, job link, status, location, CTC, company rating, notes
- Attach **resume PDFs** per application (max 5MB, PDF only)

### 🔍 Search & Filtering
- Search by company name or role
- Filter by status and location
- Paginated results (10 per page)

### 📈 Dashboard & Analytics
- Total applications count and per-status breakdown
- Donut chart visualization powered by Chart.js

### 🎨 UI/UX
- Fully responsive — mobile and desktop
- Clean, minimal UI with dark mode (auto system preference)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite 5 |
| Backend | PocketBase 0.22 (Go) |
| Database | SQLite (embedded in PocketBase) |
| Charts | Chart.js 4 + react-chartjs-2 |
| Routing | React Router v6 |
| Frontend hosting | Vercel |
| Backend hosting | Railway |
| Containerization | Docker + nginx |

---

## ✅ Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | Latest |
| PocketBase binary | Latest |
| Docker *(optional, for local container testing)* | Latest |

---

## 🚀 Local Development

### 1️⃣ Clone & install dependencies

```bash
git clone <your-repo-url>
cd jobtrack
npm install
```

### 2️⃣ Download and run PocketBase

Download the PocketBase binary for your OS from [pocketbase.io](https://pocketbase.io/docs/).

```bash
# macOS / Linux
chmod +x pocketbase
./pocketbase serve

# Windows
pocketbase.exe serve
```

Admin UI will be available at: `http://127.0.0.1:8090/_/`

### 3️⃣ Import the database schema

1. Open `http://127.0.0.1:8090/_/` in your browser
2. Create your admin account (first time only)
3. Go to **Settings → Import Collections**
4. Upload `pocketbase_schema.json` from the project root
5. Click **Review** → **Confirm and import**

### 4️⃣ Configure environment

```bash
cp .env.example .env.local
```

The default `.env.local` already points to local PocketBase — no changes needed:

```
VITE_PB_URL=http://127.0.0.1:8090
```

### 5️⃣ Start the frontend dev server

```bash
npm run dev
```

App runs at: `http://localhost:5173`

> Keep both terminals running — one for PocketBase (`./pocketbase serve`) and one for Vite (`npm run dev`).

---

## 📡 Security Rules

Data isolation is enforced at the **PocketBase collection rule level**, not just the frontend. Even direct API calls are rejected if the authenticated user doesn't own the record.

```
listRule:   "@request.auth.id = user"
viewRule:   "@request.auth.id = user"
createRule: "@request.auth.id != \"\""
updateRule: "@request.auth.id = user"
deleteRule: "@request.auth.id = user"
```

> ⚠️ Note: Rules use `= user` (direct ID comparison), not `= user.id` — this is correct for PocketBase's relation field syntax.

✅ Prevents unauthorized cross-user data access  
✅ Server-side enforcement — bypassing the frontend UI has no effect

---

## 🐳 Docker

The project includes two Dockerfiles — one for each service.

### Frontend (React + nginx)

```bash
# Build the image (VITE_PB_URL is required at build time)
docker build \
  --build-arg VITE_PB_URL=http://127.0.0.1:8090 \
  -t jobtrack-frontend .

# Run locally (nginx listens on $PORT, defaults to 8080)
docker run -p 8080:8080 jobtrack-frontend
```

> `VITE_PB_URL` must be passed as a **build argument** — Vite bakes it into the JS bundle at compile time and cannot read it at runtime.

### PocketBase backend

```bash
# Build
docker build -f Dockerfile.pocketbase -t jobtrack-pb .

# Run locally (data stored in ./pb_data on your host)
docker run -p 8090:8090 -v $(pwd)/pb_data:/pb/pb_data jobtrack-pb
```

> There is no `docker-compose.yml` in this project. Services are deployed independently to Vercel (frontend) and Railway (backend).

---

## ☁️ Deployment

### 🔹 Backend — Railway (PocketBase)

1. Push the repo to GitHub
2. On [railway.app](https://railway.app), create a new project → **Deploy from GitHub repo**
3. In the service **Variables** tab, add:

   | Variable | Value |
   |----------|-------|
   | `RAILWAY_DOCKERFILE_PATH` | `Dockerfile.pocketbase` |

4. Go to **Settings → Networking → Generate Domain** to get your public URL
5. **Attach a persistent volume** (right-click service on canvas → Attach Volume):
   - Mount path: `/pb/pb_data`
6. Open `https://your-pb-domain.up.railway.app/_/` and import `pocketbase_schema.json`

### 🔹 Frontend — Vercel (React)

1. On [vercel.com](https://vercel.com), import the same GitHub repo
2. Add environment variable (mark it as a **Build Variable**):

   | Variable | Value |
   |----------|-------|
   | `VITE_PB_URL` | `https://your-pb-domain.up.railway.app` |

   > No trailing slash. `VITE_PB_URL` must be a Build Variable — Vercel must pass it during `npm run build`, not at runtime.

3. Deploy — `vercel.json` handles SPA routing automatically

---

## 📁 Project Structure

```
jobtrack/
│
├── Dockerfile                  # Frontend — multi-stage Node + nginx build
├── Dockerfile.pocketbase       # Backend — PocketBase binary on Alpine
├── docker-entrypoint.sh        # Injects Railway $PORT into nginx at startup
├── nginx.conf                  # nginx config — SPA routing + asset caching
│
├── .env.example                # Environment variable template
├── vercel.json                 # Vercel SPA rewrite rules
├── pocketbase_schema.json      # PocketBase collection schema + access rules
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── App.tsx                 # Root router + AuthProvider
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles + CSS design tokens
│   │
│   ├── lib/
│   │   └── pb.ts               # PocketBase client instance
│   │
│   ├── types/
│   │   └── index.ts            # TypeScript types + constants
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx         # Auth context — login, register, logout
│   │   └── useJobs.ts          # CRUD operations for job applications
│   │
│   ├── components/
│   │   ├── JobModal.tsx        # Add / Edit job form modal
│   │   ├── ProtectedRoute.tsx  # Auth guard — redirects to /auth if not logged in
│   │   ├── StatusBadge.tsx     # Colour-coded status pill
│   │   └── StatsChart.tsx      # Donut chart with legend
│   │
│   └── pages/
│       ├── Auth.tsx            # Login + Register page
│       └── Dashboard.tsx       # Main dashboard
│
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔮 Future Improvements

- 📅 Interview scheduling with calendar view
- 📧 Email reminders (Resend / SMTP integration)
- 📊 Advanced analytics — application rate over time, conversion by company
- 📂 Resume version tracking — link multiple resume versions per application
- 🔐 OAuth login (Google / GitHub) via PocketBase OAuth2

---

## 📜 Scripts

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + production build → dist/
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

---

<div align="center">

⭐ Built for developers & job seekers  
💡 Clean • Secure • Scalable

</div>
