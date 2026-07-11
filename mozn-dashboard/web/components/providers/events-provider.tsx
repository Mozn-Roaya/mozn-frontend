"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toaster";
import { useT, useTD } from "@/components/providers/locale-provider";
import { paramLabel } from "@/lib/mappers";
import { hydrateNotifs, pushAlertNotif } from "@/components/layout/notifications-store";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface AlertEventData {
  id: string;
  station_id?: string;
  region_id?: string;
  severity: string;
  parameter: string;
  message: string;
  message_ar: string;
  status: string;
  issued_at: string;
}
interface AlertEvent {
  type: string;
  data: AlertEventData;
}

/**
 * Opens the real-time SSE stream (via the same-origin /api/events proxy) and
 * turns alert events into (1) a toast, (2) a bell-menu notification, and (3) a
 * router.refresh() so whatever screen is open pulls in the new data. Event-driven
 * — it revalidates only when something actually happens, not on a poll timer.
 * EventSource auto-reconnects on drop, so no manual retry loop is needed.
 */
export function EventsProvider() {
  const router = useRouter();
  const t = useT();
  const td = useTD();

  // Coalesce a burst of events into a single refresh (a storm shouldn't fire a
  // dozen refetches). Keep the latest callbacks in a ref so the effect can stay
  // mounted for the session without reconnecting on every render.
  const refreshTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep the latest router/translators in a ref so the long-lived EventSource
  // effect (mounted once, below) always uses the current locale without
  // reconnecting on every render. Updated in an effect, never during render.
  const cbRef = React.useRef({ router, t, td });
  React.useEffect(() => {
    cbRef.current = { router, t, td };
  });

  React.useEffect(() => {
    // Restore persisted notifications so the bell survives reloads/navigation.
    hydrateNotifs();

    const scheduleRefresh = () => {
      if (refreshTimer.current) return;
      refreshTimer.current = setTimeout(() => {
        refreshTimer.current = null;
        cbRef.current.router.refresh();
      }, 800);
    };

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retries = 0;
    let stopped = false; // set on unmount so a pending reconnect is cancelled

    const connect = () => {
      es = new EventSource(`${BASE}/api/events`);

      es.onopen = () => {
        retries = 0; // healthy stream — reset the backoff
      };

      es.onmessage = (ev) => {
        let msg: AlertEvent;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (!msg?.type?.startsWith("alert.")) return;

        if (msg.type === "alert.created" || msg.type === "alert.confirmed") {
          // Dedupe by alert id: created→confirmed is one alert, so toast + notify
          // once (pushAlertNotif returns false if this id is already in the bell).
          const added = pushAlertNotif({
            id: msg.data.id,
            type: msg.type,
            severity: msg.data.severity,
            parameter: msg.data.parameter,
            message: msg.data.message,
            messageAr: msg.data.message_ar,
            issuedAt: msg.data.issued_at,
          });
          if (added) {
            const { t: tt, td: ttd } = cbRef.current;
            const label = ttd(paramLabel(msg.data.parameter));
            toast(tt("events.newAlert", { param: label }), "info");
          }
        }
        // Any alert event (create/confirm/resolve/update) can change the lists +
        // badge counts on the open screen — pull fresh server data.
        scheduleRefresh();
      };

      es.onerror = () => {
        // A transient drop leaves readyState=CONNECTING and EventSource
        // reconnects itself. A non-2xx response (401 on token expiry, 502 when
        // the backend is down) sets readyState=CLOSED and it gives up for good —
        // reconnect manually with capped exponential backoff so realtime
        // self-heals once auth/backend recover instead of dying silently.
        if (!es || es.readyState !== EventSource.CLOSED || stopped) return;
        es.close();
        const delay = Math.min(30_000, 1_000 * 2 ** retries);
        retries += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  return null;
}
