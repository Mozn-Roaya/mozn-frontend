import { NextRequest, NextResponse } from "next/server";

import { ApiError, previewThreshold } from "@/lib/api";

/** POST /dashboard/api/thresholds/preview — dry-run: how many stations a value
 * would affect over the lookback window. Read-only (no writes). */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: {
    region_id?: string;
    parameter?: string;
    value?: number;
    sustain_duration_minutes?: number | null;
    lookback_hours?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.region_id || !body.parameter || body.value == null) {
    return NextResponse.json({ error: "region_id, parameter and value are required" }, { status: 400 });
  }
  try {
    const result = await previewThreshold({
      region_id: body.region_id,
      parameter: body.parameter,
      value: body.value,
      sustain_duration_minutes: body.sustain_duration_minutes,
      lookback_hours: body.lookback_hours,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Preview failed" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Preview failed" },
      { status },
    );
  }
}
