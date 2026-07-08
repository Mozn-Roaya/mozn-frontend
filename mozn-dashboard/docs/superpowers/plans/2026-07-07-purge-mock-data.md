# Purge All Mock Data → Empty-State Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove 100% of fabricated/seed data from the dashboard (backend + frontend) so every surface renders a genuine empty state and no invented value survives anywhere.

**Architecture:** Backend repository methods keep their signatures/types but return empty structures; the Go golden tests are regenerated to lock the empty payloads. Frontend hardcoded data (SEED arrays, localStorage default seeds, synthetic generators, illustrative chart constants, demo identity) is removed, and each consuming surface renders the shared `EmptyState` component. API contract, routes, types, and component props are unchanged.

**Tech Stack:** Go (stdlib, in-memory repo, golden tests), Next.js App Router + TypeScript, Tailwind v4, shadcn/ui, Recharts. Frontend verification is `npm run typecheck` + dev-server compile + browser drive (no JS unit-test harness exists). Backend verification is `go test ./...` (golden) + `go vet ./...`.

## Global Constraints

- Preserve every Go struct shape and JSON field name; only values change. Collections MUST marshal as `[]` not `null` — use non-nil empty composite literals (`[]model.X{}`), never `nil`.
- Do not rename/restructure endpoints, routes, TS types, or component props.
- Do not touch: i18n string files except to ADD empty-state keys, GeoJSON basemaps (`web/components/maps/data/*.geo.json`), type/interface definitions.
- Empty-state copy is bilingual: every new user-facing string gets an EN key in `web/lib/i18n/en/*` (or the existing locale structure) AND its AR counterpart.
- Follow the existing empty-state convention: `import { EmptyState } from "@/components/common/empty-state"` → `<EmptyState icon={LucideIcon} title={t("...")} message={t("...")} />` (see `features/alert-inbox/components/alert-inbox-view.tsx:160` for the reference usage).
- "No leftovers" is a hard acceptance gate — Task 10's grep sweep MUST return zero code matches.

---

### Task 1: Empty the Go backend seed + regenerate golden files

**Files:**
- Modify: `server/internal/repository/dashboard_repo.go` (`seedOverview`, lines 28–81; `intPtr` line 28)
- Modify: `server/internal/repository/seed_admin.go` (all 7 methods + `thresholdMetric` lines 138–161)
- Regenerate: `server/internal/handler/testdata/*.golden.json`
- Test: `server/internal/handler/golden_test.go` (unchanged; drives regeneration)

**Interfaces:**
- Produces: unchanged method set — `Overview`, `Stations`, `AlertInbox`, `Thresholds`, `Users`, `AlertHistory`, `ActivityLog`, `Settings` — each returning its existing `model.*` type with empty values.

- [ ] **Step 1: Empty `seedOverview()`** in `dashboard_repo.go`. Replace the body of `seedOverview` with:

```go
func seedOverview() model.DashboardOverview {
	return model.DashboardOverview{
		Header:         model.DashboardHeader{Title: "", StatusLabel: "", Live: false},
		Stats:          []model.StatCard{},
		Map:            model.StationHealthMap{Title: "", Subtitle: "", CoverageNote: "", Stations: []model.MapStation{}},
		NeedsAttention: model.NeedsAttention{OpenCount: 0, Items: []model.AttentionItem{}},
		RecentActivity: []model.ActivityItem{},
		Regions:        []model.RegionStat{},
	}
}
```

Then delete the now-unused `intPtr` helper (line 28) if no other reference remains in the package (it is also used in `seed_admin.go` — see Step 2; delete only after Step 2 removes its last use).

- [ ] **Step 2: Empty all 7 methods** in `seed_admin.go`. Each returns its type with empty slices, `0` counts, `""` strings. Replace each method body:

```go
func (r *InMemoryRepository) Stations(_ context.Context) (model.StationsPage, error) {
	return model.StationsPage{
		Total: 0, RegionCount: 0, NeedAttention: 0,
		Filters: []model.FilterTab{}, Groups: []model.StationRegionGroup{},
	}, nil
}

func (r *InMemoryRepository) AlertInbox(_ context.Context) (model.AlertInboxPage, error) {
	return model.AlertInboxPage{
		AvgAck: "", SLANote: "",
		Filters: []model.FilterTab{}, Items: []model.InboxItem{},
	}, nil
}

func (r *InMemoryRepository) Thresholds(_ context.Context) (model.ThresholdsPage, error) {
	return model.ThresholdsPage{
		Metrics: []model.MetricThresholds{},
		Impact:  model.ThresholdImpact{Note: "", Stations: []model.ImpactStation{}},
		Changes: []model.ThresholdChange{},
	}, nil
}

func (r *InMemoryRepository) Users(_ context.Context) (model.UsersPage, error) {
	return model.UsersPage{
		AdminCount: 0, GovCount: 0,
		Filters: []model.FilterTab{}, Users: []model.UserRow{},
	}, nil
}

func (r *InMemoryRepository) AlertHistory(_ context.Context) (model.AlertHistoryPage, error) {
	return model.AlertHistoryPage{
		Ranges: []string{}, Regions: []string{}, Types: []string{}, Severities: []string{},
		Rows: []model.AlertHistoryRow{},
	}, nil
}

func (r *InMemoryRepository) ActivityLog(_ context.Context) (model.ActivityLogPage, error) {
	return model.ActivityLogPage{
		Categories: []string{}, Users: []string{}, Groups: []model.ActivityDayGroup{},
	}, nil
}

func (r *InMemoryRepository) Settings(_ context.Context) (model.SettingsPage, error) {
	return model.SettingsPage{
		Notifications: []model.NotificationPref{}, ValidationNote: "",
		ValidationRules: []model.ValidationRule{},
	}, nil
}
```

Then delete the `thresholdMetric` helper (lines 138–161) — now unused. Delete `intPtr` from `dashboard_repo.go` (its last uses are gone).

- [ ] **Step 3: Confirm it compiles**

Run: `cd server && go build ./...`
Expected: no output, exit 0. (If `go vet` flags an unused import, remove it — `context` and `model` both remain used by signatures/return types, so none should be.)

- [ ] **Step 4: Regenerate golden files**

Run: `cd server && go test ./... -update`
Expected: PASS. This rewrites `internal/handler/testdata/*.golden.json` to the empty payloads.

- [ ] **Step 5: Verify golden tests pass without `-update`, and vet is clean**

Run: `cd server && go test ./... && go vet ./...`
Expected: `ok` for all packages, no vet output. Spot-check one golden file: `dashboard_overview.golden.json` should contain `"stats":[]`, `"stations":[]`, `"regions":[]` and empty header strings — no station names, no "Rasheed", no `153`.

- [ ] **Step 6: Commit**

```bash
git add server/internal/repository/dashboard_repo.go server/internal/repository/seed_admin.go server/internal/handler/testdata
git commit -m "refactor(server): return empty payloads from repository; drop all seed data"
```

---

### Task 2: Dashboard surface — remove illustrative chart constants + empty states

**Files:**
- Modify: `web/features/dashboard/components/alert-trend.tsx` (remove `PRIOR_DAYS`, `WEIGHTS`, lines ~35–51)
- Modify: `web/features/dashboard/components/status-strip.tsx` (remove `seededDelta`, lines ~26–30)
- Modify: `web/features/dashboard/components/needs-attention.tsx`, `recent-activity.tsx`, `station-health-map.tsx` / `map-canvas.tsx`, `station-status-donut.tsx`, region coverage panel — add empty states
- Add i18n keys: `web/lib/i18n/*` dashboard empty-state strings

**Interfaces:**
- Consumes: `getDashboardOverview()` now returns empty arrays/zeros (Task 1).

- [ ] **Step 1:** In `alert-trend.tsx`, delete `PRIOR_DAYS` and `WEIGHTS` constants and the code blending them. The chart must derive solely from the (now-empty) real data. When there are no data points, render `<EmptyState icon={TrendingUp} message={t("dashboard.trend.empty")} />` instead of the chart.
- [ ] **Step 2:** In `status-strip.tsx`, delete `seededDelta` and any per-card delta UI it fed. Cards render their real value only (0). No fabricated deltas.
- [ ] **Step 3:** For each dashboard panel that maps over a collection (`needs-attention`, `recent-activity`, region coverage, status donut, map pins), guard the empty case: if the array is empty, render `EmptyState` (tables/lists) or a neutral "no data" placeholder (donut/map). The map with zero stations renders the basemap with no pins and an overlaid `EmptyState`-style note.
- [ ] **Step 4:** Add the referenced i18n keys (EN + AR) for every new `t("dashboard.*.empty")` string.
- [ ] **Step 5: Verify**

Run: `cd web && npm run typecheck`
Expected: no errors. Then load `/` (or `/dashboard`) in the browser (Task 9 harness) — every panel shows an empty state; no console error; donut/trend do not throw the Recharts zero-size error.

- [ ] **Step 6: Commit**

```bash
git add web/features/dashboard web/lib/i18n
git commit -m "feat(web): dashboard empty states; drop illustrative chart seed data"
```

---

### Task 3: Active Alerts — remove SEED, empty state

**Files:**
- Modify: `web/features/alert-management/components/alert-management-view.tsx` (remove `SEED`, lines ~90–138; `useState(SEED)` → `useState<ManagedAlert[]>([])`, line ~151)

- [ ] **Step 1:** Delete the `SEED: ManagedAlert[]` constant. Change initial state to `React.useState<ManagedAlert[]>([])`.
- [ ] **Step 2:** Add an `EmptyState` (icon e.g. `BellOff`/`ShieldCheck`, message `t("activeAlerts.empty")`) rendered when the list is empty, replacing the alert grid.
- [ ] **Step 3:** Add i18n keys (EN + AR).
- [ ] **Step 4: Verify** `npm run typecheck` clean; `/active-alerts` shows the empty state.
- [ ] **Step 5: Commit** `git add web/features/alert-management web/lib/i18n && git commit -m "feat(web): active-alerts empty state; drop SEED alerts"`

---

### Task 4: Alert Templates — remove SEED + default steps, empty state

**Files:**
- Modify: `web/features/alert-templates/components/alert-templates-view.tsx` (remove `SEED`, lines ~72–112; `useState(SEED)` → `[]`, line ~144)
- Modify: `web/components/providers/admin-config-provider.tsx` (remove `DEFAULT_TEMPLATE_STEPS`, lines ~19–59; default to `{}`/empty)

- [ ] **Step 1:** Delete `SEED: AlertTemplate[]`; initialize templates state to `[]`. When there are no templates, render `EmptyState` (message `t("templates.empty")`) in place of the three-column editor, and render nothing/disabled in the template list rail.
- [ ] **Step 2:** In `admin-config-provider.tsx`, delete `DEFAULT_TEMPLATE_STEPS`; the config store initializes template steps to an empty map. Keep the provider + localStorage mechanism intact (structure, not data).
- [ ] **Step 3:** Add i18n keys (EN + AR).
- [ ] **Step 4: Verify** `npm run typecheck` clean; `/alert-templates` shows the empty state; no crash selecting/deselecting.
- [ ] **Step 5: Commit** `git add web/features/alert-templates web/components/providers/admin-config-provider.tsx web/lib/i18n && git commit -m "feat(web): alert-templates empty state; drop SEED templates + default steps"`

---

### Task 5: Notification bell — remove SEED, empty state

**Files:**
- Modify: `web/components/layout/notifications-menu.tsx` (remove `SEED`, lines ~44–50; `useState(SEED)` → `[]`, line ~56)

- [ ] **Step 1:** Delete `SEED: Notif[]`; initialize to `[]`. The unread badge count derives from the (empty) list → hidden/0.
- [ ] **Step 2:** Render an empty state inside the menu ("You're all caught up", `t("notifications.empty")`).
- [ ] **Step 3:** Add i18n keys (EN + AR).
- [ ] **Step 4: Verify** `npm run typecheck` clean; open the bell → empty state; no unread badge.
- [ ] **Step 5: Commit** `git add web/components/layout/notifications-menu.tsx web/lib/i18n && git commit -m "feat(web): notifications empty state; drop SEED notifications"`

---

### Task 6: localStorage default seeds — blank the config stores

**Files:**
- Modify: `web/features/settings/preferences.ts` (`DEFAULT_PREFERENCES` lines ~40–53 → neutral empty/false defaults; `REGION_OPTIONS` lines ~33–38 → `[]`)
- Modify: `web/features/users/role-permissions-state.ts` (`DEFAULT_PERMISSIONS` lines ~34–45 → empty matrix)
- Modify: `web/components/providers/admin-config-provider.tsx` (`DEFAULT_CITY_CONTACTS` lines ~86–92 → `{}`)
- Modify: `web/lib/emergency-contacts.ts` (`DEFAULT_EMERGENCY_CONTACTS` lines ~13–16 → empty strings)

**Interfaces:**
- Produces: `DEFAULT_EMERGENCY_CONTACTS = { emergencyServices: "", civilDefense: "" }`; `REGION_OPTIONS: string[] = []`; `DEFAULT_PERMISSIONS` = every role → no granted permissions; `DEFAULT_CITY_CONTACTS = {}`.

- [ ] **Step 1:** Set `DEFAULT_EMERGENCY_CONTACTS` to empty strings. Consumers already fall back to this; verify preview/citizen card shows blank, not `191`/`199`.
- [ ] **Step 2:** Set `REGION_OPTIONS = []` and `DEFAULT_PREFERENCES` fields to neutral empties (empty strings, `false` toggles, `""` selects). Region select renders empty.
- [ ] **Step 3:** Set `DEFAULT_PERMISSIONS` to an empty/all-false RBAC matrix (keep the role keys as structural enum, values ungranted).
- [ ] **Step 4:** Set `DEFAULT_CITY_CONTACTS = {}`.
- [ ] **Step 5:** For each screen (Settings, Users→Roles, station form contacts) add/confirm an empty state or blank fields; nothing should show fabricated numbers or regions.
- [ ] **Step 6: Verify** `npm run typecheck` clean; `/settings`, `/users` render with blank defaults. **Clear localStorage first** (the old seeds may be cached): in the browser run `localStorage.clear()` then reload.
- [ ] **Step 7: Commit** `git add web/features/settings/preferences.ts web/features/users/role-permissions-state.ts web/components/providers/admin-config-provider.tsx web/lib/emergency-contacts.ts && git commit -m "feat(web): blank all localStorage config default seeds"`

---

### Task 7: Station detail/weather/telemetry generators — delete, wire empty states

**Files:**
- Delete generator content in: `web/components/station-detail/station-weather.ts` (`STATION_WEATHER`, `FLASH_FLOOD_ACTIONS`, `buildForecast`)
- Modify: `web/components/station-detail/station-detail.ts` (`FIXTURE_ALIAS`, `synthWeather`, `alertFor` → removed; `detailFromMapStation` returns a minimal detail with empty weather/alerts)
- Modify: `web/features/stations/components/station-form-shared.ts` (`KNOWN_STATIONS`, `estimateElevation`, `buildPreviewDetail` → removed/neutralized)
- Modify: `web/features/stations/components/station-live-view.tsx` (`seedFrom` telemetry PRNG lines ~33–97 → removed; render empty state)
- Modify: `web/components/station-detail/station-summary-card.tsx` and any other consumer to render empty states.

**Interfaces:**
- Consumes: nothing new. Produces: `detailFromMapStation` / station detail with empty weather (`null`/empty) and empty alert list, so cards render empty states.

- [ ] **Step 1:** Remove `synthWeather`, `alertFor`, `FIXTURE_ALIAS`, `STATION_WEATHER`, `FLASH_FLOOD_ACTIONS`, `buildForecast`. Where the detail type requires weather/forecast, make those fields optional/empty and have consumers render `EmptyState` (message `t("station.noData")`).
- [ ] **Step 2:** In `station-live-view.tsx`, delete `seedFrom` and the synthetic 24h telemetry; render an `EmptyState` ("No telemetry", `t("station.noTelemetry")`).
- [ ] **Step 3:** In `station-form-shared.ts`, remove `KNOWN_STATIONS` (proximity list), `estimateElevation`, and `buildPreviewDetail`. The form's public preview shows an empty/placeholder detail (no fabricated readings). Keep the `LIBYA` bounding box only if it's used for map centering (geographic constant, not mock data) — confirm usage; if only used by the deleted proximity check, remove it too.
- [ ] **Step 4:** Add i18n keys (EN + AR).
- [ ] **Step 5: Verify** `npm run typecheck` clean. Because the station list is now empty there may be no UI route into station detail; verify via typecheck + open the "add station" form (`/stations` → add) to confirm the preview shows no fabricated readings and does not crash.
- [ ] **Step 6: Commit** `git add web/components/station-detail web/features/stations web/lib/i18n && git commit -m "feat(web): delete synthetic station weather/telemetry/preview generators; empty states"`

---

### Task 8: Demo identity — blank the signed-in user + role default

**Files:**
- Modify: `web/components/layout/user-card.tsx` and `web/components/layout/sidebar-content.tsx:38` (`<UserCard name="Rasheed" />`)
- Modify: `web/components/providers/role-provider.tsx` (demo default role / `mozn-demo-role`)

- [ ] **Step 1:** Remove the hardcoded `name="Rasheed"` (and any hardcoded role/initials). `UserCard` renders an unauthenticated/empty identity: blank name, generic avatar, or a "Not signed in" label (`t("account.signedOut")`). Do not invent a name.
- [ ] **Step 2:** In `role-provider.tsx`, keep the role-switch mechanism (structure) but do not default to a fabricated identity; default to an empty/unset role or the lowest-privilege role name as a pure enum (no person attached). Keep behavior non-crashing where role gates UI.
- [ ] **Step 3:** Add i18n keys (EN + AR).
- [ ] **Step 4: Verify** `npm run typecheck` clean; sidebar shows the signed-out/empty identity, not "Rasheed".
- [ ] **Step 5: Commit** `git add web/components/layout web/components/providers/role-provider.tsx web/lib/i18n && git commit -m "feat(web): blank demo signed-in identity"`

---

### Task 9: Full browser verification pass

**Files:** none (verification only). Uses `playwright-cli` (installed at `C:/Users/Malik/AppData/Roaming/npm/playwright-cli.cmd`) against the running dev server.

- [ ] **Step 1:** Ensure backend (`:8080`) and frontend dev server are running. In the browser, run `localStorage.clear()` then reload to drop any cached seed stores.
- [ ] **Step 2:** Drive every route and screenshot: `/`, `/stations`, `/alert-inbox`, `/active-alerts`, `/alert-templates`, `/alerts` (thresholds), `/users`, `/history`, `/activity-log` (or history tabs), `/settings`. Open the notification bell and the account menu.
- [ ] **Step 3:** For each, confirm: an empty state renders, no fabricated value is visible, no console error, no Recharts zero-size crash, layout intact in light + dark + RTL (Arabic locale).
- [ ] **Step 4:** Record any surface still showing data or crashing → fix in the owning task, re-verify.

---

### Task 10: "No leftovers" grep sweep + final checks

**Files:** none (acceptance gate).

- [ ] **Step 1: Grep sweep** — must return ZERO matches in code (exclude `node_modules`, `.next`, `*.golden.json` are allowed to contain empty structures only, `*.geo.json`, `web/lib/i18n` placeholder examples, and `docs/`):

Run (from repo root):
```bash
grep -rniE "Rasheed|Yusuf|Omar K|Fatima|Nadia|Khaled|Ahmed Sweid|Derna|Benghazi|Misrata|Zliten|Ghadames|Tobruk|Sabha|Ghat|Nalut|Al-Khums|Al-Bayda|Murzuq|Ubari|Roaya|mozn\.ly|gov\.ly|ministry\.ly|\bSEED\b|synthWeather|buildPreviewDetail|PRIOR_DAYS|thresholdMetric|DEFAULT_TEMPLATE_STEPS|DEFAULT_CITY_CONTACTS" server web \
  --include=*.go --include=*.ts --include=*.tsx | grep -vE "node_modules|\.next|/i18n/"
```
Expected: no output. Investigate and remove any hit.

- [ ] **Step 2:** Confirm golden files carry only empty structures — grep the same tokens in `server/internal/handler/testdata/*.golden.json`; expected: no output.
- [ ] **Step 3:** Final builds: `cd server && go build ./... && go test ./... && go vet ./...`; `cd web && npm run typecheck`. All clean.
- [ ] **Step 4:** Update the stale memory note `dashboard-map-data.md` (the map is no longer real 43-station data; it's now empty).
- [ ] **Step 5: Commit** any final fixes.

---

## Self-Review

**Spec coverage:** Backend seed (Task 1) ✓; SEED arrays (Tasks 3,4,5) ✓; localStorage seeds (Task 6) ✓; synthetic generators (Task 7) ✓; illustrative charts (Task 2) ✓; demo identity (Task 8) ✓; empty-state audit across 12 surfaces (Tasks 2–8 add, Task 9 verifies) ✓; verification/no-leftovers (Tasks 9,10) ✓; non-goals respected (no endpoint/type/route changes; i18n only added; GeoJSON untouched) ✓; map/overview divergence noted (Task 2 Step 3, Task 10 Step 4) ✓.

**Placeholder scan:** Backend code is complete and exact. Frontend empty-state JSX references the concrete `EmptyState` component + `t()` keys rather than inlining final markup per file — this is deliberate: exact JSX depends on each file's current structure, which the executing task reads. Icon/message choices are specified per task; the executor picks the closest existing lucide icon already imported in that file where possible.

**Type consistency:** Empty slices use `[]model.X{}` (non-nil) everywhere per Global Constraints; frontend state uses the file's existing element type (`ManagedAlert[]`, `AlertTemplate[]`, `Notif[]`) with `[]`. `EmptyState` prop shape (`icon`, `title?`, `message`) matches `components/common/empty-state.tsx`.
