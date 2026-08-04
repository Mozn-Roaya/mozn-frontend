/**
 * Open-Meteo — the fallback weather source for offline stations.
 *
 * Deliberately not routed through `apiFetch`: that helper is bound to the Mozn
 * API's base URL and its `{ data }` envelope, neither of which applies here.
 *
 * Why this source: it is keyless and free, and it is addressed at the station's
 * own latitude/longitude, so an offline station's panel shows weather for that
 * exact spot rather than a distant neighbour's reading. Its default units
 * already match what the panel renders — °C, %, hPa, km/h, mm, degrees — so the
 * only conversion below is precipitation (interval accumulation → hourly rate).
 *
 * Attribution: Open-Meteo's licence requires a visible credit wherever this
 * data is shown. `StationEstimated` renders it via `t.estimateSource`.
 */

/** Module const rather than an env var — there is no key and nothing to configure. */
const OPEN_METEO_BASE = "https://api.open-meteo.com";

/** Open-Meteo updates on a 15-minute cadence; caching longer buys nothing. */
const REVALIDATE_SECONDS = 900;

/** A slow upstream must never stall the station page's render. */
const TIMEOUT_MS = 4000;

/**
 * Approximate current conditions for a point. Shaped to mirror `Reading` field
 * for field (same names, same units) so the panel's existing formatters and
 * summary helpers work unchanged — but kept a *distinct type* on purpose, so an
 * estimate can't be passed somewhere a real station reading is expected.
 *
 * `temp_c` is the only non-nullable field: a panel with no temperature has
 * nothing worth showing, so that case returns `null` for the whole object.
 * Every other field degrades independently and renders as "—".
 */
export type EstimatedConditions = {
  /** `current.time` in the station's local zone (`timezone=auto`). */
  observed_at: string;
  temp_c: number;
  feels_like_c: number | null;
  humidity: number | null;
  pressure_hpa: number | null;
  wind_speed_kmh: number | null;
  /** 0–360 degrees, matching `Reading.wind_dir`. */
  wind_dir: number | null;
  /** mm/hr — converted from the interval accumulation, see `toHourlyRate`. */
  rain_rate_mm: number | null;
  rain_daily_mm: number | null;
};

type CurrentBlock = {
  time?: unknown;
  interval?: unknown;
  temperature_2m?: unknown;
  apparent_temperature?: unknown;
  relative_humidity_2m?: unknown;
  surface_pressure?: unknown;
  wind_speed_10m?: unknown;
  wind_direction_10m?: unknown;
  precipitation?: unknown;
};

type ForecastResponse = {
  current?: CurrentBlock;
  daily?: { precipitation_sum?: unknown };
};

/** Numeric fields arrive as numbers, but a null/absent field must not become 0. */
function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * `current.precipitation` is millimetres accumulated over the preceding
 * interval, not a rate, while the panel's tile is labelled mm/hr. `interval` is
 * seconds (900 in practice), so this is ×4 — but read from the response rather
 * than hardcoded, since the cadence is Open-Meteo's to change. Without a usable
 * interval the honest answer is no value, not an unconverted figure.
 */
function toHourlyRate(precipitation: unknown, interval: unknown): number | null {
  const mm = num(precipitation);
  const seconds = num(interval);
  if (mm === null || seconds === null || seconds <= 0) return null;
  return Math.round((mm * 3600) / seconds * 10) / 10;
}

/**
 * Fetch approximate current conditions for a coordinate pair.
 *
 * Returns `null` — never throws — on any failure (non-2xx, network error,
 * timeout, malformed JSON, missing temperature). Callers treat `null` as
 * "no estimate available" and fall back to the plain offline card.
 */
export async function getEstimatedConditions(
  lat: number,
  lng: number,
): Promise<EstimatedConditions | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const query = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "surface_pressure",
      "wind_speed_10m",
      "wind_direction_10m",
      "precipitation",
    ].join(","),
    daily: "precipitation_sum",
    forecast_days: "1",
    timezone: "auto",
  });

  let json: ForecastResponse;
  try {
    const res = await fetch(`${OPEN_METEO_BASE}/v1/forecast?${query}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    json = (await res.json()) as ForecastResponse;
  } catch {
    return null;
  }

  const current = json.current;
  if (!current) return null;

  const temp = num(current.temperature_2m);
  if (temp === null) return null;

  const dailyRain = Array.isArray(json.daily?.precipitation_sum)
    ? num(json.daily?.precipitation_sum[0])
    : null;

  return {
    observed_at: typeof current.time === "string" ? current.time : "",
    temp_c: temp,
    feels_like_c: num(current.apparent_temperature),
    humidity: num(current.relative_humidity_2m),
    pressure_hpa: num(current.surface_pressure),
    wind_speed_kmh: num(current.wind_speed_10m),
    wind_dir: num(current.wind_direction_10m),
    rain_rate_mm: toHourlyRate(current.precipitation, current.interval),
    rain_daily_mm: dailyRain,
  };
}
