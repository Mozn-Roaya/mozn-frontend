"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

/**
 * Subscribes to the public real-time alert stream (via the same-origin
 * /api/events proxy) and revalidates the page when an alert is confirmed or
 * resolved, so the map's pins update live without a reload. Event-driven — it
 * only refetches when something actually changes. EventSource auto-reconnects.
 */
export function EventsListener() {
  const router = useRouter();

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retries = 0;
    let stopped = false; // set on unmount so a pending reconnect is cancelled

    const connect = () => {
      es = new EventSource("/api/events");

      es.onopen = () => {
        retries = 0; // healthy stream — reset the backoff
      };

      es.onmessage = (ev) => {
        let msg: { type?: string };
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (!msg?.type?.startsWith("alert.")) return;
        // Coalesce a burst into one refresh.
        if (timer) return;
        timer = setTimeout(() => {
          timer = null;
          router.refresh();
        }, 1000);
      };

      es.onerror = () => {
        // A transient drop leaves readyState=CONNECTING and EventSource
        // reconnects itself. A non-2xx (e.g. 502 while the backend restarts) sets
        // readyState=CLOSED and it gives up for good — reconnect manually with
        // capped exponential backoff so the live map self-heals.
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
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return null;
}
