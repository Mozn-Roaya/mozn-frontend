import "server-only";

import { cookies } from "next/headers";

import type {
  BackendCurrentUser,
  BackendEnvelope,
  BackendLoginResult,
  BackendPaginationMeta,
} from "./backend-types";

/**
 * Low-level client for the real Go backend (mozn-backend). Server-only:
 * attaches the caller's JWT (from the httpOnly session cookie) as a Bearer
 * token, unwraps the `{ data, metadata }` envelope, and normalizes errors.
 * The presentation adapters live in `lib/api.ts`; this file is just transport.
 */

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/** httpOnly cookie holding the backend JWT. Path-scoped to the dashboard zone. */
export const SESSION_COOKIE = "mozn_dash_token";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

/** Thrown when the backend rejects the token (401) — pages redirect to login. */
export class AuthError extends ApiError {
  constructor(message = "Not authenticated") {
    super(message, 401);
    this.name = "AuthError";
  }
}

async function readToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

interface BackendFetchResult<T> {
  data: T;
  meta?: BackendPaginationMeta;
}

/**
 * Fetch a backend endpoint and return the unwrapped `data` (+ pagination meta).
 * Attaches the session JWT when present. `cache: "no-store"` — the dashboard
 * reflects live operational state. A 401 becomes an `AuthError` so callers can
 * bounce to the login screen; other non-2xx become `ApiError` with the status.
 */
export async function backendFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<BackendFetchResult<T>> {
  const token = await readToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Is the Go backend running?`,
      undefined,
      { cause },
    );
  }

  if (res.status === 401) {
    throw new AuthError();
  }
  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed`, res.status);
  }

  const body = (await res.json()) as BackendEnvelope<T>;
  return { data: body.data, meta: body.metadata };
}

/** Convenience: just the `data` payload, discarding pagination meta. */
export async function backendData<T>(path: string, init?: RequestInit): Promise<T> {
  return (await backendFetch<T>(path, init)).data;
}

/** Result of a mutation — carries the backend's own status + message so route
 * handlers can surface a specific error (e.g. the role-lockout guard, a 409
 * duplicate) rather than a generic one. Never throws for a non-2xx. */
export interface MutationResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  /** Human-readable text: the envelope `message` on success, or `error` on failure. */
  message?: string;
  /** Machine code from the envelope `code` (e.g. INVALID_STATE_TRANSITION), when present. */
  errorCode?: string;
}

/**
 * Perform a write against the backend and return its status + envelope message
 * instead of throwing. Attaches the JWT (from the cookie) and JSON headers.
 * A 401 still throws `AuthError` so pages can bounce to login; everything else
 * (400/403/404/409/…) is returned as `{ ok:false, status, message }`.
 */
export async function backendMutate<T = unknown>(
  path: string,
  init: RequestInit,
): Promise<MutationResult<T>> {
  const token = await readToken();

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: `Cannot reach the API at ${API_BASE_URL}. Is the Go backend running?`,
    };
  }

  if (res.status === 401) {
    throw new AuthError();
  }

  let body: BackendEnvelope<T> | undefined;
  try {
    body = (await res.json()) as BackendEnvelope<T>;
  } catch {
    /* some 2xx responses may carry no body */
  }

  // Envelope carries the human-readable text in `message` on success and in
  // `error` on failure; `code` holds the machine code (e.g. INVALID_STATE_TRANSITION).
  return {
    ok: res.ok,
    status: res.status,
    data: body?.data,
    message: body?.message ?? body?.error,
    errorCode: body?.code,
  };
}

/** GET /api/me — the signed-in user (identity + permissions + region scope). */
export function getCurrentUser(): Promise<BackendCurrentUser> {
  return backendData<BackendCurrentUser>("/api/me");
}

/**
 * POST /api/auth/login. Returns the JWT + user on success. Does NOT set the
 * cookie — the login route handler owns that (only route handlers/actions may
 * write cookies). Throws ApiError(401) on bad credentials.
 */
export async function loginToBackend(
  email: string,
  password: string,
): Promise<BackendLoginResult> {
  return backendData<BackendLoginResult>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}
