import { NextRequest, NextResponse } from "next/server";

import { ApiError, updateMunicipalityContacts } from "@/lib/api";

/**
 * PUT /dashboard/api/municipalities/:id — update a city's emergency contact
 * numbers. Body: { emergencyServices: string, civilDefense: string }. Forwarded
 * to the backend PUT /api/municipalities/:id with the Bearer cookie.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: { emergencyServices?: string; civilDefense?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = await updateMunicipalityContacts(id, {
      emergencyServices: body.emergencyServices ?? "",
      civilDefense: body.civilDefense ?? "",
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to update contacts" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to update contacts" },
      { status },
    );
  }
}
