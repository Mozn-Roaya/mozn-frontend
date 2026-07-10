import { NextResponse } from "next/server";

import { ApiError, getParameters } from "@/lib/api";

/** GET /dashboard/api/parameters — backend weather-parameter catalog for the
 * client-side threshold/alert create dropdowns. Reflects live state — no cache. */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getParameters();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to load parameters" },
      { status },
    );
  }
}
