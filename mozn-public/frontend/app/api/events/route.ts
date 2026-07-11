/**
 * GET /api/events — public Server-Sent Events proxy.
 *
 * Streams the backend's public alert feed to citizen browsers from this origin
 * (no CORS, no auth). The client connects with EventSource; on a confirmed/
 * resolved alert the page revalidates so the map updates live — no page reload.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const fetchCache = "force-no-store";

const API_BASE =
  process.env.MOZN_API_BASE ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://mozn.org.ly/api";

export async function GET(req: Request) {
  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/public/events`, {
      headers: { Accept: "text/event-stream" },
      cache: "no-store",
      signal: req.signal, // client disconnect → backend closes the stream
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
