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

export interface ActivityLogPage {
  categories: string[];
  users: string[];
  groups: ActivityDayGroup[];
}
