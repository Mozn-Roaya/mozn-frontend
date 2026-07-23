# Deployment & Configuration

The two front-ends deploy as **two independent origins**. There is no shared
build and no proxy between them — each is a standalone Next.js app.

| App | Local port | Production origin |
| --- | --- | --- |
| Public map app (`mozn-public/frontend`) | `3000` | `https://mozn.org.ly` |
| Admin dashboard (`mozn-dashboard/web`) | `3001` | `https://dashboard.mozn.org.ly` |

> **Historical note:** earlier versions used a Next.js **Multi-Zones** setup where
> the public app proxied `/dashboard/*` to the dashboard. That is no longer the
> case — the current `next.config.ts` in both apps serves each at the root of its
> own subdomain, with no cross-proxy.

---

## Environment variables

Each app reads its own `.env.local` (gitignored). Copy from `.env.example` and
point it at your backend.

### Dashboard — `mozn-dashboard/web/.env.local`

| Variable | Default | Used by |
| --- | --- | --- |
| `API_BASE_URL` | `http://localhost:8080` | Server-side fetches to the Go backend |

The dashboard fetches **server-side only**, so this URL is never exposed to the
browser (no `NEXT_PUBLIC_` prefix).

### Public app — `mozn-public/frontend/.env.local`

| Variable | Default | Used by |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | `https://mozn.org.ly/api` | Direct **server-side** fetches |
| `MOZN_API_BASE` | `https://mozn.org.ly/api` | The `/api/proxy` route handler (browser fetches) |

The public app fetches from the server directly, but browser-side requests go
through its own `/api/proxy/[...path]` route to avoid mixed-content/CORS issues.
See [`api-contract.md`](./api-contract.md).

---

## Local development

From the repo root, run both apps together:

```bash
./dev.sh
```

- Public app → <http://localhost:3000>
- Dashboard → <http://localhost:3001>
- Backend API → expected at <http://localhost:8080> (run the separate backend repo)

`dev.sh` starts both Next dev servers and stops them together on `Ctrl-C`. First
visit to each screen compiles on demand (a few seconds).

To run a single app, `cd` into it and use `npm run dev` (see each app's README).

---

## Production build & serve

Each app builds independently:

```bash
cd mozn-public/frontend   # or mozn-dashboard/web
npm ci
npm run build
npm run start
```

- The **public app** is configured with `output: "standalone"` — the build emits a
  self-contained server bundle suitable for containerized/minimal deployments, and
  `poweredByHeader` is disabled.
- The **dashboard** runs at the root of its subdomain (`basePath: ""`,
  `reactStrictMode: true`). If it is ever mounted under a path again (e.g.
  `/dashboard`), set `BASE_PATH` in its `next.config.ts` and everything
  auto-prefixes via `NEXT_PUBLIC_BASE_PATH`.

---

## Process management (PM2)

`ecosystem.config.js` at the repo root defines both apps for PM2:

```bash
pm2 start ecosystem.config.js
```

| Process | Port | Working directory |
| --- | --- | --- |
| `mozn-public` | `3000` | `mozn-public/frontend` |
| `mozn-dashboard` | `3001` | `mozn-dashboard/web` |

> The `cwd` paths in `ecosystem.config.js` are absolute and environment-specific —
> update them to match your server's checkout path before deploying.

Both processes run `npm start`, so build each app first (`npm run build`).

---

## Checklist for a new environment

1. Deploy the backend API and note its origin.
2. Public app: set `NEXT_PUBLIC_API_BASE` and `MOZN_API_BASE` to that origin.
3. Dashboard: set `API_BASE_URL` to that origin.
4. `npm ci && npm run build` in each app.
5. Serve each on its own origin/subdomain (via PM2 or your platform of choice).
6. Ensure the backend's CORS allow-list includes both front-end origins.
