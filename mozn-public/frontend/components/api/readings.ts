import { apiFetch } from "./client";

import type { Reading, ReadingHistoryBucket } from "./types";

export function getLatestReading(stationId: string): Promise<Reading | null> {
  return apiFetch<Reading[]>("/public/readings", {
    query: { station_id: stationId, page_size: 1 },
    revalidate: 30,
  }).then((rs) => rs[0] ?? null);
}

export function getReadingsHistory(
  stationId: string,
  range: "24h" | "7d" | "30d" = "24h",
): Promise<ReadingHistoryBucket[]> {
  return apiFetch<ReadingHistoryBucket[] | null>("/public/readings/history", {
    query: { station_id: stationId, range },
    revalidate: 60,
  }).then((d) => d ?? []);
}
