import { NextRequest, NextResponse } from "next/server";

import { ApiError, upsertSetting } from "@/lib/api";

/** PUT /dashboard/api/settings { key, value } — upsert one system setting. */
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  let body: { key?: string; value?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }
  try {
    const result = await upsertSetting(body.key, body.value ?? "");
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to save setting" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to save setting" },
      { status },
    );
  }
}
