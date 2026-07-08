# Figma Parity — Public System — Design Spec

**Date:** 2026-07-06
**Figma:** `LrEvjNZAjFWkjpeCiMq52R` — Mozn | Early Warning System, section **"Public System"** (`585:1957`)
**Scope:** Full audit of the public app against Figma + token re-sync. **The map (`features/map/**`) is never touched.** The "Dashboard" section (`1500:5679`) is out of scope.

---

## 1. Goal

Bring the public UI into pixel/token parity with the current Figma "Public System" design, without regressing working functionality and without touching the Leaflet map module.

Verification is **code-level** (Figma screenshot + code comparison); the dev server is not run this pass.

---

## 2. Findings summary

The codebase is already a faithful, tokenized Figma implementation (components cite Figma node IDs). Two categories of work remain:

1. **Token drift** — objective, pulled from Figma variables (`get_variable_defs`).
2. **Charts / Data tabs** — currently in-rail custom UI; Figma designs them as a single **Expanded Panel modal** (`232:2` charts, `268:81` data/export). Rebuild to match.

Overview-panel components (TopBar, Station Header, Temperature Card, Weather Metrics, Forecast List) already match and need no structural change — they only inherit the token fixes.

---

## 3. Token re-sync — `app/globals.css`

Source of truth = Figma variables.

| Token | Figma value | Current | Action |
|---|---|---|---|
| `--color-text-muted` | `#6e6e78` (= grey-500) | `var(--color-grey-400)` (`#8c8c96`) | **Change** → `var(--color-grey-500)` |
| `--shadow-card` | `0 1px 2px 0 rgb(0 0 0/5%), 0 2px 6px -1px rgb(0 0 0/4%)` | `0 2px 8px 0 rgb(0 0 0/4%)` | **Change** to two-layer |
| `--shadow-modal` *(new)* | `0 12px 40px 0 rgb(0 0 38/14%), 0 0 0 1px rgb(34 42 53/8%), 0 1px 5px -4px rgb(19 19 22/50%)` | — | **Add** (Expanded Panel elevation) |

Dark-mode: `--color-text-muted` already resolves to `grey-400` under `[data-theme=dark]` and is left as-is (dark canvas needs the lighter step). Only the light-mode base alias changes.

**Risk:** `text-muted` is used widely (station header label, metric labels, forecast labels, axis text). The change makes those one step darker — this is the *intended* Figma value. No structural risk; verify affected components visually against Figma.

---

## 4. Expanded Panel modal (Charts + Data) — the main build

### 4.1 Behavior & routing (decision: reuse existing routes)

- New client component `components/panels/expanded-panel.tsx` — a centered modal overlay on a dark backdrop (`--color-bg-overlay`), `z-[var(--z-modal)]`, rendered above the map.
- `/stations/:id/charts` → renders `<ExpandedPanel tab="charts">`.
- `/stations/:id/data` → renders `<ExpandedPanel tab="data">`.
- Internal `Charts | Data` toggle = links between the two routes. Close (✕) → `/stations/:id` (Overview).
- The existing `StationTabs` strip remains the entry point (Charts/Data tabs now open the modal; Overview/Share stay in-rail). `/share` is unchanged.
- Escape key + backdrop click close to Overview. Focus trapped while open. Body scroll locked.

### 4.2 Shared shell (both tabs) — from `232:2` / `268:81`

- Card: `bg-(--color-bg-primary)`, `rounded-[20px]`, `shadow-modal`, padding 32px. Widths: **Charts ≈ 960px**, **Data ≈ 560px**; responsive `max-w-[calc(100vw-32px)]`, scrollable on short viewports; on mobile it becomes a bottom-sheet consistent with the existing panel pattern.
- Header: station name `text-heading-md font-semibold` (`#1a1a1e`→`text-primary`); subtitle `#0002 · {city}, Libya` `text-body-xs text-(--color-text-muted)`; close = 32px circle `bg-(--color-bg-secondary)` with ✕ (reuse `XIcon`).
- Tab toggle: track `bg-(--color-bg-secondary) rounded-lg p-1`; active pill `bg-(--color-bg-primary) rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.06)]`, `text-label-lg/semibold text-(--color-text-primary)`; inactive `text-(--color-text-muted)`.
- Footer: `Data by MOZN — free for public use`, `text-body-xxs text-(--color-text-muted)`.

### 4.3 Charts tab (`232:2`)

- Period selector: `24h / 7d / 30d` pills. Active = `bg-(--color-bg-inverse) text-(--color-text-inverse)`; inactive = `border border-(--color-border-default) text-(--color-text-muted)`. `rounded-lg px-[14px] py-2`. Drives `/public/readings/history?range=`.
- 2×2 grid of chart cards, gap 24px. Card: `bg-(--color-bg-secondary) rounded-xl` + hairline ring `shadow-[0_0_0_1px_rgba(34,42,53,0.06)]`, 240px tall.
  - Title `text-label-lg/semibold text-(--color-text-primary)`; unit top-right `text-body-xxs text-(--color-text-muted)`.
  - Y grid at 0/25/50/75, labels `text-[8px] text-(--color-grey-300)`; X labels Mon–Sun same style.
- **Series (decision: match layout, real data):** Temperature (`#ef4444`, line), **Humidity** (`#3b82f6`, line — Figma's "Rainfall" slot), Wind Speed (`#10b981`, line), **Pressure** (`#8b5cf6`, line — Figma's "Water Level" slot). Reuse `HistoryChart`'s existing `seriesConfig`/geometry; render 4 at once in the grid instead of one with a series toggle. Line + dot markers + soft area gradient (already implemented). Empty range → existing "No history data" state.
  - *Note:* Figma shows Rainfall as **bars**; our data-backed equivalent (Humidity) stays a line to reuse the tested chart. Flag if bars are required for the Rainfall slot specifically.

### 4.4 Data tab (`268:81`)

- `FORMAT` segmented control: **CSV** (active, wired) / **PDF** / **PNG** (disabled, `title="Coming soon"`, `text-(--color-interactive-disabled-text)`). Track `bg-(--color-bg-secondary) rounded-[11px] p-1`; active `bg-(--color-bg-primary) rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.08)]`.
- `PERIOD` segmented control: `24h / 7d / 30d / 6mo / 1yr` (7d default). Section labels `text-label-sm/semibold text-(--color-text-muted) tracking-[0.8px]` uppercase.
- `INCLUDE` — 2-col checkbox grid: Temperature, Humidity, Rainfall, Water Level, Wind Speed, Coordinates (all checked default). Checkbox = 16px `rounded-md`, checked `bg-(--color-bg-inverse)` + white ✓; label `text-body-sm text-(--color-text-secondary)`.
- Divider lines `bg-(--color-border-subtle)` between sections.
- `Download CSV` button: full-width, `h-[52px] rounded-xl bg-(--color-bg-inverse) text-(--color-text-inverse)`, `↓ Download {FORMAT}`. Generates CSV client-side from `/public/readings` for the chosen period + included columns; triggers a Blob download. Columns not present in the API (Water Level) are omitted from the CSV with a note; Coordinates come from `station.lat/lng`.
- Meta line: `{n} readings · 15-min intervals · ~{size} KB`, computed from fetched rows (falls back to `—` before load).

### 4.5 Data availability constraints (explicit)

- History API series = Temp / Humidity / Wind / Pressure only → charts use those (labels per §4.3).
- No PDF/PNG export path → those formats are disabled, not faked.
- No water-level field → excluded from CSV; shown as a checkbox for visual parity but produces an empty column note if selected.

---

## 5. Files touched

**Edit**
- `app/globals.css` — token fixes + `--shadow-modal`.
- `app/(app)/stations/[stationId]/charts/page.tsx` — render `<ExpandedPanel tab="charts">`.
- `app/(app)/stations/[stationId]/data/page.tsx` — render `<ExpandedPanel tab="data">`.
- `components/panels/station-tabs.tsx` — Charts/Data now open the modal (no visual change to the strip; verify active states).

**Add**
- `components/panels/expanded-panel.tsx` — modal shell + Charts/Data views (may split into `expanded-charts.tsx` / `expanded-data.tsx` + `expanded-panel.tsx` shell for clarity).
- Possibly `components/ui/segmented.tsx` — reusable segmented control (Format/Period) if it reduces duplication.

**Keep / do not touch**
- `features/map/**` (map), `components/panels/share-tab.tsx` (kept), `charts-tab.tsx`/`data-tab.tsx`/`history-chart.tsx` (history-chart reused; old in-rail `charts-tab.tsx`/`data-tab.tsx` retired from routing but left in tree unless cleanly removable).

**Reuse (no dup):** `XIcon`, `ShareIcon`, icon set, `cn`, `HistoryChart`/`seriesConfig`, tokens/utilities per CLAUDE.md.

---

## 6. Verification

- `npm run lint` and `npx tsc --noEmit` clean.
- Code + Figma screenshot comparison for: token-affected overview components, Charts modal (`232:2`), Data modal (`268:81`).
- Confirm map module untouched (`git`-less repo → manual: no edits under `features/map/`).
- No new dependencies; no icon package added.

---

## 7. Resolved decisions (confirmed with user)

1. Rainfall slot → **line** (data-backed via Humidity). No bars.
2. Old `charts-tab.tsx` / `data-tab.tsx` → **removed** from the tree (`history-chart.tsx` kept — reused by the modal).
3. Modal on mobile → **bottom-sheet** (consistent with the existing station side panel). Figma has no distinct mobile Charts/Data modal — the mobile "Charts Tab"/"Data Tab" frames (`612:3598`, `612:3619`) just show the mobile overview sheet.

## 8. Follow-up parity gaps (out of scope this pass — noted for later)

- **Mobile 7-Day Forecast layout:** Figma mobile (`612:3533`) renders the forecast as **horizontal scrolling day-cards** (icon + high temp per card); the app's `ForecastList` renders vertical rows at all breakpoints. Distinct mobile variant not built this pass.
