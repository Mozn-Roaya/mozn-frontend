export type SensorKey =
  | "temperature"
  | "humidity"
  | "wind"
  | "rainfall"
  | "water"
  | "pressure";

export const SENSORS: SensorKey[] = [
  "temperature",
  "rainfall",
  "wind",
  "humidity",
  "pressure",
  "water",
];

export const DEFAULT_SENSORS: SensorKey[] = ["temperature", "rainfall", "wind", "humidity"];

/**
 * FE sensor group → backend weather-parameter keys. The API stores + validates
 * sensors as parameter keys (temp_high_c, rain_rate_mm, …), not the friendly
 * group names the form shows, so we translate on save and reverse on prefill.
 * "water" has no backend parameter (water-level is an unsupported data source).
 */
export const SENSOR_PARAMS: Record<SensorKey, string[]> = {
  temperature: ["temp_high_c", "temp_low_c"],
  rainfall: ["rain_rate_mm", "rain_daily_mm"],
  wind: ["wind_speed_kmh", "wind_gust_kmh"],
  humidity: ["humidity"],
  pressure: ["pressure_hpa"],
  water: [],
};

/** Expand selected FE sensor groups into the backend parameter keys to store. */
export function sensorsToParams(selected: SensorKey[]): string[] {
  return selected.flatMap((k) => SENSOR_PARAMS[k]);
}

/** Reverse: which FE sensor groups appear in a backend param-key list. */
export function paramsToSensors(params: string[]): Record<SensorKey, boolean> {
  const set = new Set(params);
  return SENSORS.reduce(
    (acc, k) => ({ ...acc, [k]: SENSOR_PARAMS[k].some((p) => set.has(p)) }),
    {} as Record<SensorKey, boolean>,
  );
}

export type StationInitialStatus = "active" | "maintenance" | "offline";

export interface StationFormValue {
  name: string;
  nameAr: string;
  region: string;
  /** City (municipality) the station belongs to — its display name. */
  city: string;
  /** Owning municipality UUID — targets PUT /api/municipalities/:id for contacts. */
  municipalityId: string;
  /** Weather Underground station id this station ingests from (optional, editable).
   * Distinct from the station's own id, which the backend auto-generates (UUID). */
  wuStationId: string;
  lat: string;
  lng: string;
  status: StationInitialStatus;
  sensors: Record<SensorKey, boolean>;
}

// Libya bounding box (approximate), used only to validate that a new
// station's pin falls within the country's boundary.
export const LIBYA = { latMin: 19, latMax: 34, lngMin: 9, lngMax: 26 };

export function isInLibya(lat: number, lng: number): boolean {
  return lat >= LIBYA.latMin && lat <= LIBYA.latMax && lng >= LIBYA.lngMin && lng <= LIBYA.lngMax;
}
