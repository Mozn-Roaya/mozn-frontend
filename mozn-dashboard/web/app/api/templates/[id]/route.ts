import { NextRequest, NextResponse } from "next/server";

import { ApiError, deleteTemplate, updateTemplate } from "@/lib/api";
import type { TemplateWriteInput } from "@/lib/api";

/**
 * PUT    /dashboard/api/templates/:id — edit an alert template's messages/steps.
 * DELETE /dashboard/api/templates/:id — remove a template.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: Partial<TemplateWriteInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await updateTemplate(id, body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to update template" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to update template" },
      { status },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const result = await deleteTemplate(id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to delete template" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to delete template" },
      { status },
    );
  }
}
