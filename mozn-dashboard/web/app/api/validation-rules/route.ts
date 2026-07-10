import { NextRequest, NextResponse } from "next/server";

import { ApiError, createValidationRule } from "@/lib/api";
import type { CreateValidationRuleInput } from "@/lib/api";

/** POST /dashboard/api/validation-rules — create a data-validation rule. */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: CreateValidationRuleInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await createValidationRule(body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to create validation rule" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to create validation rule" },
      { status },
    );
  }
}
