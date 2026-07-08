import { NextResponse } from "next/server";

import { ApiError, getStations } from "@/lib/api";

/**
 * Client-facing proxy for the stations list. The palette (a client component)
 * can't import the server-only `lib/api` directly, so this thin route handler
 * exposes the same data over fetch. It reflects live state, so never cache.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const page = await getStations();
    return NextResponse.json(page);
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json({ error: "Failed to load stations" }, { status });
  }
}
