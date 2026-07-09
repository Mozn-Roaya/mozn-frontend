import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/backend";

export const dynamic = "force-dynamic";

const COOKIE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/";

/** POST /dashboard/api/auth/logout — clears the session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
    maxAge: 0,
  });
  return res;
}
