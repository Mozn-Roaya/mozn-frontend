import { NextRequest, NextResponse } from "next/server";

import { ApiError, createCompoundRule, getCompoundRules } from "@/lib/api";
import type { CompoundRuleWriteInput } from "@/lib/api";

/**
 * GET  /dashboard/api/compound-rules — list compound rules.
 * POST /dashboard/api/compound-rules — create one.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCompoundRules();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to load compound rules" },
      { status },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: CompoundRuleWriteInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await createCompoundRule(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to create compound rule" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to create compound rule" },
      { status },
    );
  }
}
