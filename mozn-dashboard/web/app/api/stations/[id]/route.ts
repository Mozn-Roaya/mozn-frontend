import { NextRequest, NextResponse } from "next/server";

import { ApiError, deleteStation, updateStation } from "@/lib/api";
import type { StationWriteInput } from "@/types/stations";

/**
 * PUT    /dashboard/api/stations/:id — edit a station / set operational status.
 * DELETE /dashboard/api/stations/:id — remove a station.
 * Thin proxies to the backend with the Bearer cookie; surface its message.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: StationWriteInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await updateStation(id, body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to update station" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to update station" },
      { status },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const result = await deleteStation(id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to delete station" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to delete station" },
      { status },
    );
  }
}
