import { NextRequest, NextResponse } from "next/server";

import { ApiError, deleteThreshold, updateThreshold } from "@/lib/api";

/** PUT /dashboard/api/thresholds/:id — edit a threshold tier's value/sustain/etc.
 * (parameter/severity/region are immutable on the backend). */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: {
    value?: number;
    is_active?: boolean;
    sustain_duration_minutes?: number | null;
    applies_to?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await updateThreshold(id, body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to update threshold" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to update threshold" },
      { status },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const result = await deleteThreshold(id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to delete threshold" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to delete threshold" },
      { status },
    );
  }
}
