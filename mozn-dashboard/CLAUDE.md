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

- Reuse existing components before creating new ones. Check `web/components/{ui,layout,common,admin,data-table,maps,station-detail}` and the relevant `web/features/<area>/components` before implementing.
- UI primitives are **shadcn/ui (new-york)** in `web/components/ui/`. Add new shadcn primitives via the shadcn CLI (config in `web/components.json`, alias `@/components/ui`, icons = lucide). Do not hand-roll buttons/inputs/dialogs/tables/selects/tabs/etc. that already exist.
- Do not hardcode colours, spacing, radius, or typography — use the design tokens (see Styling).
- Icons are **lucide-react**. Don't add another icon package.
- Match responsive **and** RTL behaviour, not only desktop LTR pixels (see i18n / RTL).

## Quality rules

- Before editing, explain the implementation plan.
- Keep changes minimal and localized.
- After editing run: `cd web && npm run lint && npm run typecheck` (and `npm run build` for anything non-trivial). For Go changes: `cd server && go build ./... && go test ./...`.
- Fix all errors caused by the change.
- Summarize changed files and any remaining visual differences.

---

# Codebase guide

**MOZN — Early Warning System · Admin Dashboard.** The admin control plane for the MOZN station network: admins monitor stations, triage/act on alerts, tune thresholds, manage users, and review history/audit. It is the counterpart to the public app (`../mozn-public`, the consumer-facing map view) — this dashboard **manages** the same domain.

This is a **two-part repo**: a Next.js frontend (`web/`) and a Go backend (`server/`). They are typed end-to-end — `web/types/*` mirror `server/internal/model/*` one-to-one, so the JSON contract is the single source of truth.

## Stack

- **Frontend (`web/`):** Next.js 16 (App Router, RSC) + React 19, TypeScript strict. Tailwind CSS v4 (`@tailwindcss/postcss`) + **shadcn/ui (new-york)** on Radix. Charts = **recharts** via shadcn Chart. `next-themes` (class-based dark), `date-fns`, `leaflet` 1.9 (direct, no react-leaflet).
- **Backend (`server/`):** Go 1.22, standard library only. Layered `handler → service → repository`; in-memory store seeded from Figma fixtures. `log/slog`, graceful shutdown, CORS/log/recover middleware, golden characterization tests.

## Commands

Frontend (run from `web/`):
- `npm run dev` — dev server on :3000 (plain `next dev`, Turbopack — no `--webpack` pin needed here, unlike the public app)
- `npm run build` / `npm run start`
- `npm run lint` — ESLint flat config
- `npm run typecheck` — `tsc --noEmit`

Backend (run from `server/`):
- `go run ./cmd/api` — API on :8080 (env: `PORT`, `ALLOWED_ORIGINS` default `http://localhost:3000`)
- `go test ./...` — includes `internal/handler/golden_test.go` (characterization tests; update goldens deliberately when the JSON contract changes)

**Both must be running** for the dashboard to load data: the frontend fetches the Go API server-side.

## Layout & routing (`web/`)

`app/` and `components/` at the `web/` root (no `src/`). All screens live in the `(dashboard)` route group behind one shared shell.

```
app/
  layout.tsx                  Root <html>: dir/lang from locale, Poppins+Almarai fonts, ThemeProvider
  globals.css                 Tailwind v4 + Figma design tokens
  api/stations/route.ts       Client-facing proxy (force-dynamic) for the stations list — see API layer
  (dashboard)/
    layout.tsx                Shell: LocaleProvider > RoleProvider > AdminConfigProvider > Sidebar + Topbar + RouteGuard + Toaster
    loading.tsx / error.tsx   App Router skeleton + error UI
    page.tsx                  Dashboard overview (A1)
    alert-inbox/              Alert triage (A3.3)
    active-alerts/            Live active alerts
    alerts/                   Alerts & thresholds editor (A3.0)
    alert-templates/          Response-plan templates
    stations/                 Station list (A2) · stations/new · stations/[id]/edit
    users/                    Users & access (A4)
    history/                  Alert history + audit (A5)
    activity/                 Activity log
    settings/                 Settings (A6)
```

> The `README.md` screen table predates `active-alerts`, `alert-templates`, `activity`, and the station `new`/`edit` forms — trust the route tree above.

## Providers (order matters — set in `(dashboard)/layout.tsx`, theme in root `layout.tsx`)

`ThemeProvider` (root) → `LocaleProvider` → `RoleProvider` → `AdminConfigProvider`.

- **`theme-provider`** — `next-themes`, `attribute="class"`, default light, system-enabled. Dark mode is **class-based** (`.dark` on `<html>`), **not** `data-theme` (this differs from the public app).
- **`locale-provider`** — exposes `useT()` for client components; seeded with the server-read locale. See i18n.
- **`role-provider`** — demo role switcher (no real auth). Roles: `Super Admin`, `Gov Editor`, `Gov Viewer`. Persisted in `localStorage` (`mozn-demo-role`) via an external-store subscription (no hydration mismatch). Default is the **lowest privilege** (`Gov Viewer` — region-scoped, read-only). Exposes `role`, `setRole`, `isGov`, `readOnly`, `assignedRegion`. Gate mutations on `readOnly`.
- **`admin-config-provider`** — `localStorage`-persisted admin config (`mozn-admin-config`): per-city emergency contacts + per-template response steps (bilingual `{en,ar}`). Tolerant of older `string[]` shapes.

## Access control (`components/layout/route-guard.tsx`)

`RouteGuard` (in the shell) blocks Gov roles from admin-only screens on direct URL access — Gov roles may only open `/`, `/stations`, `/history` (mirrors the `gov: true` flags in `nav-config.ts`). Nav already hides the rest; the guard covers deep links. When adding a screen, set `gov` in `nav-config.ts` **and** update `GOV_ALLOWED` if Gov roles should reach it.

## i18n / RTL

Bilingual **English + Arabic** with full RTL. Lightweight, no library.

- `lib/i18n.ts` — flat namespaced dict (`"nav.dashboard"`, `"stations.title"`), merged from per-area maps in `lib/i18n/*`. `translate(locale, key, vars?)` fills `{placeholders}`. Pure — safe on client and server.
- Client: `useT()` from `locale-provider`. Server: `getServerLocale()` from `lib/i18n-server.ts` (reads the locale cookie). Root layout sets `<html lang dir>` from it.
- `translateData()` translates backend free-text keyed on the raw English value (falls back to it unchanged) — for proper nouns / fixture copy.
- **Always add both `en` and `ar`** when adding UI copy. Use **logical** Tailwind utilities (`ps/pe/ms/me/start/end`, `text-start`) — not `pl/pr/left/right` — so RTL mirrors correctly. Fonts: Poppins (Latin) with Almarai fallback for Arabic glyphs; `--font-sans` lists both.

## API layer

- **`web/lib/api.ts`** — `import "server-only"`. Centralized `apiFetch<T>` → `API_BASE_URL` (env, default `http://localhost:8080`), `Accept: application/json`, **`cache: "no-store"`** (the dashboard reflects live state). Throws typed `ApiError` (with `.status`); an unreachable backend gets a friendly "Is the Go backend running?" message. Named getters per screen: `getDashboardOverview`, `getStations`, `getAlertInbox`, `getThresholds`, `getUsers`, `getAlertHistory`, `getActivityLog`, `getSettings`.
- **Server-only.** Pages/route handlers (Server Components) call these directly. **Client components cannot import `lib/api`** — expose a thin route handler instead. Example: `app/api/stations/route.ts` (`force-dynamic`) proxies `getStations()` for the client-side station-location picker/palette.
- **Backend routes** (`server/internal/handler`, all `GET /api/v1/...`): `dashboard/overview`, `stations`, `alert-inbox`, `thresholds`, `users`, `history/alerts`, `history/activity`, `settings`, plus `GET /healthz`.

## Backend (`server/`)

- `cmd/api/main.go` — entrypoint: composes `repository → service → handler`, `http.Server` with timeouts, signal-driven graceful shutdown.
- `internal/model/` — domain types & JSON contract (the source of truth `web/types/*` mirror).
- `internal/repository/` — `NewInMemoryRepository()` + `seed_admin.go` (fixture data from Figma). Interface-bounded so a DB can replace it without touching handlers.
- `internal/service/` — business logic (`dashboard_service.go`, `admin_service.go`).
- `internal/handler/` — routing (`router.go`), endpoints (`dashboard_handler.go`, `admin_handler.go`), `middleware.go` (CORS/log/recover), `respond.go` (`writeJSON`), `golden_test.go`.
- When changing a payload: update the Go `model` **and** the matching `web/types/*` together, and refresh golden tests.

## Styling (`app/globals.css`)

Figma-driven, token-first Tailwind v4. **Never use raw hex in components.**

- **Raw tokens** live in `:root` (light) and `.dark` (dark) as CSS variables — surfaces, brand, neutrals, interactive states, borders, status palette, chart palette, shadows. Only these flip for dark; everything else reskins automatically.
- **`@theme inline`** aliases them to Tailwind color/font/radius/shadow tokens (`--color-primary: var(--primary)`, etc.), so utilities like `bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg`, `shadow-card` resolve to the semantic tokens.
- `@custom-variant dark (&:where(.dark, .dark *))` — dark is **class-based** (`.dark`), toggled by `next-themes`. Use `dark:` variants for one-offs.
- Comments marked **`CODE EXTENSION`** flag tokens with no Figma source (e.g. `--status-advisory`, `--chart-4`) — keep that annotation if you add more.
- Status palette: `--status-normal/warning/advisory/offline`. Chart series: `--chart-1..4` + `--chart-track`. Use these for station health and charts rather than inventing colours.
- Use the numeric spacing scale and `rounded-*`/`shadow-card` utilities; use `cn()` (`lib/utils.ts`) to compose classes.

## Shared components (`web/components/`)

- `ui/` — shadcn primitives (badge, button, calendar, card, chart, checkbox, date-picker, dialog, dropdown-menu, empty, input, popover, scroll-area, select, separator, sheet, skeleton, switch, table, tabs, textarea, toaster, toggle(-group), tooltip).
- `layout/` — Sidebar/Topbar shell, `nav-config.ts` (nav groups + leaf breadcrumbs), NavList, UserCard, command palette, notifications menu, language/theme toggles, RouteGuard, brand-mark.
- `common/` — PageHeading, StatCard, SearchInput, EmptyState, status badges, activity-category.
- `data-table/` — reusable table furniture: sortable head, faceted filter, selection bar, density toggle, pagination.
- `maps/` — direct Leaflet Libya map (`leaflet-libya-map.tsx`, `leaflet-config.ts`, `map-control-button.tsx`), `station-location-picker.tsx`, and `data/`.
- `station-detail/`, `providers/` — station summary/weather helpers; the context providers above.

## Features (`web/features/<area>/`)

Screen-specific code, one folder per area, each with `components/` + `types.ts` (some add `lib/`, `preferences.ts`, or a `*-state.ts`): `dashboard`, `stations`, `alert-inbox`, `alert-management`, `alert-templates`, `thresholds`, `users`, `history`, `activity`, `settings`. Page files in `app/(dashboard)/…` stay thin — fetch via `lib/api`, then compose feature components.

## Gotchas — read before debugging

- **`lib/api.ts` is `server-only`.** Importing it from a client component is a build error. Need the data client-side? Add a thin `app/api/<x>/route.ts` handler (see `api/stations/route.ts`) and `fetch` it.
- **Single scroll container.** The document (`html`/`body`) never scrolls — the shell's outer wrapper is `overflow-hidden` and `<main>` is the only scroller (`overflow-y-scroll`, always-present gutter). This intentionally defeats a viewport "shake" from Radix body scroll-lock and chart `sr-only` labels. Don't add document-level scrolling or move the scroller; keep absolutely-positioned content inside `<main>` (which is `relative`).
- **Dark mode is `.dark` class-based** (next-themes), not `data-theme` — different from the public app. Use the `dark:` variant / the `.dark` token block.
- **Roles default to lowest privilege** (`Gov Viewer`, read-only). Gate every mutation on `readOnly`; guard new admin routes in both `nav-config.ts` (`gov` flag) and `RouteGuard`'s `GOV_ALLOWED`.
- **Keep `web/types` and `server/internal/model` in lockstep** — and refresh golden tests when the contract changes.
- **Bilingual + RTL always:** add `en`+`ar` for new copy, use logical spacing utilities, and check the Arabic/RTL layout, not just English.

## Environment

`web/.env` / `web/.env.local` are gitignored. Only var the frontend reads:

```
API_BASE_URL=http://localhost:8080   # server-side fetch target (Go backend)
```

Backend env (optional): `PORT` (default 8080), `ALLOWED_ORIGINS` (comma-separated, default `http://localhost:3000`).
