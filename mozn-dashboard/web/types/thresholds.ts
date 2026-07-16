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
  /** Backend AlertThreshold row id — targets PUT/DELETE for this tier. */
  id: string;
  /** Raw backend identity (immutable on PUT): parameter + severity + applies_to. */
  parameter: string;
  severity: "yellow" | "orange" | "red";
  appliesTo: "observed" | "forecast" | "both";
  isActive: boolean;
  sustainDurationMinutes: number | null;
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
  /** Backend parameter key — the card identity. One card per parameter, so
   *  temp_high_c and temp_low_c (etc.) no longer collapse into one card and
   *  hide the second parameter's tiers. */
  parameter: string;
  /** English display label (from paramLabel); Arabic applied via td() in the UI. */
  label: string;
  unit: string;
  /** Below-comparison parameter (temp_low_c): breaches when value < cut-off, so
   *  the editor renders ≤ and inverts the tier ordering. Mirrors isValueBreached
   *  in the Go engine (services/alert_checker.go). */
  isLowSide: boolean;
  perStationOverrides: boolean;
  /** Region the thresholds belong to — used for the live impact preview. */
  regionId: string;
  /** Region's English name (translated in the UI via region.* keys). */
  regionName: string;
  tiers: ThresholdTier[];
  scale: ScaleStop[];
}

export interface ThresholdChange {
  /** History row id — sent as {history_id} to the revert endpoint. */
  id: string;
  /** The threshold row the history belongs to — the revert URL target. */
  thresholdId: string;
  change: string;
  by: string;
  when: string;
  /** Raw ISO of the change — rendered client-side so it re-localizes instantly. */
  whenAt: string;
}

/** Comparator for a compound-rule condition (backend: gt/gte/lt/lte/eq). */
export type CompoundOperator = "gt" | "gte" | "lt" | "lte" | "eq";

/** One condition inside a compound rule (backend RuleCondition). */
export interface CompoundCondition {
  id?: string;
  parameter: string;
  operator: CompoundOperator;
  value: number;
  sustainMinutes: number | null;
}

/** A multi-metric compound rule (A3.0). All conditions must hold to fire. */
export interface CompoundRule {
  id: string;
  name: string;
  regionId: string;
  severity: "yellow" | "orange" | "red";
  isActive: boolean;
  conditions: CompoundCondition[];
}

export interface ThresholdsPage {
  metrics: MetricThresholds[];
  changes: ThresholdChange[];
}
