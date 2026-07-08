# Purge all mock data → empty-state shell

**Date:** 2026-07-07
**Status:** Approved (design)
**Branch:** feat/dark-mode-and-redesign

## Goal

Remove 100% of fabricated/mock/seed data from the dashboard so that **no invented
value survives anywhere**, and every surface renders a genuine empty state. The
app becomes a clean shell whose data contract is intact and ready to be wired to
a real data source later. There is currently **no real data source** — no DB, no
external API — so "remove mock data" means: empty the data, keep the structure.

Two scoping decisions (confirmed with the user):

1. **End state = empty states everywhere.** API endpoints return empty
   collections / zeros; the UI shows its empty/loading states.
2. **Strip everything fabricated.** Not just fake records — also default
   threshold numbers, the demo region list, default emergency numbers, the
   seeded RBAC matrix, notification-preference defaults, and the demo signed-in
   user "Rasheed". Nothing invented remains.

## Principle

Preserve the **contract and structure** (Go structs + JSON shape, TS types,
component props, API endpoints, genuine domain enums like status/severity/role
_type_ constants). Delete all **fabricated content** (records, names, counts,
timestamps, copy, coordinates, numeric defaults). Where data is hardcoded in the
frontend, it is **removed, not relocated**.

## Scope of changes

### Backend — `server/internal/repository/`

- `dashboard_repo.go` `seedOverview()` and all 7 `seed_admin.go` methods
  (`Stations`, `AlertInbox`, `Thresholds`, `Users`, `AlertHistory`,
  `ActivityLog`, `Settings`) return their existing struct types with:
  - empty slices for every collection,
  - `0` for every count/total,
  - `""` for every fabricated string (titles/subtitles/status/notes/timestamps).
- Filter-tab option lists that enumerate **fabricated regions/users/categories**
  are emptied. Genuine domain enums (station status, alert severity, role names)
  remain as type constants in `model/` — they are types, not data.
- Dead seed helpers (e.g. `thresholdMetric`) deleted once unreferenced.
- Endpoints, routing, service layer, and struct shapes are **unchanged** — this
  is the seam a real repository implementation later fills.

### Frontend — remove, don't relocate

- **`SEED` arrays** in `alert-management-view.tsx`, `alert-templates-view.tsx`,
  `notifications-menu.tsx` → removed; state initializes empty (`[]`).
- **localStorage "stands-in-for-backend" default seeds** → blanked to empty:
  - `admin-config-provider.tsx` (`DEFAULT_TEMPLATE_STEPS`, `DEFAULT_CITY_CONTACTS`)
  - `settings/preferences.ts` (`DEFAULT_PREFERENCES`, `REGION_OPTIONS`)
  - `users/role-permissions-state.ts` (`DEFAULT_PERMISSIONS`)
  - `lib/emergency-contacts.ts` (`DEFAULT_EMERGENCY_CONTACTS`)
- **Synthetic generators & fixtures deleted**, callers switched to empty states:
  - `station-detail/station-weather.ts` (`STATION_WEATHER`, `FLASH_FLOOD_ACTIONS`, `buildForecast`)
  - `station-detail/station-detail.ts` (`FIXTURE_ALIAS`, `synthWeather`, `alertFor`)
  - `stations/components/station-form-shared.ts` (`KNOWN_STATIONS`, `estimateElevation`, `buildPreviewDetail`)
  - `stations/components/station-live-view.tsx` (`seedFrom` telemetry PRNG)
- **Illustrative chart constants removed** — charts render real (now-empty) data:
  - `dashboard/components/alert-trend.tsx` (`PRIOR_DAYS`, `WEIGHTS`)
  - `dashboard/components/status-strip.tsx` (`seededDelta`)
- **Demo identity blanked** — `UserCard name="Rasheed"` and the role-provider
  default become an unauthenticated / empty identity state.

### Empty states

Audit all 12 surfaces and ensure each renders cleanly with no data; **add** a
consistent empty state where one is missing:

Dashboard (stats / map / needs-attention / recent-activity / alert-trend /
region-coverage / status-donut), Stations (table / form / live / detail),
Alert Inbox, Active Alerts, Alert Templates, Thresholds, Users & Access,
History — Alerts, History — Activity, Settings, topbar notifications, sidebar user.

Special attention: zero-data charts (donut, bar, trend) must show an empty
state rather than a broken/zero-size render; the map with no pins; tables with
no rows; the threshold editor with no metrics.

## Non-goals

- No real data source is added.
- No endpoint, route, type, or component API is renamed or restructured.
- Genuine i18n strings, type/interface definitions, and GeoJSON basemap geometry
  (`web/components/maps/data/*.geo.json`) are untouched.

## Verification / "no leftovers" proof

1. Backend `go build ./...` and `go vet ./...` clean.
2. Frontend `npm run typecheck` clean; dev server compiles.
3. Drive every route in a browser; confirm each renders its empty state with no
   crash or console error.
4. Final grep sweep across `server/` and `web/` (excluding node_modules, .next,
   *.geo.json, i18n) for mock tokens — must return **nothing** in code:
   `Rasheed`, `Yusuf`, `Omar`, `Fatima`, `Derna`, `Benghazi`, `Misrata`,
   `Zliten`, `Tripoli`, `Sabha`, `Ghat`, `Ghadames`, `Tobruk`, `Roaya`,
   `mozn.ly`, `gov.ly`, `\b191\b`, `\b199\b`, `\b153\b`, `SEED`,
   `synthWeather`, `buildPreviewDetail`, `PRIOR_DAYS`.

## Risks

- Some components may assume non-empty data and crash on empty (e.g. array `[0]`
  access, chart domains). The plan must check each consumer and guard it.
- The map/`overview` divergence: the map is fed by `overview.map.stations`
  (6-station seed), not `/api/v1/stations`. Emptying `seedOverview()` empties the
  map. Verify during implementation (the memory note about "43-station Roaya
  data" is stale/reverted).
