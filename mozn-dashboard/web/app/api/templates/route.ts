import { NextRequest, NextResponse } from "next/server";

import { ApiError, createTemplate } from "@/lib/api";
import type { CreateTemplateInput } from "@/lib/api";

/** POST /dashboard/api/templates — create an alert template (event_type + severity). */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: CreateTemplateInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await createTemplate(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to create template" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to create template" },
      { status },
    );
  }
}
