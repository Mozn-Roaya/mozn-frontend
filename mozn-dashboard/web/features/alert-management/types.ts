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
}
