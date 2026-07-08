# Project implementation rules

## Figma source of truth

- File: https://www.figma.com/design/LrEvjNZAjFWkjpeCiMq52R/Mozn-%7C-Early-Warning--System?node-id=304-813&t=Wmto0woSJixVsLbC-1
- `fileKey`: `LrEvjNZAjFWkjpeCiMq52R`
- All node IDs referenced below (e.g. `304:816`, `324:2`, `304:819`, `543:2`) live in this file.

## Figma MCP workflow

For every Figma-driven task:

1. Use the Figma MCP server.
2. Run `get_design_context` for the exact Figma node provided.
3. Run `get_screenshot` for visual reference before coding.
4. If the response is too large or truncated, run `get_metadata`, identify the smaller required nodes, then call `get_design_context` only for those nodes.
5. Treat Figma MCP output as design context, not final code style.
6. Translate the design into this codebase’s actual framework, components, tokens, and conventions.
7. Validate visual parity against the Figma screenshot before saying the task is complete.

## Component rules

- Reuse existing components before creating new ones.
- Check `features/{station,alerts,map}` and the shared `components/{ui,icons,library,lib,state,api}` before implementing. (Note: this project keeps `components/` and `features/` at the repo root, **not** under `src/`.)
- Do not duplicate buttons, inputs, modals, cards, icons, typography, or layout primitives if equivalents exist.
- Use the project’s existing styling system.
- Do not hardcode colors, spacing, border radius, or typography when tokens/classes already exist.
- Match responsive behavior, not only desktop pixels.

## Asset rules

- The Figma MCP server may provide image or SVG asset URLs.
- If Figma provides an asset source, use it.
- Do not create placeholder images or icons when Figma provides real assets.
- Do not install a new icon package unless I explicitly approve it.

## Quality rules

- Before editing, explain the implementation plan.
- Keep changes minimal and localized.
- Run lint/typecheck/tests after editing.
- Fix all errors caused by the change.
- Summarize changed files and any remaining visual differences.

---

# Codebase guide

Mozn early-warning UI: a Next.js dashboard that shows Libyan weather stations on a map, plus per-station readings, history charts, and forecasts.

## Stack

- **Next.js 16.1.1** (App Router) + **React 19.2**, TypeScript strict
- **Tailwind CSS v4** via `@tailwindcss/postcss` — design tokens live in `app/globals.css` as CSS variables
- **Leaflet 1.9** for the map (no react-leaflet — direct Leaflet API)
- No state library, no UI kit, no test framework wired up

## Commands

- `npm run dev` — dev server on :3000 (pinned to `--webpack`; see Gotchas)
- `npm run build` — production build (Turbopack is fine here)
- `npm run start` — serve the production build
- `npm run lint` — ESLint via flat config (`eslint.config.mjs`)
- TypeScript: `npx tsc --noEmit` (no script alias)

## Layout & routing

The project keeps `app/` and `components/` at the repo root (no `src/`).

```
app/
  layout.tsx                     Root <html>, fonts, metadata
  globals.css                    Tailwind v4 + design tokens (CSS vars)
  (app)/                         Route group with the map shell
    layout.tsx                   Fetches stations, mounts TopBar + MapCanvas + StationsProvider
    page.tsx                     Empty (map only; no side panel)
    stations/[stationId]/
      layout.tsx                 Fetches station + renders <StationSidePanel>
      page.tsx                   Overview (TemperatureCard, WeatherMetric, ForecastList, WarningAlert)
      charts/page.tsx            ExpandedPanel (Charts) modal — 2×2 history grid
      data/page.tsx              ExpandedPanel (Data) modal — CSV export form
      share/page.tsx             Share view (in-rail; copy link + embed)
  api/proxy/[...path]/route.ts   Client-side fetches → upstream API
  dashboard/page.tsx             Stub (`return null`) — not in use
  locations/[locationsId]/...    Stub (`return null`) — not in use
  components/page.tsx            Internal component library / demo page at /components
```

Stray files at repo root (`page.html`, `styles.css`) are old snapshots — ignore; don't import from them.

## API layer (`components/api/`)

- `client.ts` — `apiFetch<T>(path, { query, revalidate, ...init })`. Returns the **unwrapped `data`** from the upstream envelope `{ data, message?, metadata?, code?, error? }`. `apiFetchEnvelope` keeps the envelope (use this when you need `metadata.total` for pagination).
- **Server-side** fetches hit `https://mozn.org.ly/api` directly (`NEXT_PUBLIC_API_BASE`). **Client-side** fetches go through `/api/proxy/<path>` to dodge mixed-content/CORS. `buildUrl` picks the right one based on `typeof window`.
- Public endpoints: `/public/stations`, `/public/stations/:id`, `/public/stations/nearest`, `/public/readings`, `/public/readings/history`, `/public/forecasts/daily`, `/public/forecasts`.
- The station detail endpoint **omits** `status`/`active_alerts`/`forecast_alerts`. `getStation()` backfills these by calling `listStations()` (Next dedupes via request memoization). Don't rely on those fields existing on the raw detail response.
- Pass `revalidate` not `cache` — the helper passes it via `next: { revalidate }`. The proxy route is `force-dynamic` and `cache: "no-store"` (client fetches stay fresh).
- Types live in `components/api/types.ts` — Station, Reading, ReadingHistoryBucket, DailyForecast, Alert, AlertCounts, ForecastAlert, ApiEnvelope, PaginationMeta.

## State

`components/state/stations-context.tsx` — `StationsProvider` (Client) wraps the (app) layout with the server-fetched station list. `useStations()` reads it from any client component below. Server components fetch their own data directly via `components/api/`.

## Map (`features/map/`)

- `components/map-canvas.tsx` — Client. Owns zoom/labels/recenter UI and the router push on pin click. Dynamically imports `LeafletLibyaMap` with `ssr: false` (Leaflet touches `window`).
- `components/leaflet-libya-map.tsx` — Client. Creates the Leaflet map, draws Libya's GeoJSON outline (`libya.geo.json`), and renders pins as `L.divIcon` with `mz-pin*` CSS classes. Plain-click → `onSelectStation(id)`; Ctrl/middle/Shift click falls through to the anchor href so "open in new tab" still works.
- `components/libya-map.tsx`, `components/map-pin{,-label,-station}.tsx` — used by the `/components` showcase page, not the live map.

## Features

- `features/station/` — the station detail UI, exported via `features/station/index.ts`: side panel, header, tabs, overview, offline state, weather metrics, forecast list, share tab, `history-chart` (SVG renderer + `seriesConfig`), and the `expanded-panel` / `expanded-charts` / `expanded-data` modal (Figma 232:2 / 268:81) that `/charts` and `/data` route into
- `features/alerts/` — `components/warning-alert.tsx` hazard banner (collapsed/expanded) + `lib/` (severity, hazard, defaults), exported via `features/alerts/index.ts`

## Shared components

- `components/ui/` — TopBar, IconButton, Logo, StationSearch
- `components/icons/index.tsx` — Inline SVG icon set. **Reuse these**; do not add an icon package.
- `components/library/` — Hero / Section / Footer primitives for the `/components` showcase page only
- `components/lib/` — `cn.ts` class merger, `i18n.ts` dictionary, `lang-server.ts` cookie reader
- `components/state/`, `components/api/` — React contexts and the data-fetch layer

## Styling

Design tokens in `app/globals.css` follow a **two-tier** Tailwind v4 architecture — naming mirrors the [Figma file](https://www.figma.com/design/LrEvjNZAjFWkjpeCiMq52R/Mozn-%7C-Early-Warning--System):

- **Tier 1 — `@theme`:** utility-generating, theme-invariant design tokens — the colour ramps (`grey`/`brand-blue`/`sky-blue`), `status`/`severity`/`advisory` swatches, the `chart` series palette, the type scale, spacing, radius, shadow, motion. Exposed as both `var(--token)` and utilities (`bg-grey-50`, `text-body-sm`, `shadow-card`).
- **Tier 2 — `:root` + `html[data-theme="dark"]` (in `@layer base`):** the **semantic theming layer** (`--color-bg-*`, `--color-text-*`, `--color-border-*`, `--color-interactive-*`, chart furniture). These alias tier-1 primitives to intent and flip wholesale for dark. Consume them via the v4 var shorthand — `bg-(--color-bg-primary)`, `text-(--color-text-muted)` — **not** utility classes (they're intentionally kept out of `@theme`, so no `bg-bg-primary` utilities are generated).

Add a new primitive/scale to `@theme`; add a new per-theme intent to the `:root`/dark blocks. `@custom-variant dark` is registered against `[data-theme="dark"]` for one-off `dark:` overrides. **Don't** use `@theme inline` for the semantic layer — components reference `var(--color-*)` directly, which `inline` wouldn't emit.

**Use utilities (preferred — generated from `@theme`):**

- Typography: `text-display-xl`, `text-heading-xl`, `text-body-sm`, `text-label-md`. Each utility sets size + line-height in one shot (Figma type scale).
- Font weight: `font-normal` / `font-medium` / `font-semibold` / `font-bold`. Headings and Display default to 700; Body to 400; Label to 600 — compose explicitly per element.
- Shadows: `shadow-card`, `shadow-pin`, `shadow-legend`.
- Radius: `rounded-sm` (2px), `rounded-md` (4px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-3xl` (24px), `rounded-full`.
- Spacing: `--spacing: 4px` is set globally, so `p-1 = 4px`, `p-4 = 16px`, `gap-2 = 8px`, etc. — the entire numeric scale (`p-*`, `gap-*`, `mx-*`, `size-*`) resolves in 4px steps and matches Figma's spacing scale.

**Use the v4 CSS-variable shorthand for semantic colors:**

- `bg-(--color-bg-primary)`, `text-(--color-text-muted)`, `border-(--color-border-subtle)`, `ring-(--color-text-primary)`, `placeholder:text-(--color-text-muted)`. The parentheses shorthand is v4's preferred form for variable references — use it instead of the older `bg-[var(--color-x)]` bracket syntax.
- Semantic var names (`--color-bg-primary`, `--color-text-primary`, …) come straight from Figma. The matching auto-generated utility (`bg-bg-primary`) reads awkwardly, so the `(...)` form is the convention here.
- Primitives (`--color-brand-blue-500`, `--color-grey-100`, `--color-status-warning-500`) follow Figma color groups. Component code should prefer the semantic alias unless a specific shade is needed.

**Pixel utilities are still bracketed where a non-scale value is required:** `rounded-[2.5px]`, `min-h-[96px]`, `w-[368px]`. Use the numeric scale (`p-4`, `gap-2`) whenever the value is on the 4px grid.

**Responsive prefixes used in the codebase:** `md:` (≥768) and `lg:` (≥1024). The side panel is bottom-sheet on mobile, fixed right rail at `lg:`.

## Gotchas — read these before debugging

- **Turbopack dev crashes on `/stations/:stationId` overview.** Symptom in the browser: `Jest worker encountered 2 child process exceptions, exceeding retry limit`. Once it fires, the dev worker stays dead and every subsequent route 500s with the same message. The dev script is pinned to `next dev --webpack` for this reason — do not revert to plain `next dev` without re-testing the overview route. `next build` (production Turbopack) is unaffected.
- **Stale `.next/dev/lock`** after a hard kill blocks `next dev` from starting with "Unable to acquire lock". Delete `.next/dev/lock` and retry.
- **Server vs client fetch base URLs differ.** `apiFetch` from a Server Component bypasses `/api/proxy`. If you add a route handler that itself calls `apiFetch`, it's running server-side too — fetches go straight to upstream.
- `getStation()` does a second list call to backfill `status` — when adding fields, decide whether they should come from the list endpoint or the detail endpoint and update the merge in `components/api/stations.ts:getStation`.
- The map's pin HTML is built with `stationIconHtml()` — it's a raw HTML string inserted via Leaflet `divIcon`. Anything dynamic must go through `escapeHtml()`. Don't interpolate untrusted data without escaping.
- `app/dashboard/`, `app/locations/[locationsId]/`, and the root-level `page.html`/`styles.css` are placeholders/leftovers, not active code paths.

## Environment

`.env.local` is required and gitignored. Both vars currently point at production:

```
NEXT_PUBLIC_API_BASE=https://mozn.org.ly/api   # server-side fetches
MOZN_API_BASE=https://mozn.org.ly/api          # /api/proxy upstream
```