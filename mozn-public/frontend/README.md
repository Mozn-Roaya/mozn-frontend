# Mozn — Public Map App

The citizen-facing web app for the **Mozn early-warning system**. It shows Libya's
weather stations on an interactive map, with per-station live readings, history
charts, multi-day forecasts, and live hazard warnings.

It is a **frontend-only Next.js app** (this folder is `frontend/`). It reads from
the Mozn backend API — a separate service — over REST + Server-Sent Events. The
backend is **not** in this repository.

> Part of the [`mozn-frontend`](../../README.md) repo. See the root
> [`docs/`](../../docs) for architecture, the API contract, styling, i18n and
> deployment.

---

## What it does

- **Map view (`/`)** — an interactive Leaflet map of Libya with a station pin for
  each site. Pin colour reflects the worst of the station's operational status and
  its active/forecast alerts. "Stations near me" uses geolocation. The map is the
  whole page; selecting a station opens a side rail.
- **Station detail (`/stations/[id]`)** — latest reading, a 3-day forecast, and any
  live warning banner. Offline stations show a dedicated state.
- **Charts (`/stations/[id]/charts`)** — a 2×2 history grid (temperature, rain,
  wind, pressure) over a selectable range.
- **Data (`/stations/[id]/data`)** — export station readings as CSV.
- **Share (`/stations/[id]/share`)** — a public link + embed snippet.
- **Component showcase (`/components`)** — an internal library/demo page (not part
  of the citizen flow).

Everything is **bilingual (EN/AR) with full RTL** and live-updates over SSE.

---

## Tech stack

- **Next.js 16** (App Router, RSC) + **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first `@theme` tokens, two-tier semantic layer)
- **Leaflet 1.9** for the map (direct API — no react-leaflet)
- **recharts** for the history charts · **lucide-react** icons
- **Vitest** + Testing Library for unit/characterization tests
- Attribute-based dark mode (`data-theme`) with a pre-hydration boot script

---

## Getting started

**Prerequisites:** Node.js ≥ 18.18 (20+ recommended), npm, and a reachable Mozn
backend API.

```bash
cd mozn-public/frontend
npm install
cp .env.example .env.local     # point NEXT_PUBLIC_API_BASE / MOZN_API_BASE at the backend
npm run dev                    # http://localhost:3000
```

### Environment

| Variable | Default | Used by |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | `https://mozn.org.ly/api` | Direct **server-side** fetches |
| `MOZN_API_BASE` | `https://mozn.org.ly/api` | The `/api/proxy` and `/api/events` route handlers (browser) |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (**pinned to `--webpack`** — see Gotchas) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config) |
| `npm run test` | Vitest (`test:watch` for watch mode) |

TypeScript check: `npx tsc --noEmit` (no script alias).

---

## Architecture

### Data layer (`components/api/`)

- **`client.ts`** — `apiFetch<T>()` returns the **unwrapped `data`** from the
  backend envelope `{ data, message?, metadata?, code?, error? }`;
  `apiFetchEnvelope<T>()` keeps the envelope (used for `metadata.total` pagination).
- **Fetch routing** — `buildUrl` branches on `typeof window`: **server-side** goes
  straight to `NEXT_PUBLIC_API_BASE`; **client-side** goes through the app's own
  `/api/proxy/[...path]` route to avoid mixed-content/CORS. Pass `revalidate` (maps
  to `next: { revalidate }`), or `fresh: true` for `no-store`.
- **Endpoints:** `/public/stations`, `/public/stations/:id`,
  `/public/stations/nearest`, `/public/readings`, `/public/readings/history`,
  `/public/forecasts/daily`, `/public/alerts`, and the `/public/events` SSE stream.
- The station **detail** endpoint omits `status` / `active_alerts` /
  `forecast_alerts`; `getStation()` backfills them from the list endpoint.

### Real-time (SSE)

`app/api/events/route.ts` proxies the backend's `/public/events` stream same-origin.
`components/state/events-listener.tsx` opens an `EventSource`, and on `alert.*` /
`station.*` events it shows a toast and coalesces a debounced `router.refresh()` so
map pins and open panels update live. It reconnects with capped exponential backoff.

### Map (`features/map/`)

`map-canvas.tsx` dynamically imports `leaflet-libya-map.tsx` with **`ssr: false`**
(Leaflet touches `window`). The map draws Libya's GeoJSON outline over a masked
world scrim, renders station pins as `L.divIcon` (built by a pure
`stationIconHtml()` that escapes all dynamic text), and flies the camera only on
selection changes — so an SSE refresh never resets the user's pan/zoom.

### Structure

```
frontend/
├── app/
│   ├── layout.tsx              Root <html lang/dir>, fonts, theme boot script
│   ├── globals.css             Tailwind v4 tokens + Leaflet overrides + .mz-pin styles
│   ├── (app)/                  Map shell: TopBar + MapCanvas + providers; station rail
│   └── api/
│       ├── proxy/[...path]/    Browser → upstream reverse proxy
│       └── events/             SSE proxy
├── components/
│   ├── api/                    Data-fetch layer (client, stations, readings, forecasts, alerts, types)
│   ├── state/                  StationsProvider, LanguageProvider, EventsListener
│   ├── ui/                     TopBar, IconButton, Logo, StationSearch, language/theme toggles, chart
│   ├── lib/                    cn, i18n, lang-server
│   ├── icons/                  Inline SVG icon set (reuse — don't add an icon package)
│   └── library/                Primitives for the /components showcase only
├── features/
│   ├── map/                    Leaflet map, pins (html/status/theme libs), GeoJSON data
│   ├── station/                Side panel, overview, charts, CSV export, share
│   └── alerts/                 Warning banner + severity/hazard libs
└── test/                       Vitest setup + fixtures
```

---

## Gotchas

- **Dev is pinned to `next dev --webpack`.** Turbopack dev crashes on the
  `/stations/:id` overview route (`Jest worker encountered … exceeding retry
  limit`), which then kills the dev worker for every route. `next build`
  (production Turbopack) is unaffected — don't revert `dev` to plain `next dev`
  without re-testing that route.
- **Stale `.next/dev/lock`** after a hard kill blocks startup ("Unable to acquire
  lock"). Delete `.next/dev/lock` and retry.
- **Pin HTML is a raw string** inserted via Leaflet `divIcon` — anything dynamic
  must go through `escapeHtml()`. Don't interpolate untrusted data unescaped.

---

## Conventions

Bilingual **EN/AR + RTL always**, **token-first** styling (no raw hex), and
**reuse before build** (existing icons/components). See the root
[`CONTRIBUTING.md`](../../CONTRIBUTING.md) and [`docs/`](../../docs).
