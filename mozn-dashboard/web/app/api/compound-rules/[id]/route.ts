import { NextRequest, NextResponse } from "next/server";

import { ApiError, deleteCompoundRule, updateCompoundRule } from "@/lib/api";
import type { CompoundRuleWriteInput } from "@/lib/api";

/**
 * PUT    /dashboard/api/compound-rules/:id — edit a compound rule.
 * DELETE /dashboard/api/compound-rules/:id — remove one.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: Partial<CompoundRuleWriteInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await updateCompoundRule(id, body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to update compound rule" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to update compound rule" },
      { status },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const result = await deleteCompoundRule(id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to delete compound rule" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to delete compound rule" },
      { status },
    );
  }
}
