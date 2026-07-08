# Verification — Refactor Safety Net

This app is being refactored under a strict rule: **user-facing behavior, UI, and
UX must stay byte-for-byte identical.** Automated tests cannot see pixels, RTL
flips, Leaflet interactions, or theming — so this manual checklist is the primary
guard against visual/interaction regressions. Run it at every phase boundary.

## Automated layer (fast, run first)

```
npm run test        # Vitest characterization tests (pure logic)
npx tsc --noEmit    # must stay clean (Phase 0 baseline: 0 errors)
npx eslint .        # must stay clean (Phase 0 baseline: 0 warnings)
npm run build       # must succeed (Phase 0 baseline: 10 routes, OK)
```

Characterization tests currently cover pure logic only:
`features/map/lib/pin-status`, `features/map/lib/pin-html` (incl. XSS escaping),
`features/alerts/lib/severity`, `features/alerts/lib/hazard`. As later phases
extract module-private logic (CSV builder in `expanded-data`, temperature
interpolation in `temperature-card`, the description helpers in
`station-overview`), add characterization tests for each as it becomes reachable.

## Manual smoke matrix

Run each screen through the axes below. Baseline = `main` before the phase.
Compare side by side; anything the eye can distinguish is a regression to stop on.

**Axes:** Theme `{light, dark}` × Language `{EN/LTR, AR/RTL}` × Data state
`{loading, populated, offline, empty, error}` where applicable.

### Screens

- [ ] `/` — map shell only (no side panel)
- [ ] `/components` — internal component-library showcase (every demo section renders)
- [ ] `/stations/:id` — overview (temperature card, warning alert, 2×2 metrics, forecast)
- [ ] `/stations/:id` — **offline** variant (station with `status: offline`)
- [ ] `/stations/:id/charts` — expanded charts modal (2×2 grid; 24h/7d/30d switch refetches)
- [ ] `/stations/:id/data` — expanded data modal (format/period/column toggles; CSV export downloads)
- [ ] `/stations/:id/share` — share view (copy link + embed snippet)

### Map interactions (`/`)

- [ ] Pan / drag within max bounds
- [ ] Zoom in/out via controls and scroll; zoom clamps at MIN/MAX
- [ ] "Locate me" control (allow + deny permission — deny stays silent, no crash)
- [ ] Pin colors match status/severity (normal / warning / offline / yellow / orange / red)
- [ ] Pin plain-click routes to `/stations/:id`
- [ ] Pin Ctrl/middle/Shift-click opens in new tab (href fallthrough)
- [ ] Legend shows Normal / Warning / Offline
- [ ] Status pill shows "N stations · Zoom X"
- [ ] Theme flip re-styles tiles/mask/Libya outline without reload

### Top bar

- [ ] Logo swaps correctly light/dark
- [ ] Station search: filter, keyboard up/down/enter nav, route on select
- [ ] Language toggle flips `<html lang/dir>` and mirrors layout (RTL)
- [ ] Theme toggle flips light/dark with the one-shot transition

### Modals / panels

- [ ] Side panel: right rail at `lg`, bottom-sheet on mobile (grab handle)
- [ ] Expanded modal: backdrop, Esc closes, body scroll locked while open
- [ ] Warning alert: collapsed vs expanded layouts; severity coloring
- [ ] Emergency contact `tel:` links dial correctly

### Data states

- [ ] Loading (throttle network) renders without layout shift
- [ ] Populated renders real values/units
- [ ] Offline station shows the offline card with "last seen"
- [ ] Empty (no readings/forecast) degrades gracefully
- [ ] Error (kill the API / proxy) — confirm behavior matches baseline (currently silent-degrades)

## Per-phase sign-off

For each phase, record: tests pass ✅ · tsc clean ✅ · eslint clean ✅ · build ✅ ·
manual matrix diffed against baseline with no visible change. Note any risky
change with a one-line reason it is visually/behaviorally neutral.
