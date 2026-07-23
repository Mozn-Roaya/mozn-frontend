# Project implementation rules

## Figma source of truth

- File: **Mozn | Early Warning System** — `fileKey`: `LrEvjNZAjFWkjpeCiMq52R` (same file as the public app; this repo builds the **Dashboard / admin** section).
- Design tokens, colours, type, and copy all trace back to this file. Component code references tokens — never raw hex.

## Figma MCP workflow

For every Figma-driven task:

1. Use the Figma MCP server.
2. Run `get_design_context` for the exact Figma node provided.
3. Run `get_screenshot` for visual reference before coding.
4. If the response is too large or truncated, run `get_metadata`, identify the smaller required nodes, then call `get_design_context` only for those nodes.
5. Treat Figma MCP output as design context, not final code style.
6. Translate the design into this codebase's actual framework, components, tokens, and conventions.
7. Validate visual parity against the Figma screenshot before saying the task is complete. This repo uses the **Playwright CLI** (`.claude/skills/playwright-cli`, output in `.playwright-cli/`) for browser screenshots/console dumps — use it to confirm parity.

## Component rules

- Reuse existing components before creating new ones. Check `web/components/{ui,layout,common,data-table,maps,station-detail,providers}` and the relevant `web/features/<area>/components` before implementing.
- UI primitives are **shadcn/ui (new-york)** in `web/components/ui/`. Add new shadcn primitives via the shadcn CLI (config in `web/components.json`, alias `@/components/ui`, icons = lucide). Do not hand-roll buttons/inputs/dialogs/tables/selects/tabs/etc. that already exist.
- Do not hardcode colours, spacing, radius, or typography — use the design tokens (see Styling).
- Icons are **lucide-react**. Don't add another icon package.
- Match responsive **and** RTL behaviour, not only desktop LTR pixels (see i18n / RTL).

## Quality rules

- Before editing, explain the implementation plan.
- Keep changes minimal and localized.
- After editing run: `cd web && npm run lint && npm run typecheck` (and `npm run build` for anything non-trivial).
- Fix all errors caused by the change.
- Summarize changed files and any remaining visual differences.

---

# Codebase guide

**MOZN — Early Warning System · Admin Dashboard.** The admin control plane for the MOZN station network: operators monitor stations, triage/act on alerts, tune thresholds, manage users, and review history/audit. It is the counterpart to the public app (`../mozn-public`, the consumer-facing map view) — this dashboard **manages** the same domain.

This is a **frontend-only Next.js app** (this folder is `web/`). It talks to the Mozn backend API — a **separate Go service reached over HTTP** (`API_BASE_URL`, default `http://localhost:8080`). There is **no in-repo `server/` folder** and no Go build step here.

## Stack

- Next.js 16 (App Router, RSC) + React 19, TypeScript strict. Tailwind CSS v4 (`@tailwindcss/postcss`) + **shadcn/ui (new-york)** on Radix. Charts = **recharts** via shadcn Chart. `next-themes` (class-based dark), `date-fns`, `leaflet` 1.9 (direct, no react-leaflet).

## Commands

Run from `web/`:
- `npm run dev` — dev server on :3000 (`:3001` when launched via the repo-root `dev.sh`)
- `npm run build` / `npm run start`
- `npm run lint` — ESLint flat config
- `npm run typecheck` — `tsc --noEmit`

No test script and no Go/backend scripts. The backend runs from its own repo; this app fetches it server-side.

## Layout & routing (`web/`)

`app/` and `components/` at the `web/` root (no `src/`). Screens live in the `(dashboard)` route group behind one **auth-gated** shell; `login` sits outside it; `app/api/*` are same-origin proxy handlers.

```
app/
  layout.tsx                  Root <html>: dir/lang from locale, Poppins+Almarai fonts, ThemeProvider
  globals.css                 Tailwind v4 + Figma design tokens
  login/                      Sign-in (no shell) → POSTs app/api/auth/login
  api/                        Same-origin proxy handlers (auth, events SSE, and CRUD for
                              stations/alerts/thresholds/compound-rules/templates/users/…)
  (dashboard)/
    layout.tsx                Auth gate (getCurrentUser → redirect /login) + shell:
                              LocaleProvider > RoleProvider > AdminConfigProvider,
                              Sidebar + Topbar + RouteGuard, + EventsProvider/AutoRefresh/Toaster
    loading.tsx / error.tsx   App Router skeleton + error UI
    page.tsx                  Dashboard overview
    alert-inbox/              Alert triage
    active-alerts/            Live/recently-resolved confirmed alerts
    alerts/                   Thresholds + compound-rules editor
    alert-templates/          Response-plan / message templates
    stations/                 Station list · stations/new · stations/[id]/edit
    users/                    Users & access + role/permission matrix
    history/                  Alert history (range filter)
    activity/                 Audit / activity log
    settings/                 Settings + validation rules
```

## Auth (REAL — JWT in an httpOnly cookie)

- Login: `app/login/page.tsx` → `app/api/auth/login` → `loginToBackend()` (backend `POST /api/auth/login`) sets httpOnly cookie **`mozn_dash_token`** (sameSite=lax, secure in prod, 12h). Logout clears it.
- Session gate: `(dashboard)/layout.tsx` (server) calls `getCurrentUser()` (`GET /api/me`); any failure → `redirect("/login")`. **There is no `middleware.ts`** — the layout is the gate.
- Transport: `lib/backend.ts` reads the cookie (`SESSION_COOKIE`) and attaches `Authorization: Bearer <jwt>` to every backend call; 401 → `AuthError`. The SSE proxy (`app/api/events`) forwards the token upstream (EventSource can't send headers).
- `role-provider` is seeded from the **real backend session** (`buildSessionUser` from `/api/me`); exposes `role`, `isGov`, `readOnly`, `assignedRegion`, `permissions`, `can(permission)`. **No `localStorage` role switching / `mozn-demo-role`.**
- Access control (`components/layout/route-guard.tsx`) is **permission-based**: `can()` + per-nav `permission` in `nav-config.ts` (no `GOV_ALLOWED` list). The backend enforces the same on each call. When adding a screen, set its `permission` in `nav-config.ts`.

## Providers (order matters)

Root `layout.tsx`: `ThemeProvider` (`next-themes`, `attribute="class"`, default light, system-enabled — dark is **`.dark` class-based**, not `data-theme`; differs from the public app).

`(dashboard)/layout.tsx` (after the auth gate): `LocaleProvider` → `RoleProvider` → `AdminConfigProvider`, with `EventsProvider`, `AutoRefresh`, and `Toaster` mounted alongside. `LocaleProvider` also wraps children in Radix `DirectionProvider`.

- **`admin-config-provider`** — `localStorage`-persisted admin config (`mozn-admin-config`): per-city emergency contacts + per-template response steps (bilingual `{en,ar}`).

## Real-time (SSE + polling)

- `app/api/events/route.ts` — same-origin SSE proxy (`runtime="nodejs"`, `force-dynamic`): reads the cookie, opens upstream `GET {API_BASE_URL}/api/events` with the Bearer token, pipes the stream back.
- `components/providers/events-provider.tsx` — opens `EventSource`; on `alert.*`/`station.*` pushes bell notifications + toasts and coalesces (~800ms) a `router.refresh()`; reconnects with capped backoff.
- `components/providers/auto-refresh.tsx` — optional polling fallback (interval from Settings; off by default; only when the tab is visible).

## Data layer (two server-only files)

- **`lib/backend.ts`** (`import "server-only"`) — transport to the Go backend. `API_BASE_URL` (default `http://localhost:8080`). `backendFetch`/`backendData` (unwrap `{data,metadata}` envelope, `cache:"no-store"`), `backendMutate` (writes; returns `{ok,status,data,message,errorCode}`, throws only on 401), `getCurrentUser`, `loginToBackend`, `ApiError`/`AuthError`. Friendly "Is the Go backend running?" message lives here. There is **no `apiFetch`**.
- **`lib/api.ts`** (`import "server-only"`) — adapter layer: named getters/writers that shape backend DTOs into the client-safe view models in `types/*` (`getDashboardOverview`, `getStations`, `getAlertInbox`, `getThresholds`, `getUsers`, `getActiveAlerts`, `getTemplates`, `getRoleMatrix`, `getCompoundRules`, …, plus alert actions and CRUD writers via `backendMutate`).
- **Server-only.** Client components cannot import either file — they call the `app/api/*` proxy handlers (canonical example: `app/api/stations/route.ts`).
- **Backend paths are `/api/...`** (e.g. `/api/stations`, `/api/alerts/:id/<action>`), **not `/api/v1/...`**.
- Keep the app's types (`types/*`, `lib/backend-types.ts`) in sync with the backend contract.

## i18n / RTL

Bilingual **English + Arabic** with full RTL. Lightweight, no library.

- `lib/i18n.ts` — pure flat namespaced dict, merged from per-area maps in `lib/i18n/*`. `translate(locale, key, vars?)`. `translateData()` translates backend free-text keyed on the raw English value.
- Client: `useT()` from `locale-provider`. Server: `getServerLocale()` from `lib/i18n-server.ts` (reads the `mozn-locale` cookie). Root layout sets `<html lang dir>`.
- **Always add both `en` and `ar`** for new copy. Use **logical** Tailwind utilities (`ps/pe/ms/me/start/end`, `text-start`), not `pl/pr/left/right`. Fonts: Poppins (Latin) + Almarai (Arabic) in `--font-sans`.

## Styling (`app/globals.css`)

Figma-driven, token-first Tailwind v4. **Never use raw hex in components.**

- Raw tokens in `:root` (light) and `.dark` (dark) as CSS variables; `@theme inline` aliases them to Tailwind color/font/radius/shadow tokens (`bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg`, `shadow-card`).
- `@custom-variant dark (&:where(.dark, .dark *))` — dark is **class-based**, toggled by `next-themes`.
- Status palette: `--status-normal/warning/advisory/offline`. Chart series: `--chart-1..4` + `--chart-track`. Tokens with no Figma source are annotated `CODE EXTENSION` — keep that annotation.
- Compose classes with `cn()` (`lib/utils.ts`).

## Shared components (`web/components/`)

- `ui/` — shadcn primitives (badge, button, calendar, card, chart, checkbox, date-picker, dialog, dropdown-menu, empty, input, popover, scroll-area, select, separator, sheet, skeleton, switch, table, tabs, textarea, toaster, toggle(-group), tooltip).
- `layout/` — Sidebar/Topbar shell, `nav-config.ts` (nav groups + per-item `permission`), NavList, UserCard, command palette, notifications menu + store, language/theme toggles, RouteGuard, brand-mark.
- `common/` — PageHeading, StatCard, SearchInput, EmptyState, status badges, activity-category, relative-time.
- `data-table/` — sortable head, faceted filter, selection bar, density toggle, pagination.
- `maps/` — direct Leaflet Libya map + `station-location-picker` + GeoJSON `data/`.
- `station-detail/`, `providers/` — station summary/weather helpers; the context providers above.

## Features / hooks / types

- `features/<area>/` — one folder per screen, each `components/` + `types.ts` (some add `lib/`/`preferences.ts`/`use-*.ts`): `dashboard`, `stations`, `alert-inbox`, `alert-management`, `alert-templates`, `thresholds`, `users`, `history`, `activity`, `settings`. Page files stay thin — fetch via `lib/api`, then compose feature components.
- `hooks/` — `use-mounted`, `use-pagination`, `use-reduced-motion`.
- `types/` — client-safe view-model types; backend DTO types live in `lib/backend-types.ts`.

## Gotchas — read before debugging

- **`lib/backend.ts` and `lib/api.ts` are `server-only`.** Importing them from a client component is a build error. Need data client-side? Add/consume a thin `app/api/<x>/route.ts` handler.
- **Single scroll container.** The document never scrolls — the shell wrapper is `overflow-hidden` and `<main>` is the only scroller. Don't add document-level scrolling; keep absolutely-positioned content inside `<main>` (which is `relative`).
- **Dark mode is `.dark` class-based** (next-themes), not `data-theme` — different from the public app.
- **Permission-gated.** Gate mutations on `readOnly`/`can()`; set a `permission` in `nav-config.ts` for new screens.
- **Bilingual + RTL always:** add `en`+`ar`, use logical spacing utilities, check the Arabic/RTL layout.

## Environment

`web/.env` / `web/.env.local` are gitignored. Only var the frontend reads:

```
API_BASE_URL=http://localhost:8080   # server-side fetch target (Go backend)
```

`NEXT_PUBLIC_BASE_PATH` is injected by `next.config.ts` (currently `""`; the dashboard is served at the root of its own subdomain — no `/dashboard` basePath, no Multi-Zones proxy).
