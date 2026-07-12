import { apiFetch } from "./client";

import type { DailyForecast } from "./types";

export function getDailyForecast(stationId: string, days = 3): Promise<DailyForecast[]> {
  return apiFetch<DailyForecast[]>("/public/forecasts/daily", {
    query: { station_id: stationId, days },
    revalidate: 300,
  });
}
