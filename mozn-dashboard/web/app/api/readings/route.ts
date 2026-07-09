import { NextRequest, NextResponse } from "next/server";

import { ApiError, getLatestReading } from "@/lib/api";

/**
 * GET /dashboard/api/readings?station_id=<uuid> — latest reading for a station,
 * shaped as the summary card's weather fields (or null). The card is a client
 * component and can't import server-only lib/api, so it fetches this on open.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const stationId = req.nextUrl.searchParams.get("station_id");
  if (!stationId) {
    return NextResponse.json({ error: "station_id is required" }, { status: 400 });
  }
  try {
    const weather = await getLatestReading(stationId);
    return NextResponse.json(weather);
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json({ error: "Failed to load reading" }, { status });
  }
}
