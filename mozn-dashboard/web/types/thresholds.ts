/**
 * Thresholds API contract types. Mirror the JSON served by the Go backend
 * (internal/model/thresholds.go). Part of the shared types/ contract layer so
 * the fetch layer (lib/api) can reference them without reaching into features/.
 * The thresholds feature re-exports these from features/thresholds/types.
 */
import type { ThresholdMetric } from "@/types/shared";

export type { ThresholdMetric };

export type TierMode = "auto" | "manual";

export interface ThresholdTier {
  name: string;
  mode: TierMode;
  description: string;
  value: string;
  unit: string;
  sustained: string;
}

export interface ScaleStop {
  label: string;
  value: string;
  /** Token name: normal | advisory | watch | warning. */
  tone: string;
}

export interface MetricThresholds {
  metric: ThresholdMetric;
  label: string;
  unit: string;
  perStationOverrides: boolean;
  tiers: ThresholdTier[];
  scale: ScaleStop[];
}

export interface ImpactStation {
  name: string;
  tier: string;
  tone: string;
  note?: string;
}

export interface ThresholdChange {
  id: string;
  change: string;
  by: string;
  when: string;
}

export type RuleTier = "advisory" | "watch" | "warning";

/** One condition inside a compound rule (metric + comparator + value). */
export interface CompoundCondition {
  metric: ThresholdMetric;
  op: ">" | "<" | ">=" | "<=";
  value: number;
}

/** A multi-metric rule the MOZN team composes (A3.0 — Compound rules). */
export interface CompoundRule {
  id: string;
  name: string;
  /** Whether ALL conditions must hold, or ANY one of them (Sentry-style). */
  match: "all" | "any";
  conditions: CompoundCondition[];
  sustainedMin: number;
  tier: RuleTier;
  enabled: boolean;
}

/** A threshold on predicted conditions (A3.0 — Forecast-based tab). */
export interface ForecastThreshold {
  id: string;
  metric: ThresholdMetric;
  tier: RuleTier;
  value: string;
  unit: string;
  /** Advisory/Watch can auto-trigger pin notifications; Warning needs approval. */
  autoTrigger: boolean;
}

export interface ThresholdsPage {
  metrics: MetricThresholds[];
  impact: { note: string; stations: ImpactStation[] };
  changes: ThresholdChange[];
}
