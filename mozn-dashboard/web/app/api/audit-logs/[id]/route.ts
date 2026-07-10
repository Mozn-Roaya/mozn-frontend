import { NextRequest, NextResponse } from "next/server";

import { ApiError, getAuditLog } from "@/lib/api";

/** GET /dashboard/api/audit-logs/:id — full detail for one audit entry. */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const data = await getAuditLog(id);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to load audit entry" },
      { status },
    );
  }
}
