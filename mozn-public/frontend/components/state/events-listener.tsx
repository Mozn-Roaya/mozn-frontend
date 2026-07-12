"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useLang, useT } from "./lang-context";
import { pickLang } from "../lib/i18n";

// Severity → accent colour, matching the map pins (features/map/lib/pin-status)
// so a toast reads with the same visual language as the pin that changed.
const SEVERITY_ACCENT: Record<string, string> = {
  yellow: "var(--color-severity-yellow-500)",
  orange: "var(--color-severity-orange-500)",
  red: "var(--color-severity-red-500)",
};
// Informational accent for "cleared" alerts + station status toasts.
const INFO_ACCENT = "var(--color-brand-blue-500)";

const TOAST_TTL_MS = 6000; // auto-dismiss
const MAX_TOASTS = 4; // cap the stack; oldest drops off

type Toast = {
  id: number;
  title: string;
  body: string;
  accent: string;
};

/**
 * Subscribes to the public real-time stream (via the same-origin /api/events
 * proxy) and, when something changes:
 *   1. revalidates the page so the map's pins/labels update live, and
 *   2. surfaces a brief toast so a viewer notices *what* changed — a new or
 *      cleared alert, or a station status change (e.g. → maintenance).
 * Event-driven; EventSource auto-reconnects, with manual capped-backoff retry
 * for the CLOSED (non-2xx) case so the live map self-heals across API restarts.
 */
export function EventsListener() {
  const router = useRouter();
  const t = useT();
  const lang = useLang();

  const [toasts, setToasts] = React.useState<Toast[]>([]);

  // Read the current dict/lang from refs inside the SSE handler so a language
  // toggle re-labels FUTURE toasts without tearing down and reconnecting the
  // stream (the effect intentionally depends only on `router`).
  const tRef = React.useRef(t);
  const langRef = React.useRef(lang);
  React.useEffect(() => {
    tRef.current = t;
    langRef.current = lang;
  }, [t, lang]);

  const idRef = React.useRef(0);
  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retries = 0;
    let stopped = false; // set on unmount so a pending reconnect is cancelled

    // Build a toast for a toast-worthy event, or null to stay silent.
    const toastFor = (
      type: string,
      data: Record<string, unknown>,
    ): Omit<Toast, "id"> | null => {
      const T = tRef.current;
      const L = langRef.current;

      if (type.startsWith("alert.")) {
        const cleared = type.endsWith("resolved") || data.status === "resolved";
        const sev = typeof data.severity === "string" ? data.severity : "";
        return {
          title: cleared ? T.toastWarningCleared : T.toastNewWarning,
          body: pickLang(
            L,
            data.message as string | undefined,
            data.message_ar as string | undefined,
          ),
          accent: cleared ? INFO_ACCENT : (SEVERITY_ACCENT[sev] ?? SEVERITY_ACCENT.orange),
        };
      }

      if (type.startsWith("station.")) {
        // Only a real operational-status transition warrants a toast; other
        // edits (name/coords) still refresh the map, but silently.
        if (!data.status_changed) return null;
        const status = typeof data.status === "string" ? data.status : "";
        const phrase =
          status === "maintenance"
            ? T.toastStatusMaintenance
            : status === "active"
              ? T.toastStatusRestored
              : status === "deactivated"
                ? T.toastStatusDeactivated
                : "";
        if (!phrase) return null;
        const name = pickLang(
          L,
          data.name as string | undefined,
          data.name_ar as string | undefined,
        );
        return {
          title: name || (L === "ar" ? "محطة" : "Station"),
          body: phrase,
          accent: INFO_ACCENT,
        };
      }

      return null;
    };

    const connect = () => {
      es = new EventSource("/api/events");

      es.onopen = () => {
        retries = 0; // healthy stream — reset the backoff
      };

      es.onmessage = (ev) => {
        let msg: { type?: string; data?: Record<string, unknown> };
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        const type = msg?.type;
        // alert.* (new/confirmed/updated/resolved) AND station.* (e.g. a station
        // put into maintenance) both change the map — react to either.
        if (!type || (!type.startsWith("alert.") && !type.startsWith("station."))) return;

        // Notify: surface a toast (skips silently when not toast-worthy).
        const built = toastFor(type, msg.data ?? {});
        if (built) {
          const id = ++idRef.current;
          setToasts((prev) => [{ id, ...built }, ...prev].slice(0, MAX_TOASTS));
        }

        // Refresh: coalesce a burst into one revalidation.
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

  // The live region stays mounted (even when empty) so screen readers announce
  // toasts added to it. Positioned below the full-width top bar, clear of the
  // map controls (start side) and the status pill (bottom-end).
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[84px] z-[1100] flex flex-col items-center gap-[8px] px-[16px]"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          dismissLabel={t.toastDismiss}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  dismissLabel,
  onDismiss,
}: {
  toast: Toast;
  dismissLabel: string;
  onDismiss: (id: number) => void;
}) {
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    // Enter animation on the next frame; auto-dismiss after the TTL.
    const raf = requestAnimationFrame(() => setShown(true));
    const ttl = setTimeout(() => onDismiss(toast.id), TOAST_TTL_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(ttl);
    };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={[
        "pointer-events-auto flex w-full max-w-[380px] items-start gap-[12px]",
        "rounded-[12px] border border-solid border-(--color-border-subtle)",
        "bg-(--color-bg-primary) px-[12px] py-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
        "transition-all duration-200 ease-out motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "-translate-y-[8px] opacity-0",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="mt-[3px] h-[34px] w-[4px] shrink-0 rounded-full"
        style={{ backgroundColor: toast.accent }}
      />
      <div className="min-w-0 flex-1 text-start">
        <p className="truncate text-body-sm font-semibold text-(--color-text-primary)">
          {toast.title}
        </p>
        {toast.body ? (
          <p className="mt-[2px] line-clamp-2 text-body-xs text-(--color-text-secondary)">
            {toast.body}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-[6px] p-[4px] text-(--color-text-muted) transition-colors hover:bg-(--color-bg-secondary) hover:text-(--color-text-primary)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M3.5 3.5l7 7M10.5 3.5l-7 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
