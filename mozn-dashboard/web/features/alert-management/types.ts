import type { ThresholdMetric } from "@/types/shared";

export type ManagedSeverity = "advisory" | "watch" | "warning" | "critical";
export type ManagedStatus = "active" | "acknowledged" | "resolved";

/** An active or past alert managed by the MOZN team (A3.2). */
export interface ManagedAlert {
  id: string;
  typeKey: ThresholdMetric | "compound";
  severity: ManagedSeverity;
  status: ManagedStatus;
  region: string;
  stations: string[];
  trigger: string;
  readings: { metric: ThresholdMetric; value: string }[];
  durationMin: number;
  /** Alert origin — 'forecast' alerts announce a future window, so the table
   *  shows when they occur rather than how long they've been active. */
  source: string;
  issuedAt: string;
  /** Forecast/scheduled window (ISO). Absent for immediate observed alerts. */
  startsAt?: string | null;
  expiresAt?: string | null;
  /** Minutes until startsAt (server-computed; negative once it has started). */
  leadMin?: number | null;
}
