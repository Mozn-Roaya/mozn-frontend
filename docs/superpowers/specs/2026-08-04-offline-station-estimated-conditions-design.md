# Estimated Conditions for Offline Stations — Design Spec

**Date:** 2026-08-04
**Goal:** When a public station is offline, stop rendering an empty "المحطة غير متاحة" card. Fill the Overview tab with genuine approximate weather for the station's own coordinates, drawn from an outside source, and say plainly that the station is offline and the numbers are estimates.

## Context

### What the offline panel does today

`app/(app)/stations/[stationId]/page.tsx:37-51` branches on `station.status === "offline"` and renders exactly two things: `<StationOffline>` (a centred grey card with an offline chip, "Station unavailable", a body sentence, and a last-seen timestamp) and `<ForecastList>`. The temperature card and all four `WeatherMetric` tiles are absent, so the panel reads as a dead end even though the station's location has perfectly knowable weather.

### What already works while offline

The 3-day forecast renders for offline stations today, because `getDailyForecast()` hits `/public/forecasts/daily` — model output keyed on `station_id`, not station telemetry. The existing comment at `page.tsx:38` records this: *"Forecast is model-generated (separate endpoint), so show it even when offline."* This spec extends that same principle from the forecast to current conditions.

### Available inputs

- `Station` carries exact `latitude` / `longitude` (`components/api/types.ts:38-56`), so any geo-keyed source can be addressed precisely.
- `/public/stations/nearest` **404s in production** as of this date (probed with `lat/lng`, `lat/lon`, and `latitude/longitude` spellings), so the `listNearestStations()` helper at `components/api/stations.ts:42` is currently dead. Nearest-station math would have to be done from the station list instead.

### Source evaluation

| Source | Verdict |
| --- | --- |
| **Open-Meteo at the station's coordinates** | **Chosen.** Free, keyless, addressed at the station's own lat/lng. A live probe near صرمان returned every field the panel needs: `temperature_2m: 34.2`, `apparent_temperature: 35.4`, `relative_humidity_2m: 38`, `precipitation: 0.00`, `wind_speed_10m: 11.7`, `wind_direction_10m: 72`, `surface_pressure: 1012.2`. Always available; geographically exact. |
| Nearest online Mozn station | Rejected. Real observed data, but Libyan coverage is coastal-clustered, so an inland station's nearest online neighbour can be 100+ km away — not "close to reality" — and the path breaks entirely when no neighbour is online. |
| Backend daily forecast only | Rejected as the primary source. Zero new dependencies, but it is a daily aggregate; presenting `temp_high_c` as a current temperature would be a fabrication. It is still used for today's high/low row (see below). |

Open-Meteo's default units already match the panel exactly — °C, %, hPa, km/h, mm, degrees — so no conversion table is needed. The one exception is precipitation, handled below.

## Decisions

1. **Estimates appear on the Overview tab only.** The map pin stays grey `غير متصل`, the Charts and Data tabs keep their current states, and search is untouched. An estimate never appears anywhere that cannot also carry its disclosure.
2. **Full panel parity, plus a disclosure banner.** The offline branch renders a compact banner (offline chip, last-seen, disclosure sentence, source credit), then the temperature card, then the 2×2 metric grid, then the existing forecast list.
3. **Every estimated surface is individually marked.** The temperature card and each of the four tiles carry an "Estimated" / "تقديري" badge, so a screenshot of a single tile cannot pass as a real station reading.
4. **Today's high/low stays on the Mozn forecast.** The page already fetches `getDailyForecast()`; reusing `forecast[0]` for the high/low row keeps that row consistent with an online station's panel.
5. **A failed estimate falls back to today's card, unchanged.** No blanks, no zeros, no error state.
6. **`StationOffline` is not modified.** It becomes the fallback path.

## Architecture

### New: `components/api/open-meteo.ts`

A sibling of the existing `components/api/*` modules, but with its own `fetch` — `apiFetch` is bound to the Mozn API's base URL and `{data}` envelope, neither of which applies here.

```ts
export type EstimatedConditions = {
  observed_at: string;           // current.time, station-local (timezone=auto)
  temp_c: number;                // the only required field
  feels_like_c: number | null;
  humidity: number | null;
  pressure_hpa: number | null;
  wind_speed_kmh: number | null;
  wind_dir: number | null;       // 0-360, matches Reading.wind_dir
  rain_rate_mm: number | null;   // mm/hr, converted (see below)
  rain_daily_mm: number | null;  // daily.precipitation_sum[0]
};

export async function getEstimatedConditions(
  lat: number,
  lng: number,
): Promise<EstimatedConditions | null>;
```

- **Request:** `GET {OPEN_METEO_BASE}/v1/forecast` with `latitude`, `longitude`, `current=temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation`, `daily=precipitation_sum`, `forecast_days=1`, `timezone=auto`. `OPEN_METEO_BASE` is a module const (`https://api.open-meteo.com`) so it is swappable; no API key and no new env var.
- **Caching:** `next: { revalidate: 900 }` — 15 minutes, matching Open-Meteo's own `interval: 900` update cadence.
- **Timeout:** `AbortSignal.timeout(4000)`, so an unreachable upstream cannot stall the page render.
- **Precipitation:** `current.precipitation` is millimetres accumulated over the preceding interval, *not* a rate, while the panel's tile is labelled `mm/hr`. Convert with `precipitation * 3600 / current.interval` (the probe's `interval: 900` makes this ×4). If `interval` is missing or zero, `rain_rate_mm` is `null` rather than a guess.
- **Failure:** returns `null` on non-2xx, network error, timeout, malformed JSON, or a non-finite `temperature_2m`. Every other field degrades to `null` independently, and its tile renders `—` exactly as the online panel already does for a missing reading.

### New: `features/station/components/station-estimated.tsx`

Props: `{ station, estimate, forecast, lang }`. Composition, top to bottom:

1. **Disclosure banner.** Reuses the offline card's shell tokens (`bg-(--color-bg-secondary)`, `border-(--color-border-subtle)`) in a compact start-aligned form: the grey dot + `t.offline` chip and `t.lastSeen` timestamp on one line, `t.offlineEstimateNote` below it, and `t.estimateSource(time)` as a muted credit line. Open-Meteo's licence requires the visible credit.
2. **`TemperatureCard`** — `current` / `feelsLike` from the estimate, `high` / `low` from `forecast[0]`, `badge={t.estimatedBadge}`.
3. **2×2 `WeatherMetric` grid** — rainfall, wind, humidity, pressure, each `badge={t.estimatedBadge}`. Descriptions reuse `lib/weather-summary` unchanged; `daily.precipitation_sum` is requested specifically so `rainDescription(rate, daily, t)` receives a real daily total from the same source instead of mixing two sources in one sentence.

`ForecastList` stays in the page, below this component, unchanged.

### Changed: two shared components, additively

- `TemperatureCard` gains optional `badge?: string`, rendered beside the existing `t.temperature` label.
- `WeatherMetric` gains optional `badge?: string`, rendered beside its `title`.

Both render as a small muted pill (`text-body-xxs`, `bg-(--color-bg-secondary)`, `text-(--color-text-muted)`, subtle border, `rounded-full`). Both props are optional, so every existing caller is unaffected.

### Changed: `app/(app)/stations/[stationId]/page.tsx`

The offline branch fetches the estimate and the forecast in parallel (`Promise.all`), then:

- estimate present → `<StationEstimated station estimate forecast lang />` + `<ForecastList>`
- estimate `null` → `<StationOffline station lang />` + `<ForecastList>` (today's behaviour, byte for byte)

### Changed: `components/lib/i18n.ts`

Three new keys in both dictionaries:

| Key | English | Arabic |
| --- | --- | --- |
| `estimatedBadge` | `Estimated` | `تقديري` |
| `offlineEstimateNote` | `Readings below are estimated for this station's location from an outside source — not measurements from this station.` | `القراءات أدناه تقديرية لموقع المحطة من مصدر خارجي، وليست قراءات من هذه المحطة.` |
| `estimateSource(time)` | `Source: Open-Meteo · updated {time}` | `المصدر: Open-Meteo · محدّث {time}` |

The banner's chip and timestamp reuse the existing `offline` and `lastSeen` keys.

### Changed: `features/station/index.ts`

Export `StationEstimated` alongside the existing components.

## Data flow

```
station.status === "offline"
        │
        ├── getDailyForecast(id, 3)                 → Mozn API (already present)
        └── getEstimatedConditions(lat, lng)        → Open-Meteo, 15-min revalidate, 4s timeout
                    │
        ┌───────────┴────────────┐
   estimate                    null
        │                        │
  StationEstimated         StationOffline      (both followed by ForecastList)
```

## Error handling

| Failure | Behaviour |
| --- | --- |
| Open-Meteo unreachable / blocked egress / timeout / non-2xx | `getEstimatedConditions` returns `null`; panel renders today's `StationOffline` card |
| Response missing `temperature_2m` | Same as above — temperature is the one field the panel cannot fake |
| Response missing an optional field | That field is `null`; its tile renders `—`, matching the online panel's missing-reading behaviour |
| `current.interval` missing or zero | `rain_rate_mm` is `null` rather than an unconverted figure |
| `daily.precipitation_sum` missing | `rain_daily_mm` is `null`; `rainDescription` receives `null` and degrades on its own terms |

Reachability was verified from the development machine, not from the production host. If production egress to `api.open-meteo.com` is blocked, the feature degrades silently to the current panel — no crash, no empty numbers.

## Testing

- **`components/api/open-meteo.test.ts`** (new, `fetch` mocked): maps a full response; converts `precipitation` to mm/hr using `interval` (900 → ×4); returns `null` on non-2xx, on a network throw, and on a non-finite temperature; returns per-field `null` for partial responses; returns `null` for `rain_rate_mm` when `interval` is absent.
- **`features/station/components/station-estimated.test.tsx`** (new): renders the temperature value; renders the disclosure sentence and Open-Meteo credit; keeps the offline chip and last-seen line; shows a badge on the temperature card and on each of the four tiles; renders `—` for a null metric; passes in both `en` and `ar`.
- **`features/station/components/station-offline.test.tsx`** stays unmodified — it is the fallback path's regression guard.
- **Manual:** load an actually-offline station on `:3000` in both languages and confirm real numbers plus banner.

## Known limitation

An estimate integrated this closely will be read as the station's own reading by some users regardless of the banner's wording. The per-surface badge is the mitigation, not a fix. Accepted deliberately: the alternative — leaving the panel empty — is the behaviour this spec exists to remove.
