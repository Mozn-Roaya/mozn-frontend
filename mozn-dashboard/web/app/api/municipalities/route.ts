import { NextResponse } from "next/server";

import { ApiError, getMunicipalityOptions } from "@/lib/api";

/**
 * GET /dashboard/api/municipalities — municipalities (id, name, region name, and
 * emergency-contact numbers) for the station form's municipality picker. Client
 * component, so it can't import server-only lib/api directly. Live state — no cache.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const municipalities = await getMunicipalityOptions();
    return NextResponse.json(municipalities);
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json({ error: "Failed to load municipalities" }, { status });
  }
}
