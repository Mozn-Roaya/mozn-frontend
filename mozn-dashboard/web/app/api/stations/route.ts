import { NextRequest, NextResponse } from "next/server";

import { ApiError, createStation, getStations } from "@/lib/api";
import type { StationWriteInput } from "@/types/stations";

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

/** POST /dashboard/api/stations — create a station. */
export async function POST(req: NextRequest) {
  let body: StationWriteInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await createStation(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to create station" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to create station" },
      { status },
    );
  }
}
