import { NextResponse } from "next/server";

import { getRecentAlertNotifs } from "@/lib/api";

/**
 * GET /dashboard/api/notifications — recent notable alerts for backfilling the
 * notification bell on load. The bell is a client store (notifications-store)
 * that can't import server-only lib/api, so it fetches this on mount. Best-effort:
 * returns an empty list on any failure so the bell just falls back to SSE-only.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getRecentAlertNotifs();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
