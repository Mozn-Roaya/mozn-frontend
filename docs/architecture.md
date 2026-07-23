# Architecture

Mozn is a weather **early-warning platform for Libya**. This repository holds its
**two web front-ends**; the backend (ingestion, alert engines, database, SSE hub)
is a separate Go service reached over HTTP.

| App | Path | Audience | Origin (prod) |
| --- | --- | --- | --- |
| Public map app | `mozn-public/frontend` | Citizens | `mozn.org.ly` |
| Admin dashboard | `mozn-dashboard/web` | MOZN operators | `dashboard.mozn.org.ly` |

Both are **Next.js 16 (App Router, RSC) + React 19 + TypeScript** apps, styled with
**Tailwind v4** design tokens, **bilingual (EN/AR) with full RTL**, and updated
live over **Server-Sent Events**. They are deployed and operated **independently**
— there is no shared build and no proxy between them.

---

## System overview

```mermaid
flowchart TB
    citizen([Citizen]):::user
    operator([MOZN operator]):::user

    subgraph repo["mozn-frontend (this repo)"]
        public["Public map app<br/>mozn-public/frontend<br/>mozn.org.ly"]:::app
        dash["Admin dashboard<br/>mozn-dashboard/web<br/>dashboard.mozn.org.ly"]:::app
    end

    backend["Mozn backend API<br/>(separate Go service)<br/>REST + SSE"]:::backend
    db[("Database &<br/>alert engines")]:::infra

    citizen --> public
    operator --> dash
    public -->|"REST + SSE (public endpoints)"| backend
    dash -->|"REST + SSE (authenticated)"| backend
    backend --- db

    classDef user fill:#e8f0fe,stroke:#4285f4,color:#1a1a1a;
    classDef app fill:#e6f4ea,stroke:#34a853,color:#1a1a1a;
    classDef backend fill:#fef7e0,stroke:#f9ab00,color:#1a1a1a;
    classDef infra fill:#f1f3f4,stroke:#9aa0a6,color:#1a1a1a;
```

The two apps consume the **same backend** but different surfaces of it: the public
app calls unauthenticated `/public/*` endpoints; the dashboard calls authenticated
`/api/*` endpoints with a JWT.

---

## Data flow

Both apps follow the same principle: **the browser never talks to the backend
directly.** Server Components fetch server-side, and anything the browser needs
goes through a thin same-origin route handler. This hides backend URLs/tokens and
sidesteps CORS/mixed-content.

```mermaid
flowchart LR
    subgraph browser["Browser"]
        rsc["Server-rendered<br/>page (RSC)"]
        client["Client components"]
    end

    subgraph nextapp["Next.js app (server)"]
        sc["Server Components<br/>+ server-only fetch layer"]
        proxy["Route handlers<br/>/api/* (proxy)"]
        sse["/api/events<br/>(SSE proxy)"]
    end

    backend["Mozn backend API"]:::backend

    rsc -.hydrate.-> client
    sc -->|"server-only fetch"| backend
    client -->|"fetch /api/*"| proxy
    proxy --> backend
    client -->|"EventSource"| sse
    sse ==>|"stream"| backend
    sse -. "alert.* / station.*" .-> client
    client -->|"router.refresh()"| sc

    classDef backend fill:#fef7e0,stroke:#f9ab00,color:#1a1a1a;
```

**The live-update loop:** the app opens an `EventSource` against its own
`/api/events`, which proxies the backend SSE stream (attaching the JWT in the
dashboard, since `EventSource` can't send headers). On an `alert.*` / `station.*`
event the client shows a toast/notification and triggers a **debounced
`router.refresh()`**, which re-runs the Server Components and repaints with fresh
data — no full reload, and (on the map) without resetting the user's pan/zoom.

---

## Public map app internals

- **Shell:** the `(app)` route group renders `TopBar` + a full-page `MapCanvas`;
  the selected station opens a side rail (nested routes under
  `stations/[stationId]`).
- **Map:** `features/map` uses Leaflet directly (`ssr: false` dynamic import),
  drawing Libya's GeoJSON outline and rendering station pins whose colour encodes
  the worst of operational status + active/forecast alerts.
- **Data:** `components/api` with a `{ data, metadata }` envelope; server-side
  fetches hit the backend directly, client-side fetches go through
  `/api/proxy/[...path]`.
- **State:** `StationsProvider` (server-fetched list) and `LanguageProvider`;
  `EventsListener` drives live refresh. No Redux/Zustand.

```mermaid
flowchart TD
    root["/ (map only)"]
    detail["/stations/:id<br/>overview + forecast + warning"]
    charts["/stations/:id/charts<br/>2×2 history grid"]
    data["/stations/:id/data<br/>CSV export"]
    share["/stations/:id/share<br/>link + embed"]
    showcase["/components<br/>internal showcase"]

    root --> detail
    detail --> charts
    detail --> data
    detail --> share
```

See [`mozn-public/frontend/README.md`](../mozn-public/frontend/README.md).

---

## Admin dashboard internals

- **Auth:** real JWT in an **httpOnly cookie** (`mozn_dash_token`). The
  `(dashboard)/layout.tsx` server component gates every screen via `/api/me` and
  redirects to `/login` on failure (no `middleware.ts`). Access is
  **permission-based** (`RouteGuard` + per-nav `permission`).
- **Data:** two server-only layers — `lib/backend.ts` (transport, attaches the JWT,
  unwraps the envelope) and `lib/api.ts` (adapters → client-safe view models).
  Client components use same-origin proxy handlers under `app/api/*`.
- **Real-time:** `app/api/events` (SSE proxy) + `events-provider` (toasts +
  coalesced refresh) + optional `auto-refresh` polling fallback.
- **UI:** shadcn/ui (new-york) primitives + recharts; a Leaflet station-health map.

```mermaid
flowchart TD
    login["/login"]
    shell["(dashboard) shell<br/>auth-gated: sidebar + topbar"]
    login --> shell
    shell --> overview["/ overview"]
    shell --> stations["/stations (+new, +:id/edit)"]
    shell --> inbox["/alert-inbox"]
    shell --> active["/active-alerts"]
    shell --> alerts["/alerts (thresholds + rules)"]
    shell --> templates["/alert-templates"]
    shell --> users["/users (roles + permissions)"]
    shell --> history["/history"]
    shell --> activity["/activity (audit)"]
    shell --> settings["/settings"]
```

See [`mozn-dashboard/README.md`](../mozn-dashboard/README.md).

---

## Shared conventions

- **Bilingual EN/AR + RTL** everywhere — [`i18n-and-rtl.md`](./i18n-and-rtl.md).
- **Token-first Tailwind v4** styling, no raw hex — [`styling.md`](./styling.md).
- **Server-only data layer + proxy handlers** — [`api-contract.md`](./api-contract.md).
- **Independent deployments** on separate origins — [`deployment.md`](./deployment.md).
