import { NextRequest, NextResponse } from "next/server";

import { ApiError, createThreshold } from "@/lib/api";
import type { CreateThresholdInput } from "@/lib/api";

/** POST /dashboard/api/thresholds — create a threshold for a region+parameter+severity. */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: CreateThresholdInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await createThreshold(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to create threshold" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to create threshold" },
      { status },
    );
  }
}
