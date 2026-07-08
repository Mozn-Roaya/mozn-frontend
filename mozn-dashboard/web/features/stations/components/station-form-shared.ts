import type { LocalizedStep } from "@/types/shared";

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

export type StationProtocol = "cellular" | "satellite" | "lora";
export type StationInterval = "1" | "5" | "15" | "60";
export type StationInitialStatus = "active" | "maintenance" | "offline";

export interface StationFormValue {
  name: string;
  nameAr: string;
  region: string;
  /** City the station belongs to — drives its per-city emergency numbers. */
  city: string;
  lat: string;
  lng: string;
  status: StationInitialStatus;
  sensors: Record<SensorKey, boolean>;
  protocol: StationProtocol;
  interval: StationInterval;
  /** When true, `steps` replace the event template's response steps for this
   * station's flash-flood alert. When false, the station inherits the template. */
  overrideSteps: boolean;
  /** Per-station response-step overrides (edited only while `overrideSteps`),
   * authored in both languages. */
  steps: LocalizedStep[];
}

/** Event whose response steps a station can override in the form (the preview's
 * alert is a flash-flood warning). */
export const STEP_OVERRIDE_EVENT = "flashFlood";

// Libya bounding box (approximate), used only to validate that a new
// station's pin falls within the country's boundary.
export const LIBYA = { latMin: 19, latMax: 34, lngMin: 9, lngMax: 26 };

export function isInLibya(lat: number, lng: number): boolean {
  return lat >= LIBYA.latMin && lat <= LIBYA.latMax && lng >= LIBYA.lngMin && lng <= LIBYA.lngMax;
}
