import type { ApiEnvelope } from "./types";

/**
 * Base URL for the Mozn Weather API. Override via NEXT_PUBLIC_API_BASE.
 * Server-side fetches go direct; client-side fetches go through /api/proxy.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://mozn.org.ly/api";

const isServer = typeof window === "undefined";

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const qs = query
    ? "?" +
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  if (isServer) return `${API_BASE}${path}${qs}`;
  // Client side → go through Next proxy to dodge mixed-content / CORS.
  const stripped = path.startsWith("/") ? path.slice(1) : path;
  return `/api/proxy/${stripped}${qs}`;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | undefined>; revalidate?: number } = {},
): Promise<T> {
  const { query, revalidate, ...rest } = init;
  const url = buildUrl(path, query);
  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...rest.headers,
    },
    next: revalidate !== undefined ? { revalidate } : rest.next,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText} — ${path}\n${body}`);
  }
  const json = (await res.json()) as ApiEnvelope<T>;
  return json.data;
}

export async function apiFetchEnvelope<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | undefined>; revalidate?: number } = {},
): Promise<ApiEnvelope<T>> {
  const { query, revalidate, ...rest } = init;
  const url = buildUrl(path, query);
  const res = await fetch(url, {
    ...rest,
    headers: { Accept: "application/json", ...rest.headers },
    next: revalidate !== undefined ? { revalidate } : rest.next,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText} — ${path}\n${body}`);
  }
  return (await res.json()) as ApiEnvelope<T>;
}
