import { NextRequest, NextResponse } from "next/server";

import { ApiError, createAlert } from "@/lib/api";
import type { CreateAlertInput } from "@/lib/api";

/** POST /dashboard/api/alerts — create a manual alert for a station. */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: CreateAlertInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await createAlert(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to create alert" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to create alert" },
      { status },
    );
  }
}
