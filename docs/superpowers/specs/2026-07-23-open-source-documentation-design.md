# Open-Source Documentation — Design Spec

**Date:** 2026-07-23
**Goal:** Produce a clean, impressive, accurate, open-source-ready documentation set for the `mozn-frontend` repository, published to GitHub.

## Context

`mozn-frontend` is a no-root-`package.json` monorepo containing **two independent, frontend-only Next.js apps** that consume a **separate Go backend API** over REST + Server-Sent Events (SSE):

| App | Path | Audience |
| --- | --- | --- |
| Admin dashboard | `mozn-dashboard/web` | MOZN operators |
| Public map app | `mozn-public/frontend` | Citizens |

Shared stack: Next.js 16 (App Router, RSC) · React 19 · TypeScript (strict) · Tailwind CSS v4 (`@theme` tokens) · bilingual EN/AR with full RTL · SSE-driven live updates. The dashboard adds shadcn/ui + recharts; the public app uses Leaflet for the map.

### Accuracy findings (existing docs are partly stale — must NOT be inherited)

1. **No in-repo Go `server/`.** The dashboard README/CLAUDE describe a Go `server/` folder; it has been removed. Both apps hit the real backend (dashboard default `http://localhost:8080`; public default `https://mozn.org.ly/api`).
2. **No multi-zone proxy.** Root README + `dev.sh` describe the public app proxying `/dashboard/*` (Next.js Multi-Zones). The current `next.config.ts` in both apps says they are **separate deployments on separate subdomains** (`mozn.org.ly`, `dashboard.mozn.org.ly`) with no proxy.
3. **Dashboard has drifted past its CLAUDE.md**: a real `login/` page, `lib/backend.ts` (not just `lib/api.ts`), `events-provider` + `auto-refresh`, and a `hooks/` folder now exist. Structure must be re-verified against code.
4. **SSE is real and current** — both apps have `app/api/events/route.ts` + events providers/listeners. This claim stays.
5. **No `LICENSE`** file exists. **No screenshots** exist (only brand mark PNGs).

## Decisions

- **Scope:** Full docs set (root README + both app READMEs + a `docs/` folder + `CONTRIBUTING.md`).
- **License:** MIT (add `LICENSE`).
- **Visuals:** Mermaid diagrams only (render natively on GitHub); no screenshot placeholders.
- **Accuracy:** Fix everything — user-facing docs AND the stale `CLAUDE.md` files AND `dev.sh` comments.

## Deliverables

```
README.md                       Rewritten front door: intro, two-app table, architecture
                                diagram, quick start, links into docs/
LICENSE                         MIT (new)
CONTRIBUTING.md                 Setup, conventions, golden rules (bilingual+RTL always,
                                logical Tailwind utilities, reuse components, lint/typecheck)
docs/
  architecture.md               System overview: 2 frontends + separate Go backend, REST+SSE,
                                Mermaid diagrams, per-app internals & route maps
  api-contract.md               How frontends consume the backend: endpoints per app, the
                                response envelope, server-only vs /api/proxy fetch, SSE loop
  i18n-and-rtl.md               Bilingual EN/AR + RTL system (no library), the rules
  styling.md                    Tailwind v4 @theme tokens, dark mode, the two apps' differences
  deployment.md                 Separate-subdomain deploys, env vars, PM2 (ecosystem.config.js),
                                dev.sh, standalone output
mozn-dashboard/README.md        Rewritten & de-staled (no Go server/, real routes/auth/structure)
mozn-public/README.md           New proper README (replaces create-next-app boilerplate)
```

Also updated for accuracy: `dev.sh` comments, `mozn-dashboard/CLAUDE.md`, `mozn-public/frontend/CLAUDE.MD` (remove server/multi-zone claims; reflect subdomains & current structure).

## Diagrams (Mermaid)

1. **System architecture** — two frontends + Go backend over REST/SSE, separate subdomains.
2. **Data flow** — server-only fetch vs. browser `/api/proxy`, plus the SSE → refresh loop.
3. **Per-app route/component maps** — one per app.

## Content principles

- Clean, confident, scannable: intro, badges (build tools/license/stack), tables, collapsible `<details>` where long.
- Every asserted route/env/endpoint verified against actual code (two Explore audits feed this).
- Bilingual/RTL and token-first styling presented as first-class project conventions.

## Out of scope

- No screenshots (diagrams only).
- No backend/Go documentation (separate repo); only the contract the frontends depend on.
- No CI config, no unrelated refactors.
