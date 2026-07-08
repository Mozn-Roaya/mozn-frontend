/**
 * Cross-feature domain vocabulary: unions shared by multiple features and by the
 * shared presentational components (status badges, activity category, data-table
 * toolbars). Feature-specific page/row types live in features/<feature>/types.ts
 * and re-export the unions they reference from here. Mirrors the Go
 * internal/model contract.
 */

/** A filter chip/tab; reused by the Stations, Alert Inbox and Users toolbars. */
export interface FilterTab {
  key: string;
  label: string;
  count?: number;
  /** Optional leading status dot (Tailwind bg-* class), used by Stations. */
  dot?: string;
}

/** Live operational status of a monitoring station (admin Stations screen). */
export type StationOpStatus =
  | "online"
  | "offline"
  | "maintenance"
  | "anomaly"
  | "warning";

/** Triage severity for an Alert Inbox item. */
export type InboxSeverity = "critical" | "urgent" | "routine";

/** Account role. */
export type UserRole = "Super Admin" | "Gov Editor" | "Gov Viewer";

/** Alert severity, used across Alert History and the severity badge. */
export type AlertSeverity = "critical" | "warning" | "watch" | "advisory";

/** How an alert was resolved. */
export type AlertOutcome = "all-clear" | "auto-cleared";

/** Category of an audit/activity entry. */
export type ActivityCategory =
  | "alert"
  | "threshold"
  | "station"
  | "user"
  | "auth";

/** Monitored metric; shared by Thresholds and Alert Management. */
export type ThresholdMetric = "rainfall" | "wind" | "water" | "temperature";

/**
 * A response-guidance step authored in both site languages. Response steps are
 * admin-authored at runtime (Alert Templates / per-station override), so unlike
 * the seeded alert `actions` they can't rely on the data dictionary — both
 * translations are stored on the step itself and the citizen card picks by
 * locale. Day/night doesn't apply: procedural guidance is the same overnight.
 */
export interface LocalizedStep {
  en: string;
  ar: string;
}
