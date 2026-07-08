import { apiFetch } from "./client";

import type { Station } from "./types";

export function listStations(municipalityId?: string) {
  return apiFetch<Station[]>("/public/stations", {
    query: municipalityId ? { municipality_id: municipalityId } : undefined,
    revalidate: 60,
  });
}

export async function getStation(id: string): Promise<Station> {
  const detail = await apiFetch<Station>(
    `/public/stations/${encodeURIComponent(id)}`,
    { revalidate: 60 },
  );
  // The detail endpoint omits status / active_alerts / forecast_alerts —
  // backfill from the list endpoint (deduped by Next's request memo when the
  // app layout already fetched it).
  if (detail.status) return detail;
  const list = await listStations();
  const fromList = list.find((s) => s.id === detail.id);
  if (!fromList) return detail;
  return {
    ...detail,
    status: fromList.status,
    active_alerts: fromList.active_alerts,
    forecast_alerts: fromList.forecast_alerts,
  };
}

export function listNearestStations(lat: number, lng: number, limit = 5) {
  return apiFetch<(Station & { distance_km: number })[]>(
    "/public/stations/nearest",
    {
      query: { lat, lng, limit },
      revalidate: 60,
    },
  );
}
