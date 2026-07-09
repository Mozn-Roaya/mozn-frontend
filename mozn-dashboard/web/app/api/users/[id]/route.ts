import { NextRequest, NextResponse } from "next/server";

import { ApiError, deleteUser, updateUser } from "@/lib/api";
import type { UpdateUserInput } from "@/types/users";

/**
 * PUT    /dashboard/api/users/:id — update role/regions/status/contact.
 * DELETE /dashboard/api/users/:id — remove a user.
 * The backend's rank guard (and last-admin protection) surface via the message.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: UpdateUserInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  try {
    const result = await updateUser(id, body);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to update user" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to update user" },
      { status },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const result = await deleteUser(id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "Failed to delete user" },
        { status: result.status || 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status ?? 502 : 500;
    return NextResponse.json(
      { error: status === 401 ? "Not authenticated" : "Failed to delete user" },
      { status },
    );
  }
}
