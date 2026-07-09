import { NextRequest, NextResponse } from "next/server";

import {
  acknowledgeAlert,
  ApiError,
  escalateAlert,
  rejectAlert,
  reopenAlert,
  resolveAlert,
  unacknowledgeAlert,
} from "@/lib/api";

/**
 * Client-facing proxy for alert lifecycle actions. The alert screens are client
 * components and can't import the server-only lib/api, so they POST here and we
 * forward to the backend with the Bearer cookie. Reflects live state — no cache.
 *
 *   POST /dashboard/api/alerts/:id/acknowledge   { note?: string }
 *   POST /dashboard/api/alerts/:id/unacknowledge
 *   POST /dashboard/api/alerts/:id/resolve       { reason?: string }
 *   POST /dashboard/api/alerts/:id/reopen
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; action: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id, action } = await params;

  let body: { reason?: string; note?: string; urgency?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* body is optional for every action */
  }

  try {
    let result;
    switch (action) {
      case "acknowledge":
        result = await acknowledgeAlert(id, body.note);
        break;
      case "unacknowledge":
        result = await unacknowledgeAlert(id);
        break;
      case "resolve":
        result = await resolveAlert(id, body.reason);
        break;
      case "reopen":
        result = await reopenAlert(id);
        break;
      case "reject":
        result = await rejectAlert(id, body.note);
        break;
      case "escalate":
        result = await escalateAlert(id, body.urgency ?? "urgent");
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 404 });
    }

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Action failed" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Action failed" },
      { status },
    );
  }
}
