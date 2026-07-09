import { NextRequest, NextResponse } from "next/server";

import { ApiError, updateValidationRule } from "@/lib/api";

/** PUT /dashboard/api/validation-rules/:id — edit a metric's valid range / max rate. */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: {
    valid_range_min?: number | null;
    valid_range_max?: number | null;
    max_rate_of_change?: number | null;
    rate_interval_min?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await updateValidationRule(id, body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to update validation rule" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to update validation rule" },
      { status },
    );
  }
}
