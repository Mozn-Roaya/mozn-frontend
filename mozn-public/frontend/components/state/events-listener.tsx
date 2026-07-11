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

    const es = new EventSource("/api/events");
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
      // Transient drop — EventSource reconnects on its own.
    };

    return () => {
      es.close();
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return null;
}
