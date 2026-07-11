/**
 * Alert Inbox API contract types. Mirror the JSON served by the Go backend
 * (internal/model/alert_inbox.go). Part of the shared types/ contract layer so
 * the fetch layer (lib/api) can reference them without reaching into features/.
 * The alert-inbox feature re-exports these from features/alert-inbox/types.
 */
import type { FilterTab, InboxSeverity } from "@/types/shared";

export type { InboxSeverity };

export type SlaTone = "danger" | "ok" | "muted";

/** Direction the triggering reading is moving (A3.3 — per-item trend). */
export type TrendDirection = "rising" | "falling" | "stable";

export interface InboxMetric {
  label: string;
  value: string;
  threshold: string;
}

export interface InboxItem {
  id: string;
  severity: InboxSeverity;
  title: string;
  /** Station the alert belongs to — enables the row's "set maintenance" action. */
  stationId?: string;
  context: string;
  timeAgo: string;
  /** Raw ISO of when the alert was issued — rendered client-side (RelativeTime). */
  issuedAt: string;
  /** Alert age in seconds at fetch time — the client recomputes the SLA label
   * from this + the operator's SLA-minutes preference (no live Date in render). */
  ageSeconds: number;
  sla: { label: string; tone: SlaTone };
  metrics: InboxMetric[];
  /** Right-hand readout — e.g. "SUSTAINED 32 / 30 min" or "WINDOW Thu 18:00". */
  meter: { label: string; value: string };
  recommended: string;
  /** Operator has taken ownership (backend acknowledged_at set) but it's still pending. */
  acknowledged: boolean;
  /** Optional — derived client-side when the backend omits it (see itemTrend). */
  trend?: TrendDirection;
}

export interface AlertInboxPage {
  avgAck: string;
  slaNote: string;
  filters: FilterTab[];
  items: InboxItem[];
}
