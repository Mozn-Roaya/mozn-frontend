import { apiFetchEnvelope } from "./client";

import type { Alert, ApiEnvelope } from "./types";

/**
 * `station_id` is sent as a query param but is NOT yet honored by the
 * `/public/alerts` endpoint (swagger only lists severity/source/region_id/
 * page/page_size as of 2026-05). It's wired through here so the frontend is
 * ready the moment the backend adds it; until then, callers that need a
 * single station should also filter client-side AND raise `page_size` so the
 * station's alert isn't missed by the global pagination window.
 */
export function listAlerts(filters: {
  severity?: "yellow" | "orange" | "red";
  source?: "observed" | "forecast";
  region_id?: string;
  station_id?: string;
  page?: number;
  page_size?: number;
} = {}): Promise<ApiEnvelope<Alert[]>> {
  return apiFetchEnvelope<Alert[]>("/public/alerts", {
    query: filters,
    revalidate: 30,
  });
}
