import { apiFetch } from "./client";

import type { Station } from "./types";

export function listStations(municipalityId?: string, opts?: { fresh?: boolean }) {
  return apiFetch<Station[]>("/public/stations", {
    query: municipalityId ? { municipality_id: municipalityId } : undefined,
    // The live map passes fresh:true so an SSE-triggered router.refresh() reflects
    // a just-confirmed alert immediately — router.refresh() does NOT bust Next's
    // Data Cache, so a `revalidate` would keep serving the pre-alert stations for
    // up to its TTL. Other callers keep the 60s cache; the backend's own response
    // cache still shields the endpoint from load.
    ...(opts?.fresh ? { cache: "no-store" as const } : { revalidate: 60 }),
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
