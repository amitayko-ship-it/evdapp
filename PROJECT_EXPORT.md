# Project Export Guide — Even Derech (אבן דרך)

This document describes how to export and run the Even Derech process-management application in any environment outside of Replit.

---

## 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| PostgreSQL | 14+ (or a Neon serverless connection string) |

---

## 2. Environment Variables

Create a `.env` file in the project root (never commit this file):

```env
# Required — PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional — Google Sheets integration
GOOGLE_SHEETS_ID=10jMFkBgmVKKPaUW_Bi9n9lh4t0yQ-BXi6rEmrCD82Hw
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional — session secret (defaults to a random value; set explicitly in production)
SESSION_SECRET=your-long-random-secret
```

> **Neon (serverless PostgreSQL):** If you use Neon, paste the connection string from the Neon dashboard. No local PostgreSQL installation is required.

---

## 3. Installation

```bash
git clone <repo-url>
cd evdapp
npm install
```

---

## 4. Database Setup

Push the Drizzle schema to your PostgreSQL database (creates all tables):

```bash
DATABASE_URL=<your-connection-string> npm run db:push
```

The session table (`session`) is created automatically by `connect-pg-simple` on first server start — no manual migration needed.

### Tables created by `db:push`

| Table | Purpose |
|-------|---------|
| `users` | Instructors, office staff, warehouse, admin |
| `client_contacts` | Client company contacts (HR / Procurement) |
| `processes` | Consulting engagements (optional parent of workshops) |
| `workshops` | Individual workshop bookings |
| `equipment` | Equipment items with status state machine |
| `status_events` | Audit log of equipment status transitions |
| `monthly_reports` | Instructor activity and salary records |
| `workshop_summaries` | Post-workshop feedback and insights |
| `app_settings` | Key/value application configuration (e.g. Calendly URL) |

---

## 5. Running Locally

```bash
npm run dev
```

This starts two processes concurrently:

| Process | Command | Port |
|---------|---------|------|
| Frontend (Vite) | `npm run dev:client` | **5000** |
| Backend (Express) | `npm run dev:server` | **3001** |

Open `http://localhost:5000` in your browser. The frontend automatically proxies `/api/*` requests to the backend on port 3001.

---

## 6. Production Build & Start

```bash
# Build frontend (Vite) + backend (esbuild)
npm run build

# Start production server
npm start
```

The build outputs:
- `dist/` — compiled frontend assets served by Vite's static handler (or any CDN/web server)
- `dist/server/index.js` — compiled Node.js server bundle

Set `NODE_ENV=production` so Express uses secure session cookies and serves the built frontend.

---

## 7. Ports & Networking

| Service | Default | Environment variable |
|---------|---------|---------------------|
| Frontend / full app | `5000` | Change in `vite.config.ts` |
| Backend API | `3001` | Change in `server/index.ts` |

In production, place a reverse proxy (nginx, Caddy, etc.) in front of port 5000, or configure the frontend to be served by the same Express process by pointing the static file middleware at the `dist/` directory.

---

## 8. User Roles & First Login

Authentication is email-only (magic-link style — no passwords). To bootstrap the system:

1. Insert the first admin user directly in the database:
   ```sql
   INSERT INTO users (email, name, role) VALUES ('admin@example.com', 'Admin', 'admin');
   ```
2. Log in via the `/login` page with that email.

Available roles:

| Role | Key capabilities |
|------|----------------|
| `admin` | All permissions, user management, all equipment transitions |
| `instructor` | Create workshops, pick up / return equipment |
| `office` | View and manage processes and workshops |
| `warehouse` | Mark equipment ORDERED → READY |

---

## 9. External Integrations (Optional)

### Google Sheets
- Create a Google Cloud service account with Sheets API enabled.
- Share the target spreadsheet with the service account email (Editor).
- Set `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY` in `.env`.

### PDF Work Orders
- Generated server-side with `pdfkit` — no external service required.
- Hebrew font files are bundled in `server/fonts/`.

---

## 10. Key Files Reference

```
evdapp/
├── client/src/
│   ├── pages/           # React route components
│   ├── components/ui/   # shadcn-style UI primitives
│   ├── components/layout/  # Header, Navigation
│   ├── hooks/           # useAuth, use-toast
│   └── lib/             # queryClient setup
├── server/
│   ├── index.ts         # Express entry point (port 3001)
│   ├── routes.ts        # All API route handlers
│   ├── storage.ts       # Drizzle data-access layer
│   └── fonts/           # Noto Sans Hebrew for PDF rendering
├── shared/
│   ├── schema.ts        # Drizzle schema + EQUIPMENT_STATUS constant
│   ├── exercises-data.ts  # Predefined exercises catalogue
│   └── process-types.ts   # Process type definitions
├── drizzle.config.ts    # Drizzle Kit config
├── vite.config.ts       # Vite + proxy config
├── tailwind.config.ts   # Brand colours (blue/green/yellow)
└── package.json
```

---

## 11. Equipment Status State Machine

```
ORDERED ──(warehouse)──▶ READY ──(instructor)──▶ PICKED_UP ──(instructor)──▶ RETURNED
                                                         ▲_____________________________|
                                                         (admin can do any transition)
```

---

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `DATABASE_URL` not set error | Missing env var | Add to `.env` or export before running |
| Session lost on restart | No persistent session store | Ensure `connect-pg-simple` can reach the DB and the `session` table exists |
| Hebrew text garbled in PDF | Missing font | Confirm `server/fonts/` contains the Noto Sans Hebrew `.ttf` files |
| `/api/*` returns 404 in dev | Backend not running | Run both `dev:client` and `dev:server` (or just `npm run dev`) |
| DB push fails | Wrong driver version | Use `drizzle-kit` 0.20.x matching `package.json` |
