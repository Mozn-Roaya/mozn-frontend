# Mozn — Admin Dashboard

The operator control plane for the **Mozn early-warning system**. MOZN operators
use it to monitor the station network, triage and act on alerts, tune alerting
thresholds, manage users and access, and review history and audit logs.

It is a **frontend-only Next.js app** (this folder is `web/`). It talks to the
Mozn backend API — a separate Go service — over REST + Server-Sent Events. The
backend is **not** in this repository.

> Part of the [`mozn-frontend`](../README.md) repo. See the root
> [`docs/`](../docs) for architecture, the API contract, styling, i18n and
> deployment.

---

## Screens

All screens live in the `(dashboard)` route group behind one shared shell
(sidebar + topbar), gated by authentication.

| Route | Purpose |
| --- | --- |
| `/` | **Dashboard overview** — stat strip, station health map, needs-attention, charts |
| `/stations` | **Station list** grouped by region · `/stations/new` · `/stations/[id]/edit` |
| `/alert-inbox` | **Alert triage** — acknowledge / escalate / confirm / reject incoming alerts |
| `/active-alerts` | **Active alerts** — manage live and recently-resolved confirmed alerts |
| `/alerts` | **Thresholds & compound rules** editor with impact preview |
| `/alert-templates` | **Response-plan / message templates** |
| `/users` | **Users & access** — roles and the permission matrix |
| `/history` | **Alert history** with range filter |
| `/activity` | **Audit / activity log** |
| `/settings` | **System settings** and validation rules |
| `/login` | Sign-in (outside the shell) |

---

## Tech stack

- **Next.js 16** (App Router, React Server Components) + **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first `@theme` tokens) · **shadcn/ui** (new-york, on Radix)
- **recharts** via shadcn Charts · **Leaflet** (direct) for the station map
- **next-themes** (class-based dark mode) · **lucide-react** icons · **date-fns**
- Real-time updates over **Server-Sent Events**; live server state fetched with
  `cache: "no-store"`

---

## Getting started

**Prerequisites:** Node.js ≥ 18.18 (20+ recommended), npm, and a reachable Mozn
backend API.

```bash
cd mozn-dashboard/web
npm install
cp .env.example .env.local     # set API_BASE_URL → the backend origin
npm run dev                    # http://localhost:3001 (via ../../dev.sh) or :3000 standalone
```

### Environment

| Variable | Default | Notes |
| --- | --- | --- |
| `API_BASE_URL` | `http://localhost:8080` | **Server-side only** — the Go backend origin. Never exposed to the browser. |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |

---

## Architecture

### Authentication (real)

Auth is a JWT stored in an **httpOnly cookie** (`mozn_dash_token`), so the token
never reaches client JavaScript:

1. `/login` posts credentials to the `app/api/auth/login` route handler, which
   calls the backend and sets the cookie.
2. The `(dashboard)/layout.tsx` **server** component gates every screen: it calls
   `getCurrentUser()` (`/api/me`) and redirects to `/login` on failure. (There is
   no `middleware.ts` — the layout is the gate.)
3. `lib/backend.ts` reads the cookie and attaches `Authorization: Bearer <jwt>` to
   every backend call; a 401 throws `AuthError`.
4. SSE is authenticated via a same-origin proxy (`app/api/events`) that forwards
   the token upstream, since `EventSource` can't send headers.

Access control is **permission-based**: `RouteGuard` uses `can(permission)` from
the session, and each nav item declares a `permission` in
`components/layout/nav-config.ts`. The backend enforces the same permissions.

### Data layer (two server-only layers)

- **`lib/backend.ts`** — low-level transport to the backend (`backendFetch`,
  `backendData`, `backendMutate`, `getCurrentUser`, `loginToBackend`). Reads
  `API_BASE_URL`, unwraps the `{ data, metadata }` envelope, `cache: "no-store"`.
- **`lib/api.ts`** — adapter layer: named getters/writers that shape backend DTOs
  into the client-safe view models in `types/*` (e.g. `getDashboardOverview`,
  `getStations`, `getAlertInbox`, `getThresholds`, plus alert actions and CRUD).

Both are `import "server-only"` — **client components cannot import them**. Client
components call the thin **same-origin proxy handlers** under `app/api/*` instead
(e.g. `app/api/stations`, `app/api/alerts/[id]/[action]`), which attach the JWT and
forward to the backend.

### Real-time

Mounted once in `(dashboard)/layout.tsx`:

- **`app/api/events`** — SSE proxy to the backend (`runtime = "nodejs"`, no cache).
- **`events-provider`** — opens an `EventSource`; on `alert.*` / `station.*` events
  it pushes bell notifications/toasts and coalesces a `router.refresh()` (~800ms).
  Reconnects with capped exponential backoff.
- **`auto-refresh`** — optional polling fallback (interval from Settings; off by
  default; only refreshes while the tab is visible).

### Providers

Root layout: `ThemeProvider` (next-themes, class-based dark). Then in the
dashboard layout, seeded from the real session:

```
LocaleProvider → RoleProvider → AdminConfigProvider
  (+ EventsProvider, AutoRefresh, Toaster)
```

### Project structure

```
web/
├── app/
│   ├── layout.tsx              Root <html>, fonts, ThemeProvider
│   ├── globals.css             Tailwind v4 + Figma design tokens
│   ├── login/                  Sign-in (no shell)
│   ├── api/                    Same-origin proxy handlers (auth, events, CRUD)
│   └── (dashboard)/            All screens behind the auth-gated shell
├── components/
│   ├── ui/                     shadcn/ui primitives (Radix)
│   ├── layout/                 Sidebar, Topbar, nav-config, route-guard, menus
│   ├── common/                 PageHeading, StatCard, status badges, …
│   ├── data-table/             Sortable head, faceted filter, selection bar, pagination
│   ├── maps/                   Leaflet Libya map + station location picker
│   ├── station-detail/         Station summary card + types
│   └── providers/              theme, locale, role, admin-config, events, auto-refresh
├── features/<area>/            Per-screen components + types (dashboard, stations, …)
├── hooks/                      use-mounted, use-pagination, use-reduced-motion
├── lib/                        backend.ts (transport) + api.ts (adapters) + i18n + utils
└── types/                      Client-safe view-model types
```

---

## Conventions

Bilingual **EN/AR + RTL always**, **token-first** styling (no raw hex), and
**reuse before build** (shadcn primitives + existing feature components). See the
root [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [`docs/`](../docs) for the full
rules.
