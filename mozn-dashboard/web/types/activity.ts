/**
 * Activity Log API contract types. Mirror the JSON served by the Go backend
 * (internal/model/activity.go). Part of the shared types/ contract layer so the
 * fetch layer (lib/api) can reference them without reaching into features/. The
 * activity feature re-exports these from features/activity/types.
 */
import type { ActivityCategory } from "@/types/shared";

export type { ActivityCategory };

export interface ActivityRow {
  id: string;
  time: string;
  actor: string;
  initials: string;
  action: string;
  category: ActivityCategory;
  source: string;
}

export interface ActivityDayGroup {
  label: string;
  /** Calendar day as an ISO "YYYY-MM-DD" string; the client filters/formats off this. */
  date: string;
  rows: ActivityRow[];
}

/** Server-side pagination metadata (mirrors the backend `metadata` envelope). */
export interface ActivityLogMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ActivityLogPage {
  /** All selectable category facet values (not derived from the current page). */
  categories: string[];
  users: string[];
  groups: ActivityDayGroup[];
  /** Pagination cursor + totals for the current (server-filtered) query. */
  meta: ActivityLogMeta;
}

/** Full audit-log entry for the per-row detail view (GET /api/audit-logs/:id). */
export interface AuditLogDetail {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  status: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  durationMs: number;
  createdAt: string;
  requestPayload: unknown;
  responseError: string | null;
  details: unknown;
}
