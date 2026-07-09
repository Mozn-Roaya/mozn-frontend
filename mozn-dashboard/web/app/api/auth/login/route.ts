import { NextRequest, NextResponse } from "next/server";

import { ApiError, loginToBackend, SESSION_COOKIE } from "@/lib/backend";

export const dynamic = "force-dynamic";

// Scope the session cookie to the dashboard zone (basePath) so it isn't sent to
// the public zone. Falls back to "/" when no basePath is configured.
const COOKIE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/";

/** POST /dashboard/api/auth/login — exchanges credentials for a backend JWT and
 * stores it in an httpOnly cookie. The browser never sees the token. */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  try {
    const { user, token } = await loginToBackend(email, password);
    const res = NextResponse.json({ ok: true, name: user.name });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: COOKIE_PATH,
      maxAge: 60 * 60 * 12, // 12h — matches the backend's default token expiry
    });
    return res;
  } catch (err) {
    const status = err instanceof ApiError && err.status ? err.status : 502;
    const message =
      status === 401
        ? "Invalid email or password"
        : status === 403
          ? "This account is deactivated"
          : "Could not reach the server. Is the backend running?";
    return NextResponse.json({ error: message }, { status });
  }
}
