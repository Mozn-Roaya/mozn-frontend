# Phase 0 — Audit & Figma Token Mapping (READ-ONLY)

_MOZN Early-Warning Dashboard · branch `feat/dark-mode-and-redesign` · no files under audit were modified._

## 0. Executive summary

This is a **mature, already-refactored codebase**, not a greenfield rescue. Firsthand tracing + four
parallel deep-trace passes (design-system/Tailwind, React/TS, Go/security, dead-code/i18n/deps) agree:

- **Go server** already has http.Server timeouts, graceful shutdown, panic-recovery + logging + CORS
  middleware, `log/slog`, interface-bounded constructor DI, `context.Context` propagation, `%w` error
  wrapping, and **golden characterization tests**. Most "invisible hardening" items are already done.
- **Web** already: zero `any`, zero `@ts-ignore`, zero `console.*`, zero commented-out code blocks;
  `cn()` used consistently; logical RTL utilities (`ps/pe/ms/me/start/end`) used almost everywhere;
  a token-driven Tailwind v4 `@theme` layer with documented RTL font-metric handling.

So Phase 0 reads as **targeted hardening of a good codebase**. The real debt clusters in five places:
1. **Token *naming* diverges from Figma's token *structure*** (values mostly match) — the core design-system item.
2. **Dead code**: 2 built-but-unwired feature components (+ their types + i18n keys), 1 dead UI file, several dead sub-exports, 1 unused dep, 1 phantom dep.
3. **Copy-pasted table state** (row-selection + filter/sort/paginate) across 6 views.
4. A few **magic values / raw colors** that bypass tokens (worst offender: `station-summary-card.tsx`).
5. **Three competing focus-ring idioms** across form controls.

**No-tests risk:** the **web app has no tests at all**; the Go side has golden tests. Visual/behavior
preservation on the web rests entirely on discipline + the verification gate. Recommendation carried to
Phase 1: keep Go golden tests as the backstop for any server change; for web, lean on build/typecheck/lint
+ explicit LTR/RTL/light/dark manual checks, and flag every change not verifiable with certainty.

## 1. Verification baseline (run read-only during audit)

| Command (in `server/`) | Result |
|---|---|
| `go build ./...` | **PASS** (exit 0) |
| `go vet ./...` | **PASS** (exit 0) |
| `go test ./...` | **PASS** (handler golden tests ok; other pkgs have no tests) |
| `gofmt -l .` | Lists all 20 files — **CRLF-only** (Windows line endings), zero structural reformatting. Low sev; would trip a `gofmt -l` gate on Windows. |

Web build/typecheck/lint not run in Phase 0 (read-only); it becomes the per-batch gate in Phase 2.
Note: `tsc --noUnusedLocals` (run read-only) surfaces stale imports not caught by the normal build (tsconfig omits that flag).

---

## 2. Design system / Tailwind

### High
- **Three competing focus-ring idioms.** `focus-visible:ring-2 ring-ring ring-offset-1` (button.tsx:8, badge.tsx:8, switch.tsx:16, tabs.tsx:47) vs `focus-visible:ring-[3px] ring-ring/30` (input.tsx:18, textarea.tsx:16, topbar.tsx:127) vs `focus:ring-[3px] ring-ring/30` — note `focus:` not `focus-visible:` — (select.tsx:66) vs `ring-ring/50` (calendar.tsx:77,211, toggle.tsx:10). → Define one focus-ring recipe (token for width + opacity); fix select.tsx:66 `focus:`→`focus-visible:`.
- `station-detail/station-summary-card.tsx:35-37` — `TEMP_GRADIENT`/`RANGE_GRADIENT` hardcoded hex gradients applied via `style={{backgroundImage}}`. → Move to token-derived CSS custom props in globals.css.
- `station-summary-card.tsx:81` — `text-[62px] leading-[64px]` display figure, off the type scale. → Add a display tier token (also a Figma mismatch — see §7: Figma display-xl is 62/**68**).
- `station-summary-card.tsx:98,189,190` — raw `border-black/10`, `bg-white`, `text-white` (break in dark mode). → `border-border`, `bg-card`/`bg-background`, `text-primary-foreground`.

### Med
- Exact-match arbitrary radii (safe token swaps, zero visual change): `rounded-[4px]`→`rounded-md` (checkbox.tsx:17, faceted-filter.tsx:78); `rounded-[2px]`→`rounded-sm` (chart.tsx:229,320).
- `tabs.tsx:69` `h-[18px] min-w-[18px] text-[11px]` and `nav-list.tsx:48` `text-[11px]` — magic px; **`text-[11px]` is NOT caught by the RTL `text-[10px]` override**, so it stays 11px in Arabic (intentional? verify).
- `calendar.tsx:94,103` `text-[0.7rem]`/`text-[0.8rem]` → `text-xs`.
- `topbar.tsx:72` `max-w-[1600px]` page container — promote to a layout token/const.
- **Input styling re-implemented inline** — topbar.tsx:127 search trigger re-spells the Input border/ring classes (comment admits "mirrors `<Input>`"). → Extract `inputFieldClass` or render the Input.
- **Checkbox re-implemented inline** — faceted-filter.tsx:78-85 hand-rolls a checkbox instead of the `Checkbox` primitive.
- **Icon-chip cluster duplicated** (`grid size-8/9 place-items-center rounded-lg` + tint) across stat-card.tsx:69, toaster.tsx:91, forecast-thresholds.tsx:56, settings-view.tsx:552, section-card.tsx:45, needs-attention.tsx:32, alert-templates-view.tsx:628. → Extract `IconChip`.
- **Count/pill badge duplicated** 4 ways: nav-list.tsx:48, tabs.tsx:69 (TabsCount), notifications-menu.tsx:75, command-palette.tsx:62 (Kbd). → Unify.
- **Conflicting table-row hover opacity**: table.tsx:48 `TableRow` `hover:bg-muted/50` vs exported `tableBodyRowClass` (table.tsx:10) `hover:bg-muted/40`. → Pick one.
- Ad-hoc tone `Record` maps that parallel CVA and should fold into a variant system: stat-card.tsx:16-24, status-badges.tsx (several), toaster.tsx:42-45, notifications-menu.tsx:37-42.
- `calendar.tsx:88` `pr-1 pl-2` → `pe-1 ps-2`; `calendar.tsx:107-118,211` `rounded-l/r-md` on range days → `rounded-s/e-md` (or confirm intentional — DatePicker is single-mode, range unused).

### Low
- `badge.tsx:40` passes `className` outside cva; `button.tsx:47` passes inside — pick one convention.
- Status-dot spans (`size-1.5/2 rounded-full`) repeated (status-badges, command-palette:273, faceted-filter:89, notifications-menu:141) — optional `StatusDot`.
- Inconsistent content-menu min-widths: dropdown-menu.tsx:37 `min-w-[10rem]` vs chart.tsx:200 `min-w-[8rem]`.

### Dead / orphaned styles (confirmed zero consumers)
- `globals.css:14` `--radius: 0.625rem` — never referenced (the radius scale is hardcoded, not `calc()`-derived from it).
- `globals.css:75,147,216` `--chart-3` / `.dark --chart-3` / `--color-chart-3` — no consumer (charts use 1/2/4/track).
- `globals.css:229` `--radius-3xl: 1.5rem` — no `rounded-3xl` consumer.
- All `!important` uses (globals.css:300,525-526,637,644) are justified (RTL tracking kill, Leaflet override, reduced-motion) — keep.

---

## 3. React / TypeScript

### High
- **Row-selection Set logic copy-pasted verbatim** (`allVisibleSelected`, `someSelected`, `toggleAll`, `toggleOne`) across 6 tables: stations-table.tsx:202-220, alert-inbox-view.tsx:102-120, alert-history-view.tsx:141-158, activity-log-view.tsx:166-183, alert-management-view.tsx:205-208, users-table.tsx:317-323. → Extract `useRowSelection(rows)` (mirrors existing `usePagination`).

### Med
- **Recharts imported statically** (Leaflet is correctly `next/dynamic`): alert-trend.tsx:4, station-status-donut.tsx:4, station-live-view.tsx:4-12 — ships on the main dashboard bundle. → `dynamic(..., { ssr:false })`.
- **Index keys on reorderable step rows** with controlled Inputs: station-form.tsx:406,458, alert-templates-view.tsx:535 — reorder can misassign input state/focus. → Stable per-step id.
- `lib/i18n.ts:67` `return value as unknown as string` — `translateData` typed `=> string` but returns null/undefined. → Widen signature or return `value ?? ""`.
- `lib/api.ts:50` `(await res.json()) as T` — every response blind-cast, no runtime validation. `lib/api.ts:47` discards the upstream error body. → Type-guard/validate; include upstream cause. (Adding zod = new dep → gated.)
- `metric-thresholds-editor.tsx:78` `useState<ThresholdMetric>(metrics[0]?.metric)` — `undefined` assigned to non-optional; empty `metrics` throws at 81-82. → Guard empty.
- **Filter→sort→paginate→reset orchestration** repeated across the same 6 views. → `useDataTable` hook (Med, larger).
- Duplicated maps/util: `STATUS_DOT` (stations-table.tsx:106 == command-palette.tsx:18); metric→icon (metric-thresholds-editor:28, forecast-thresholds:20, alert-management-view:57); CSV column setup (stations-table:77, page-header:62, alert-history-view:201, activity-log-view:198); localized date formatting done 2 different ways (recent-activity.tsx:38 regex vs activity-log-view.tsx:73 Intl); step-list editor near-verbatim in station-form vs alert-templates-view; `hash()` re-declared 4× (station-form:76, station-form-shared:95, station-detail:62, status-strip:26 as `seededDelta`).

### Low
- Guarded non-null `!` assertions (fragile): stat-card.tsx:88, status-strip.tsx:65, command-palette.tsx:112, station-location-picker.tsx:111/130/167/168, activity-log-view.tsx:156 (vs alert-history-view.tsx:133 which uses `?? 0` — inconsistent), station-form-shared.ts:146.
- `users-table.tsx:163` `React.MutableRefObject` deprecated in React 19 → `RefObject`.
- Unvalidated Radix `onValueChange` string casts (many; listed in trace) — common but each trusts the string.
- `stations-table.tsx:218` ternary used only for side effects → `if/else`.
- `sidebar-content.tsx:38` hardcoded demo name `"Rasheed"`.
- Effect-dep inconsistency for page-reset pattern (stations-table:200, users-table:357 omit `setPageIndex`; 4 other views include it) — harmless (stable) but lint-inconsistent.

### i18n structure (sound)
Flat namespaced dict merged from `lib/i18n/*`; `translate()` interpolates `{vars}` and falls back to the key; `translateData()` keyed on raw EN value, falls back unchanged. Server reads `mozn-locale` cookie (`i18n-server.ts`); client via `useT`/`useTD` + `DirectionProvider`. Watch item (Med, needs-verification): hardcoded EN fixture strings that only reach AR if `lib/i18n/data.ts` covers them — alert-management-view.tsx:91-139 (SEED), station-weather.ts:46-51, station-detail.ts:73-154, notifications-menu.tsx:44-50 ("1 min ago").

### API path
`lib/api.ts` (`server-only`) → single generic `apiFetch<T>` → 8 typed wrappers; client palette can't import `server-only`, so `app/api/stations/route.ts` (`force-dynamic`) proxies `getStations()`. Sound pattern; only gap is response validation (above).

---

## 4. Go backend

### Med
- **Consumer-interface inconsistency.** `OverviewReader` is defined in the **repository (producer)** package (dashboard_repo.go:13) and `dashboard_service.go:10` imports `repository`. `admin_service.go:11` does it correctly — defines `AdminRepository` locally, no repository import. → Define `overviewReader` in `service`, drop the repository import.

### Low
- `respond.go:9-14` — `writeJSON` calls `WriteHeader(status)` before `Encode`; on encode failure the `http.Error` fallback issues a second `WriteHeader` (superfluous) with a truncated body already on the wire. → Encode to a `bytes.Buffer` first, or drop the unreachable fallback.
- `middleware.go:47-52` — every request incl. `/healthz` logged at Info (probe noise). → Skip/downgrade healthz.
- `middleware.go:22-24` — `contains(allowed, "*")` evaluated twice. → Compute once.
- Missing doc comments on exported service methods (admin_service.go:31-57) and repo methods (dashboard_repo.go:28, seed_admin.go:*) — `revive`/`golangci` (`.golangci.yml`, 60+ linters, not verified as running in CI) would flag.
- golden_test.go tests missing `t.Parallel()` (`paralleltest` enabled).
- CRLF line endings trip `gofmt -l` on Windows (see §1).
- Repo `ctx` accepted but discarded (`_ context.Context`) — fine for in-memory; add `ctx.Err()` when a real datastore lands.

**Positives (do not "re-fix"):** no package-level mutable state; Go 1.22 method-aware mux (router.go:23-27, admin_handler.go:36-42); timeouts + graceful shutdown (main.go:39-68); panic recovery; errors wrapped with `%w`; internal errors not leaked (generic messages, real cause only logged).

---

## 5. Security & API surface

**Every endpoint is fully public — there is NO authentication anywhere** (no auth middleware in router.go/middleware.go). All endpoints are `GET` with no request body/query inputs.

| Method + Path | Handler | Leaks |
|---|---|---|
| `GET /healthz` | router.go:23 | nothing |
| `GET /api/v1/dashboard/overview` | dashboard_handler.go:30 | station WGS84 coords, activity feed w/ actor names |
| `GET /api/v1/stations` | admin_handler.go:36 | station inventory, AR names, signal/battery |
| `GET /api/v1/alert-inbox` | admin_handler.go:37 | alert details + recommended actions |
| `GET /api/v1/thresholds` | admin_handler.go:38 | threshold config + change history w/ user names |
| `GET /api/v1/users` | admin_handler.go:39 | **full user directory: names, emails (`*.gov.ly`, `*.ministry.ly`), roles, regions** |
| `GET /api/v1/history/alerts` | admin_handler.go:40 | historical alert log |
| `GET /api/v1/history/activity` | admin_handler.go:41 | audit log w/ actor names + partially-masked IPs |
| `GET /api/v1/settings` | admin_handler.go:42 | notification/validation config |

- **High (GATED — behavior change):** admin endpoints have zero auth; `/api/v1/users` exposes a staff/gov email directory. Data is currently seed fixtures, but the surface is open. Adding auth introduces 401s → needs approval + golden-file update. **Out of scope for a pure refactor; flagged for your decision.**
- **Low (GATED):** no security headers (`X-Content-Type-Options: nosniff`, etc.); CORS supports `"*"` (safe today — no `Allow-Credentials`; would be a vuln if credentials are ever added). No `Access-Control-Max-Age`.
- **Invisible-hardening candidates (allowed, still gated for confirmation):** `MaxHeaderBytes` not set (defaults 1MB; all GET/no body so low value).

---

## 6. Dead code

### CONFIRMED UNUSED (self-verified by grep — safe to remove after i18n-key cross-check)
- **Files:** `features/thresholds/components/forecast-thresholds.tsx` (`ForecastThresholds`), `features/thresholds/components/compound-rules.tsx` (`CompoundRules`), `components/ui/time-select.tsx` (`TimeSelect`) — each matches only its own definition; ThresholdsView renders only MetricThresholdsEditor + ChangeHistory.
- **Types tied to the two dead thresholds files:** `types/thresholds.ts` `CompoundRule`, `CompoundCondition`, `ForecastThreshold`, `RuleTier`.
- **Dead named sub-exports:** `status-badges.tsx::InboxSeverityBadge`; `card.tsx::{CardHeader,CardTitle,CardDescription,CardContent,CardFooter}` (only `Card` is consumed, by 22 files); `chart.tsx::{ChartLegend,ChartLegendContent}`; `dialog.tsx::DialogTrigger`; `popover.tsx::{PopoverAnchor,PopoverHeader,PopoverTitle,PopoverDescription}`; `empty.tsx::EmptyContent`; `select.tsx::SelectGroup`; `table.tsx::TableCaption`; `tabs.tsx::TabsCount`; `inbox-meta.tsx::{LANE_ORDER,TREND,itemTrend,metricIcon,breach,parseSlaSeconds,formatClock}`; `station-form-shared.ts::MIN_KM`; `types/users.ts::UserStatus`.
- **Unused import/local (from `tsc --noUnusedLocals`):** stale `import * as React` in density-toggle.tsx:3, faceted-filter.tsx:3, sortable-head.tsx:3, table-pagination.tsx:3, language-toggle.tsx:3, time-select.tsx:3; unused `Button` in alert-inbox-view.tsx:7; unused `X` in stations-table.tsx:13.
- **Dependency:** `date-fns` — CONFIRMED unused (only in package.json). **Phantom dep:** `@radix-ui/react-direction` — imported in locale-provider.tsx:5 but not declared (resolves via hoist) → add as explicit dep.

### NEEDS VERIFICATION (conservative — confirm before touching)
- **~145 i18n keys** with no literal reference and no dynamic-prefix match, clustering with removed/unwired UI: `dashboard.byRegion.*`, `dashboard.map.*`, `inbox.{kpi,sla,trend}.*`, `history.{range,stat,opt}.*`, `settings.{volume,sound,delivery}.*`, `thresholds.{tab,section,compound,forecast,mode,levels,editor}.*` (correlate with the dead thresholds files), `templates.*`, `stations.*`, `alertmgmt.*`, plus scattered `common.*`/`account.*`. i18n keys are trivially referenceable dynamically and carry EN+AR pairs → human confirm the feature is gone.
- **Over-exported (used only in own file — drop `export`, not the code):** dialog `DialogOverlay/DialogPortal`, scroll-area `ScrollBar`, calendar `CalendarDayButton`, chart `ChartStyle`, `badge.tsx::badgeVariants`, leaflet-config `STATION_PIN_COLOR/PinSize`, several feature type aliases (list in trace).
- **Possibly-unused contract fields:** `types/alert-inbox.ts::InboxItem.meter` + `AlertInboxPage.avgAck`; `types/dashboard.ts::RegionStat` + `DashboardOverview.regions`. May be intended API surface — do NOT delete server-side without contract review.
- `add-station-dialog.tsx` — `regions` prop accepted as `_regions` and unused (caller still computes/passes it); name misleading (renders a `<Link>`, not a dialog).

---

## 7. Figma → code token mapping

Pulled from Figma variables bound on the Basic Components library + Warning Alert + Icon Button + Cards nodes
(`get_variable_defs`). **Match** = same rendered value, adopt Figma name with zero visual change.
**Mismatch** = frozen value differs → flagged, NOT to be silently changed.

### Colors — MATCH (adopt Figma naming)
| Figma token | Figma value | Code token | Code value | Status |
|---|---|---|---|---|
| `color/bg/primary` | `#ffffff` | `--card` / `--popover` | `#ffffff` | ✅ match |
| `color/bg/secondary` | `#f7f7f8` | `--background` / `--secondary` | `#f7f7f8` | ✅ match |
| `color/bg/tertiary` | `#ededf0` | `--muted` | `#ededf0` | ✅ match |
| `color/text/primary` | `#1f1e24` | `--foreground` | `#1f1e24` | ✅ match |
| `color/text/secondary` | `#54545c` | `--text-secondary` | `#54545c` | ✅ match |
| `color/text/muted` | `#6e6e78` | `--muted-foreground` | `#6e6e78` | ✅ match (code keeps Neutral/500 for AA; Figma text/muted is Neutral/400 #8c8c96 — see mismatch row) |
| `color/text/inverse` | `#ffffff` | `--primary-foreground` | `#ffffff` | ✅ match |
| `color/border/default` | `#d4d4d9` | `--border` / `--input` | `#d4d4d9` | ✅ match |
| `color/border/subtle` | `#ededf0` | `--border-subtle` | `#ededf0` | ✅ match |
| `color/status/normal/500` | `#10b981` | `--status-normal` | `#10b981` | ✅ match |
| `color/status/warning/500` | `#ef4444` | `--status-warning` | `#ef4444` | ✅ match |
| `color/status/offline/400` | `#9ca3af` | `--status-offline` | `#9ca3af` | ✅ match |
| `color/status/warning/100` (= `bg/warning/subtle`) | `#fee2e2` | (derived `bg-status-warning/10`) | computed | ⚠️ structural: code derives via `/10` alpha instead of a solid `--bg-warning-subtle` token |
| `color/gray/900` | `#121115` | `.dark --background` | `#121115` | ✅ match (primitive) |
| `color/gray/0` | `#ffffff` | white primitive | `#ffffff` | ✅ match |

### Colors — MISMATCH / NEEDS-VERIFICATION (flagged, do NOT change silently)
| Figma token | Figma value | Code token | Code value | Status |
|---|---|---|---|---|
| `color/text/muted` | `#8c8c96` (Neutral/400) | `--muted-foreground` | `#6e6e78` (Neutral/500) | ⚠️ **intentional deviation** — code comment: #8c8c96 fails AA on white. Keep code value; adopt name. |
| `shadow/card` | `0 1px 2px #0000000D`, `0 2px 6px -1px #0000000A` (2-layer) | `--shadow-card` | `0 2px 8px rgb(0 0 0 / .04)` (1-layer) | ⚠️ **MISMATCH** — different geometry & layering. Frozen → your call. |
| `display/xl` | `62 / 68` | `station-summary-card.tsx` inline | `text-[62px] leading-[64px]` (62/**64**) | ⚠️ **MISMATCH** — line-height 64 vs Figma 68. |
| brand / primary | not surfaced in pulled nodes | `--primary` `#032460`, `--brand-foreground` `#032460` | — | ❓ needs-verification against Figma brand collection |
| `color/status/advisory` | not surfaced | `--status-advisory` `#f59e0b` | — | ❓ needs-verification |
| `color/border/strong` | not surfaced (code cites Neutral/300) | `--border-strong` `#b0b0b8` | — | ❓ needs-verification |

### Typography — MATCH (adopt Figma scale naming)
Figma family = **Poppins** (Latin); code uses **Almarai** for both EN+AR — a **frozen, intentional
substitution** (Almarai ships 300/400/700/800, so `medium`→400 / `semibold`→700 approximate Figma 500/600).

| Figma type token | size / line-height | Code utility | Code `--text-*` | Status |
|---|---|---|---|---|
| `Body/xs` | 12 / 18 | `text-xs` | 0.75rem / 1.125rem | ✅ match |
| `Body/sm` | 14 / 21 | `text-sm` | 0.875rem / 1.3125rem | ✅ match |
| `Body/md` | 16 / 24 | `text-base` | 1rem / 1.5rem | ✅ match |
| `Heading/sm` | 18 / 27 | `text-lg` | 1.125rem / 1.6875rem | ✅ match |
| `Heading/md` (= `Body/xl`) | 20 / 30 | `text-xl` | 1.25rem / 1.875rem | ✅ match |
| `Heading/xl` | 28 / 36 | `text-2xl` | 1.75rem / 2.25rem | ✅ match |
| `Body/xxs` | 10 / 16 | `text-[10px]` (+ RTL lift) | — | ⚠️ not a named tier; handled via arbitrary + RTL override |
| `Heading/lg` | 24 / 32 | — | — | ❓ no 24px tier in code (may be unused) |
| `Display/xl` | 62 / 68 | inline `text-[62px]` | 62 / **64** | ⚠️ mismatch (above); no display token |

### Radius / spacing / shadow structure
- **Radius:** code scale `sm 2 · md 4 · lg 8 · xl 12 · 2xl 16 · 3xl 24` (px), cited as Figma "Space & Numbers".
  Figma radius/spacing **variables were not bound on the nodes pulled** → ❓ needs-verification against the
  Figma primitives collection before adopting exact names/values. `--radius` base var + `--radius-3xl` are dead (§2).
- **Naming structure divergence (the core item):** code uses shadcn semantic names (`--foreground`,
  `--card`, `--muted-foreground`, `--border`, `--status-normal`); Figma's canonical model is
  `--color-text-{primary,secondary,muted,inverse}`, `--color-bg-{primary,secondary,tertiary}`,
  `--color-border-{default,subtle,strong}`, `--color-status-{normal,warning,offline}-{500,400,100}`,
  and a numbered type scale (`--body-md-*`, `--heading-md-*`). Values mostly match; **names don't**.
  Rebuilding the `@theme` layer to mirror Figma is a rename that ripples through every component → stage carefully.

---

## 8. Open decisions for approval (gate)

1. **Design-system naming rename** — adopt Figma's `--color-*` token structure/aliases (values frozen). Big ripple; want a dedicated, aliased-migration batch (keep old names as `var()` aliases → migrate consumers → drop). **Approve approach?**
2. **`shadow/card` geometry mismatch** — Figma 2-layer vs code 1-layer. Change to match Figma (visible), or keep code + document? (Frozen-value rule → your call.)
3. **`display/xl` line-height** 64 vs Figma 68 (station-summary-card). Align to Figma (visible), or keep?
4. **Auth on API** — real gap but a **behavior change** (adds 401s), out of scope for pure refactor. Track separately, or leave for a feature ticket?
5. **`date-fns` removal + add `@radix-ui/react-direction`** — dep changes need your OK per guardrail #6.
6. **Web characterization safety** — no web tests. Accept build/typecheck/lint + manual LTR/RTL/light/dark gate, or invest in minimal render tests first (would be a new dep → gated)?
7. **i18n key deletion** — ~145 candidates are NEEDS-VERIFICATION; confirm the correlated features (compound/forecast thresholds, region/map/kpi/sla panels) are truly gone before removal.
