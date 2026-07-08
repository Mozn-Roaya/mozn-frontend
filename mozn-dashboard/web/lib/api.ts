import "server-only";

import type { DashboardOverview } from "@/types/dashboard";
import type { StationsPage } from "@/types/stations";
import type { AlertInboxPage } from "@/types/alert-inbox";
import type { ThresholdsPage } from "@/types/thresholds";
import type { UsersPage } from "@/types/users";
import type { AlertHistoryPage } from "@/types/history";
import type { ActivityLogPage } from "@/types/activity";
import type { SettingsPage } from "@/types/settings";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

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

/**
 * Server-side fetch helper. Centralizes base URL, JSON parsing and error
 * normalization so route/page code stays declarative.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
      // The dashboard reflects live operational state — always fresh.
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Is the Go backend running?`,
      undefined,
      { cause },
    );
  }

  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed`, res.status);
  }

  return (await res.json()) as T;
}

export function getDashboardOverview(): Promise<DashboardOverview> {
  return apiFetch<DashboardOverview>("/api/v1/dashboard/overview");
}

export function getStations(): Promise<StationsPage> {
  return apiFetch<StationsPage>("/api/v1/stations");
}

export function getAlertInbox(): Promise<AlertInboxPage> {
  return apiFetch<AlertInboxPage>("/api/v1/alert-inbox");
}

export function getThresholds(): Promise<ThresholdsPage> {
  return apiFetch<ThresholdsPage>("/api/v1/thresholds");
}

export function getUsers(): Promise<UsersPage> {
  return apiFetch<UsersPage>("/api/v1/users");
}

export function getAlertHistory(): Promise<AlertHistoryPage> {
  return apiFetch<AlertHistoryPage>("/api/v1/history/alerts");
}

export function getActivityLog(): Promise<ActivityLogPage> {
  return apiFetch<ActivityLogPage>("/api/v1/history/activity");
}

export function getSettings(): Promise<SettingsPage> {
  return apiFetch<SettingsPage>("/api/v1/settings");
}
