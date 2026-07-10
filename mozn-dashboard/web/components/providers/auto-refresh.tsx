"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { usePreferences } from "@/features/settings/use-preferences";
import type { RefreshInterval } from "@/features/settings/preferences";

// Refresh cadence → milliseconds. "off" disables auto-refresh.
const INTERVAL_MS: Record<RefreshInterval, number> = {
  off: 0,
  "30s": 30_000,
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
};

/**
 * Re-fetches the current route's server data on the operator's chosen cadence
 * (Settings → Live data → auto-refresh). Renders nothing. Mounted once in the
 * dashboard shell so it applies to whatever screen is open. Pauses while the tab
 * is hidden so a backgrounded dashboard doesn't poll needlessly.
 */
export function AutoRefresh() {
  const router = useRouter();
  const { refreshInterval } = usePreferences();

  React.useEffect(() => {
    const ms = INTERVAL_MS[refreshInterval] ?? 0;
    if (!ms) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, ms);
    return () => window.clearInterval(id);
  }, [refreshInterval, router]);

  return null;
}
