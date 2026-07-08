import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.MOZN_API_BASE ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://mozn.org.ly/api";

export const dynamic = "force-dynamic";

async function forward(req: NextRequest, path: string[]) {
  const search = req.nextUrl.search;
  const target = `${API_BASE}/${path.join("/")}${search}`;
  const isReadOnly = req.method === "GET" || req.method === "HEAD";

  const init: RequestInit = {
    method: req.method,
    headers: {
      Accept: req.headers.get("accept") ?? "application/json",
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    cache: "no-store",
  };

  if (!isReadOnly) {
    init.body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const body = await upstream.arrayBuffer();
    // Only cache successful reads. The /public/* endpoints carry no auth,
    // so a shared CDN cache is safe; mutations and errors stay no-store.
    const cacheControl =
      isReadOnly && upstream.ok
        ? "public, s-maxage=60, stale-while-revalidate=300"
        : "no-store";
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": cacheControl,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "upstream_unreachable", message: String(err) },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
