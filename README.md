# Mozn — Early Warning System (merged)

One repo, two front-ends served under a single origin via **Next.js Multi-Zones**:

| Surface | Path | Code | Dev port | Backend |
| ------- | ---- | ---- | -------- | ------- |
| **Public** map app (default zone, landing page) | `/`, `/stations/:id` | `mozn-public/frontend` | `3000` | remote weather API `https://mozn.org.ly/api` |
| **Admin dashboard** (child zone) | `/dashboard/*` | `mozn-dashboard/web` | `3001` | local **Go** API `mozn-dashboard/server` on `:8080` |

You only ever open **http://localhost:3000**. The public app proxies every
`/dashboard/*` request to the dashboard zone, and the **Dashboard** button in the
public top-bar links to `/dashboard`.

```
                    http://localhost:3000  (public zone, Next.js)
                    ├── /                      → public map app
                    ├── /stations/:id          → public station views
                    └── /dashboard/*  ──rewrite──▶  http://127.0.0.1:3001/dashboard/*
                                                     (dashboard zone, basePath=/dashboard)
                                                     └── server-side ▶ Go API :8080
```

## Prerequisites

- Node.js ≥ 18.18 (20+ recommended) and npm
- Go ≥ 1.22

## Quick start

```bash
# 1. install per-app deps (first time only)
npm --prefix mozn-public/frontend install
npm --prefix mozn-dashboard/web install

# 2. run everything (Go API + both Next zones), Ctrl-C stops all
./dev.sh
```

Then open **http://localhost:3000** and click **Dashboard** (top-right).

> First visit to each screen compiles on demand (a few seconds in dev); it's
> instant afterwards.

## How the merge works

- **`mozn-dashboard/web/next.config.ts`** sets `basePath: "/dashboard"`, so every
  dashboard page, route handler, and static asset lives under `/dashboard/*`.
  `basePath` auto-prefixes all `next/link`, router, and asset URLs — no per-link
  changes were needed. It also re-exposes `NEXT_PUBLIC_BASE_PATH` for the one raw
  client `fetch()` (`components/layout/command-palette.tsx`) that `basePath` does
  not auto-prefix.
- **`mozn-public/frontend/next.config.ts`** rewrites `/dashboard` and
  `/dashboard/:path*` to the dashboard zone (`DASHBOARD_URL`, default
  `http://127.0.0.1:3001`). `127.0.0.1` (not `localhost`) avoids an IPv6/`::1`
  proxy `ECONNRESET` in dev.
- The **Dashboard button** lives in `mozn-public/frontend/components/ui/top-bar.tsx`
  as a plain `<a href="/dashboard">` (a hard navigation — cross-zone links must
  not use `next/link`, which would try to soft-navigate/prefetch a route the
  public app doesn't have). Labels are in the public i18n dict (`dashboardLink`,
  EN + AR).

## ⚠️ Do not add a root `package.json` / `package-lock.json`

A lockfile at the repo root makes Next infer the **monorepo** as the workspace
root and compile over a huge scope — dev cold-compiles balloon from ~2s to ~100s
per route (which then times out the zone proxy → 500s). Keep dependencies inside
each app and keep orchestration in `dev.sh`.

## Production notes

- Build each app: `npm --prefix mozn-dashboard/web run build` and
  `npm --prefix mozn-public/frontend run build`; build the Go binary with
  `cd mozn-dashboard/server && go build ./cmd/api`.
- Run the dashboard zone and set the public app's `DASHBOARD_URL` to its origin;
  keep the dashboard's `basePath` at `/dashboard`.
- Each app keeps its own env (`mozn-public/frontend/.env.example`,
  `mozn-dashboard/web/.env.example`); the Go server reads `PORT` and
  `ALLOWED_ORIGINS`.

## Running an app on its own

Each app's own `README.md` still describes standalone dev. Note that when run as
part of the merged stack the dashboard listens on **:3001** under **/dashboard**
(via `dev.sh`), not on :3000.
