import { NextRequest, NextResponse } from "next/server";

import { ApiError, revertThreshold } from "@/lib/api";

/** POST /dashboard/api/thresholds/:id/revert { history_id } — restore a past value. */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: { history_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.history_id) {
    return NextResponse.json({ error: "history_id is required" }, { status: 400 });
  }
  try {
    const result = await revertThreshold(id, body.history_id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to revert threshold" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to revert threshold" },
      { status },
    );
  }
}
