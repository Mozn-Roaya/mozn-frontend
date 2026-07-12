# Mozn — Early Warning System · Front-ends

The two web front-ends for **Mozn**, a weather early-warning platform for Libya:

| App | Path | Audience | Role |
| --- | --- | --- | --- |
| **Admin dashboard** | `mozn-dashboard/web/` | MOZN operators | Monitor stations, triage the alert inbox, manage active alerts, tune thresholds, manage users, review history |
| **Public map app** | `mozn-public/frontend/` | Citizens | Live map of stations, active alerts, and the 7-day forecast |

Both are **Next.js (App Router)** apps that talk to the same **Mozn backend API**
(a separate Go service) over REST + a real-time SSE stream. They're typed against
that JSON contract and are fully bilingual — **Arabic / English with right-to-left**.

> The backend API (ingestion, alert engines, database, SSE hub) lives in its own
> repository/service. These apps only need its base URL.

---

## Shared stack

- **Next.js** (App Router, React Server Components) · **React** · **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first `@theme` design tokens) · **shadcn/ui** (new-york, on Radix)
- **Leaflet** for the public map · **recharts** (via shadcn Charts) on the dashboard
- **Server-Sent Events** consumed via `EventSource` → `router.refresh()` for live updates
- Lightweight bilingual i18n (EN + AR) with full RTL — no i18n library

---

## Getting started

**Prerequisites:** Node.js ≥ 18.18 (20+ recommended) · npm · a running Mozn backend API.

### Admin dashboard

```bash
cd mozn-dashboard/web
npm install
cp .env.example .env.local     # set API_BASE_URL → the backend origin
npm run dev                    # http://localhost:3000
```

### Public map app

```bash
cd mozn-public/frontend
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_API_BASE → the backend origin
npm run dev                    # http://localhost:3000 (use a different port if the dashboard is running)
```

> Each app is independent — run whichever you need. Both require the backend API
> to be reachable to load data. In production they deploy as separate origins
> (e.g. a `dashboard.` subdomain and the public root domain).

---

## Per-app commands

Both apps share the same scripts (run from the app's directory):

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` *(dashboard)* |
| `npm run test` | Vitest *(public app)* |

---

## Layout

```
mozn-dashboard/web/          # Admin dashboard (Next.js)
  app/(dashboard)/           #   screens: overview, alert-inbox, active-alerts,
                             #   alerts (thresholds), stations, users, history, settings…
  features/<area>/           #   per-screen components + types
  components/                #   shared UI, layout shell, maps, providers
  lib/                       #   server-only API layer (lib/api.ts) + i18n

mozn-public/frontend/        # Public map app (Next.js)
  app/(app)/                 #   map (/) + station detail (/stations/:id)
  features/{map,station,alerts}/
  components/                #   API client, UI, i18n
```

---

## Configuration

Each app reads its own environment (`.env.local`, gitignored):

| App | Var | Points to |
| --- | --- | --- |
| Dashboard | `API_BASE_URL` | Backend origin (server-side fetches) |
| Public app | `NEXT_PUBLIC_API_BASE` | Backend origin (client + server) |

Each app's own `README.md` covers its specifics. **Always add both `en` and `ar`
copy** when adding UI text, and use logical Tailwind utilities (`ps/pe/ms/me`,
`text-start`) so RTL mirrors correctly.
