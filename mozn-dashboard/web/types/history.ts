/**
 * Alert History API contract types. Mirror the JSON served by the Go backend
 * (internal/model/history.go). Part of the shared types/ contract layer so the
 * fetch layer (lib/api) can reference them without reaching into features/. The
 * history feature re-exports these from features/history/types.
 */
import type { AlertSeverity, AlertOutcome } from "@/types/shared";

export type { AlertSeverity, AlertOutcome };

export interface AlertHistoryRow {
  id: string;
  date: string;
  time: string;
  severity: AlertSeverity;
  alert: string;
  region: string;
  ackTime: string;
  duration: string;
  outcome: AlertOutcome;
}

export interface AlertHistoryPage {
  ranges: string[];
  regions: string[];
  types: string[];
  severities: string[];
  rows: AlertHistoryRow[];
}
