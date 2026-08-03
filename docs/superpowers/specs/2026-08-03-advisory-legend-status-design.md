# Advisory Status on the Map Legend — Design Spec

**Date:** 2026-08-03
**Goal:** Add a fourth status, **Advisory**, rendered in orange, to the station map legend in both apps.

## Context

Both apps render a floating status legend over their Libya map, and both show the same three keys today:

| App | Component | Legend keys |
| --- | --- | --- |
| Public map | `mozn-public/frontend/features/map/components/map-pin-legend.tsx` | Normal · Warning · Offline |
| Admin dashboard | `mozn-dashboard/web/features/dashboard/components/map-canvas.tsx:122-133` | Online · Warning · Offline |

### The legend is a grouping key, not a pin-colour key

This is the single most important fact behind the design, and it is already true before this change. `map-pin-legend.tsx:12-18` documents it:

> Active alerts still colour individual pins by finer severity (yellow/orange/red) via `pinKindFor`; the legend groups those under "Warning".

Pins are coloured by `pinKindFor()` with priority `red > orange > yellow > station status`. That yields six possible pin hues, which the three-key legend collapses into three groups. The "Warning" swatch is `#ef4444` red and matches *none* of the three severity pin hues exactly. So the legend has never been a literal colour lookup, and this change does not make it one.

### Existing colour tokens

Public app (`mozn-public/frontend/app/globals.css`):

| Token | Value | Current role |
| --- | --- | --- |
| `--color-status-normal-500` | `#10b981` | Normal legend dot + normal pins |
| `--color-status-warning-500` | `#ef4444` | Warning legend dot |
| `--color-status-offline-400` | `#9ca3af` | Offline legend dot + offline/maintenance pins |
| `--color-status-advisory-500` | `#f59e0b` | Amber "watch" tier — **unused by the map** |
| `--color-severity-yellow-500` | `#eab308` | Yellow-tier alert pins |
| `--color-severity-orange-500` | `#f97316` | Orange-tier alert pins |
| `--color-severity-red-500` | `#dc2626` | Red-tier alert pins |

Dashboard (`mozn-dashboard/web/app/globals.css`) mirrors these as `--status-normal` / `--status-warning` / `--status-offline` / `--status-advisory` and `--severity-yellow` / `--severity-orange` / `--severity-red`. Critically, `--color-severity-orange` is **already aliased in `@theme inline` (line 263)**, so the `bg-severity-orange` utility exists. **No new colour token is required in either app.**

### Naming collisions that were considered and rejected

1. **`SEVERITY_META.info.label` is already the string `"Advisory"`** (`features/alerts/lib/severity.ts:73`) and is bound to `--color-severity-yellow-500`. That is the *alert panel's* vocabulary, not the map's. This spec does not change it; the two surfaces will use the word "Advisory" for the same underlying tier (the yellow alert tier), which is consistent, even though the panel tints it yellow and the map legend swatches it orange.
2. **`--color-status-advisory-500` (`#f59e0b` amber)** is the token literally named for this purpose. It was rejected in favour of `--color-severity-orange-500` (`#f97316`) because the requirement is specifically an *orange* dot.
3. **Adding `"advisory"` to the `StationStatus` union** was rejected. `StationStatus` is `"normal" | "warning" | "offline" | "maintenance"` (`components/api/types.ts:20`) and reflects what the backend actually emits. The backend has no advisory station status, so such a key would never match a pin.

## Decisions

- **Advisory means the yellow alert tier.** It is split out of the existing "Warning" group. No backend change, and the state already occurs on live maps today.
- **Advisory's swatch is `--color-severity-orange-500` (`#f97316`).**
- **Pin rendering is untouched.** `pinKindFor()`, `pinColorFor()`, `STATUS_COLOR`, and `SEVERITY_COLOR` keep their current behaviour and values. Pins keep three distinct severity hues.
- **Both apps change**, so the two maps share one vocabulary.
- **The legend gets its own explicit table** rather than an extra entry on `STATUS_COLOR` / `STATION_STATUS`. Those are keyed by real station statuses; Advisory is not one, and widening them would either break the `Record<StationStatus, …>` type or imply the backend emits a status it does not.

### Resulting grouping

| Legend key | Swatch | Groups these pin kinds |
| --- | --- | --- |
| Normal | `#10b981` green | `normal` (dashboard: `online`) |
| **Advisory** *(new)* | **`#f97316` orange** | `yellow` |
| Warning | `#ef4444` red | `orange`, `red` |
| Offline | `#9ca3af` grey | `offline`, `maintenance` |

Read left to right the ramp is green → orange → red → grey, a clean escalation.

### Known imprecision (accepted)

The Advisory swatch `#f97316` is the exact hue of the **orange-tier alert pin**, which this grouping files under **Warning**. So an orange pin sits under a red "Warning" dot while the orange "Advisory" dot points at yellow pins.

This was raised and accepted. It is the same class of imprecision the legend already carries (the red Warning dot matches no severity pin), and the alternative — regrouping orange pins under Advisory so the swatch is literally correct, leaving Warning as red-only — was explicitly declined. **Do not "fix" this during implementation.**

## Architecture

Each app gains a small, self-documenting legend table that is deliberately decoupled from pin rendering. The legend component's only job becomes iterating that table.

### Public app

```ts
// features/map/lib/pin-status.ts
export type LegendKey = "normal" | "advisory" | "warning" | "offline";

/** Legend swatches. A coarse grouping of pin kinds — deliberately NOT a 1:1
 *  colour match with pins: yellow/orange/red pins all fall under two keys. */
export const LEGEND_COLOR: Readonly<Record<LegendKey, string>> = {
  normal:   "var(--color-status-normal-500)",
  advisory: "var(--color-severity-orange-500)",
  warning:  "var(--color-status-warning-500)",
  offline:  "var(--color-status-offline-400)",
};
```

`map-pin-legend.tsx` builds its `items` array from `LegendKey` values and reads swatches from `LEGEND_COLOR` instead of calling `pinColorFor()`. Its doc comment is updated: the key is now four statuses, and the sentence about grouping severities under "Warning" must say that the yellow tier is now surfaced as "Advisory".

### Dashboard

The mirror lives in `features/dashboard/lib/status.ts` as a `MAP_LEGEND` table of `{ key, dotClass, labelKey }`, using Tailwind utility classes (`bg-status-normal`, `bg-severity-orange`, `bg-status-warning`, `bg-status-offline`) to match how `STATION_STATUS` already expresses colour. `STATION_STATUS` itself is left untouched — it still drives pins and stays typed `Record<StationStatus, …>`.

`map-canvas.tsx` replaces the inline `(["online", "warning", "offline"] as const)` at line 124 with a map over `MAP_LEGEND`, taking its label from `t(labelKey)` rather than `pinLabels`. `pinLabels` continues to serve the Leaflet pins unchanged.

## Data flow

Unchanged. No API field, no new fetch, no state. Station → `pinKindFor()` → pin colour is exactly as before. The legend is static presentational chrome whose contents do not depend on the station list.

## i18n

Both apps are bilingual EN/AR with full RTL, so both dictionaries need the new string.

| App | File | Key | en | ar |
| --- | --- | --- | --- | --- |
| Public | `components/lib/i18n.ts` | `legendAdvisory` | `Advisory` | `تنبيه` |
| Dashboard | `lib/i18n/chrome.ts` | `status.advisory` | `Advisory` | `تنبيه` |

`تنبيه` is chosen over `ترقب` ("watch"), which is already taken by the yellow **pin** label (`chrome.ts:154` `pin.watch`) — reusing it would make two different map affordances read identically in Arabic. **`تنبيه` is a proposal pending a native-speaker check**; if it is wrong, it is a one-line change in each dictionary and nothing else moves.

Both legends are already `flex-wrap` containers with gap utilities, so a fourth item reflows on narrow viewports rather than overflowing. RTL is inherited from the existing container — no logical-property changes needed.

## Error handling

There are no failure modes to handle. The legend renders a fixed four-item constant array with no external input, no async work, and no user interaction (the dashboard's chip is even `pointer-events-none`, `map-canvas.tsx:123`). A missing translation key falls back to the existing `translate()` behaviour in each app.

## Testing

- **Type safety carries most of the weight.** `Record<LegendKey, string>` and `Record<StationStatus, …>` make a missing or misspelled key a compile error. Run `npx tsc --noEmit` (public) and `npm run typecheck` (dashboard).
- **`npm run lint` in both apps.**
- **Existing tests must stay green, unmodified.** `features/map/lib/pin-status.test.ts` asserts `pinColorFor("orange") === "var(--color-severity-orange-500)"` and `pinColorFor("normal") === "var(--color-status-normal-500)"`. Since pin logic is untouched, these must pass with no edits — if they need changing, the implementation has drifted from this spec. Run `npm run test` in the public app.
- **No new unit test.** There is no existing test for `map-pin-legend.tsx`, and a test asserting a constant array's contents restates the source without catching a real defect. The meaningful verification is visual.
- **Visual check, both apps.** Public on `:3000`, dashboard on `:3001` (via `./dev.sh`). Confirm four items, correct order, the orange dot renders `#f97316`, the row does not overflow at mobile width, and the Arabic/RTL layout mirrors correctly. The dashboard legend sits behind auth and needs the Go backend on `:8080`.

## Out of scope

- `features/station/components/expanded-panel.tsx:203-213` reuses `legendNormal` / `legendWarning` / `legendOffline` for a **history-chart** legend. That is a different surface with different semantics and is not part of this change.
- The alert panel's `SEVERITY_META` labels and colours.
- Any backend or `StationStatus` type change.
