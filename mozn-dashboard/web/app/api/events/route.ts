import { cookies } from "next/headers";

/**
 * GET /dashboard/api/events — Server-Sent Events proxy.
 *
 * EventSource can't send an Authorization header, and the JWT lives in an
 * httpOnly cookie on this origin — so the browser connects here and this handler
 * attaches the Bearer token and streams the backend's SSE feed straight through.
 * Auth stays server-side; the client just gets a same-origin event stream.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const fetchCache = "force-no-store";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";
const SESSION_COOKIE = "mozn_dash_token";

export async function GET(req: Request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return new Response("unauthorized", { status: 401 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/api/events`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
      cache: "no-store",
      // Propagate client disconnect → backend closes the stream (context done).
      signal: req.signal,
    });
  } catch {
    return new Response("upstream unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("upstream error", { status: upstream.status || 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
