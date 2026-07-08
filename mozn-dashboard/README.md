# MOZN — Early Warning System · Admin Dashboard

A faithful, production-grade implementation of the **Dashboard** section of the
_Mozn | Early Warning System_ Figma design. The frontend reproduces the admin
panel — the "System Overview" dashboard plus every screen behind the sidebar
navigation — inside one shared shell (sidebar + topbar). The backend is a
cleanly layered Go service that serves the exact data each screen displays.

### Screens

| Route          | Figma screen            | Highlights                                             |
| -------------- | ----------------------- | ------------------------------------------------------ |
| `/`            | A1 — Dashboard          | Stat strip, station health map, needs-attention, chart |
| `/stations`    | A2.0 — Station List     | Grouped, collapsible table · signal/battery · filters  |
| `/alert-inbox` | A3.3 — Station Alert Inbox | Triage cards · SLA chips · acknowledge/escalate     |
| `/alerts`      | A3.0 — Alerts & Thresholds | Tier editor · impact preview · threshold scale       |
| `/users`       | A4.0 — Users & Access   | Roles · assigned regions · status · search/filter      |
| `/history`     | A5.0 / A5.1 — History & Audit | Alert history + activity log (tabs)              |
| `/settings`    | A6.0 — Settings         | Config selects · notification toggles · validation     |

---

## Tech stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | Next.js (App Router) · TypeScript                       |
| Styling    | Tailwind CSS v4 (CSS-first `@theme` design tokens)      |
| Components | shadcn/ui (new-york) · **shadcn/ui Charts** (recharts)  |
| Backend    | Go (standard library, layered architecture)             |

---

## Project structure

```
mozn-dashboard/
├── web/                         # Next.js frontend
│   ├── app/
│   │   ├── layout.tsx           # root: Poppins font, globals
│   │   ├── globals.css          # Tailwind v4 + design tokens from Figma
│   │   └── (dashboard)/
│   │       ├── layout.tsx       # shared shell: Sidebar + Topbar
│   │       ├── page.tsx         # Dashboard — fetches API, composes sections
│   │       ├── loading.tsx      # skeleton state
│   │       ├── error.tsx        # error state
│   │       ├── stations/        # one folder per nav route (page.tsx each)
│   │       ├── alert-inbox/ · alerts/ · users/ · history/ · settings/
│   ├── components/
│   │   ├── ui/                  # shadcn primitives (button, card, chart, table, …)
│   │   ├── layout/              # Sidebar, Topbar, NavList, UserCard
│   │   ├── admin/               # shared: page heading, filter tabs, status badges
│   │   ├── dashboard/           # dashboard panels
│   │   ├── stations/ · alert-inbox/ · thresholds/ · users/ · history/ · settings/
│   │   └── maps/                # inlined Libya map SVG
│   ├── lib/                     # api client (server-side), utils
│   ├── types/                   # end-to-end TS types (mirror Go model)
│   └── …                        # config (tailwind via postcss, tsconfig, …)
│
├── server/                      # Go backend
│   ├── cmd/api/main.go          # entrypoint: wiring + graceful shutdown
│   └── internal/
│       ├── model/               # domain types & JSON contract
│       ├── repository/          # in-memory data source (seeded from Figma)
│       ├── service/             # business logic
│       └── handler/             # HTTP routing, endpoint, middleware (CORS, …)
│
└── README.md
```

### Architecture notes

- **Separation of concerns.** Go follows `handler → service → repository`; each
  layer depends only on the interface below it, so the in-memory store can be
  replaced by a database without touching handlers.
- **Typed end to end.** `web/types/dashboard.ts` mirrors `server/internal/model`
  one-to-one, so the JSON contract is the single source of truth.
- **Data fetching.** The dashboard is a Server Component that fetches the Go API
  through a centralized server-side client (`lib/api.ts`), with `loading` and
  `error` UI handled by the App Router.
- **Design tokens.** Colors, typography, radii and elevation are extracted from
  the Figma variables into Tailwind v4 `@theme` tokens — no scattered hex values.
- **Charts.** The "Stations by region" panel uses **shadcn/ui Charts** (recharts
  horizontal bar chart). The Station Health Map is a geographic SVG (not a chart).

---

## Prerequisites

- **Node.js** ≥ 18.18 (20+ recommended) and npm
- **Go** ≥ 1.22

---

## Running locally

Run the two apps in separate terminals.

### 1. Backend (Go) — port `8080`

```bash
cd server
go run ./cmd/api
```

Endpoints:

- `GET /api/v1/dashboard/overview` — dashboard payload
- `GET /api/v1/stations` — stations list (grouped by region)
- `GET /api/v1/alert-inbox` — triage queue
- `GET /api/v1/thresholds` — alert thresholds + change history
- `GET /api/v1/users` — users & access
- `GET /api/v1/history/alerts` — alert history
- `GET /api/v1/history/activity` — activity / audit log
- `GET /api/v1/settings` — system settings
- `GET /healthz` — liveness check

Environment variables (optional):

| Variable          | Default                  | Description                       |
| ----------------- | ------------------------ | --------------------------------- |
| `PORT`            | `8080`                   | Listen port                       |
| `ALLOWED_ORIGINS` | `http://localhost:3000`  | Comma-separated CORS allow-list   |

### 2. Frontend (Next.js) — port `3000`

```bash
cd web
cp .env.example .env.local   # optional; defaults to http://localhost:8080
npm install
npm run dev
```

Open http://localhost:3000.

The frontend reads `API_BASE_URL` (server-side) to reach the Go backend. If the
backend is unreachable, the dashboard shows its error state with a retry action.

---

## Scripts

**web/**

| Command            | Description                |
| ------------------ | -------------------------- |
| `npm run dev`      | Start the dev server       |
| `npm run build`    | Production build           |
| `npm run start`    | Serve the production build |
| `npm run typecheck`| TypeScript checks          |

**server/**

| Command              | Description        |
| -------------------- | ------------------ |
| `go run ./cmd/api`   | Run the API        |
| `go build ./...`     | Compile everything |
| `go vet ./...`       | Static analysis    |
```
