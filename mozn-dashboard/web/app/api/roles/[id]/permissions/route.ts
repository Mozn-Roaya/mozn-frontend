import { NextRequest, NextResponse } from "next/server";

import { ApiError, updateRolePermissions } from "@/lib/api";

/**
 * PUT /dashboard/api/roles/:id/permissions  { permission_ids: string[] }
 * Client-facing proxy for the role→permission matrix Save. Forwards the full
 * desired permission set (Replace semantics) to the backend with the Bearer
 * cookie; surfaces the backend's message (e.g. the last-roles.manage lockout
 * guard) so the UI can show a specific error.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: { permission_ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ids = Array.isArray(body.permission_ids)
    ? body.permission_ids.filter((x): x is string => typeof x === "string")
    : [];

  try {
    const result = await updateRolePermissions(id, ids);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to update permissions" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to update permissions" },
      { status },
    );
  }
}
