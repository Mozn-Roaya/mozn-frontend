import { NextRequest, NextResponse } from "next/server";

import { ApiError, getStationForecast } from "@/lib/api";

/** GET /dashboard/api/forecasts?station_id= — 7-day forecast for a station,
 * aggregated for the station-summary card. Reflects live state — no cache. */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const stationId = req.nextUrl.searchParams.get("station_id");
  if (!stationId) {
    return NextResponse.json({ error: "station_id is required" }, { status: 400 });
  }
  try {
    const data = await getStationForecast(stationId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to load forecast" },
      { status },
    );
  }
}
