"use client";

import * as React from "react";
import { CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";

type ToastTone = "success" | "info";
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  duration: number;
}

// Tiny module-level store so `toast()` can be called from anywhere without
// threading a context through the tree. A single <Toaster /> subscribes via
// useSyncExternalStore; each card owns its own dismiss timer (so it can pause on
// hover).
let toasts: Toast[] = [];
let listeners: Array<() => void> = [];
let seq = 0;

function emit() {
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners = [...listeners, onChange];
  return () => {
    listeners = listeners.filter((l) => l !== onChange);
  };
}

// `toasts` is only ever replaced with a new array (never mutated), so returning
// it directly is a stable snapshot for useSyncExternalStore. Empty on the server.
function getSnapshot() {
  return toasts;
}

function remove(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(message: string, tone: ToastTone = "success", duration = 4000) {
  const id = ++seq;
  toasts = [...toasts, { id, message, tone, duration }];
  emit();
}

// Drop every pending toast. The store is module-level, so a toast fired just
// before navigating away from the shell (e.g. sign-out) would otherwise linger
// and re-appear once a <Toaster/> next mounts. Call this at session boundaries
// (login) to start clean.
export function clearToasts() {
  if (toasts.length === 0) return;
  toasts = [];
  emit();
}

// Tinted status chip per tone — the same icon-chip language the dashboard uses
// in dialog headers and settings section heads, so a toast reads as part of the
// system rather than a foreign pill.
const TONE: Record<ToastTone, { Icon: typeof Info; chip: string }> = {
  success: { Icon: CheckCircle2, chip: "bg-status-normal/10 text-status-normal" },
  info: { Icon: Info, chip: "bg-text-link/10 text-text-link" },
};

function ToastCard({ toast: t }: { toast: Toast }) {
  const { t: translate } = useLocale();
  const { Icon, chip } = TONE[t.tone];
  const [paused, setPaused] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  // Remaining lifetime, so hovering pauses the countdown instead of restarting it.
  const remaining = React.useRef(t.duration);

  const dismiss = React.useCallback(() => {
    setLeaving(true);
    setTimeout(() => remove(t.id), 260); // let the exit animation play out fully
  }, [t.id]);

  React.useEffect(() => {
    if (paused || leaving) return;
    const started = performance.now();
    const timer = setTimeout(dismiss, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= performance.now() - started;
    };
  }, [paused, leaving, dismiss]);

  return (
    // A mini status card: same rounded-2xl surface, hairline border, shadow and
    // tinted icon-chip the dashboard uses for dialog headers and section heads.
    // Content-width so short messages stay compact; pops in from the top and
    // dissolves out on dismiss.
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-fit max-w-md items-center gap-3 rounded-2xl border border-border bg-popover p-2.5 pe-3 shadow-card",
        // Enter: drop in from above with a fade + overshoot-free settle
        // (easeOutExpo). Exit: a soft dissolve — fade + gentle shrink in place
        // on a smooth ease-out, holding the faded end state until unmount so it
        // never flickers back. No upward slide (that read as being yanked away).
        // Both gated on motion-safe: reduced-motion users get an instant toast.
        leaving
          ? "motion-safe:animate-out motion-safe:fade-out-0 motion-safe:zoom-out-95 motion-safe:duration-[250ms] motion-safe:ease-out motion-safe:fill-mode-forwards"
          : "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-top-4 motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", chip)}>
        <Icon className="size-5" aria-hidden />
      </span>

      <span className="text-sm font-medium text-popover-foreground">{t.message}</span>

      <button
        type="button"
        onClick={dismiss}
        aria-label={translate("common.close")}
        className="-me-1 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const items = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    // Top-centre, clear of the sticky top bar — keeps confirmations away from the
    // bottom "unsaved changes" save bar (Settings). Centred, so it reads the same
    // in LTR and RTL. Pills size to their content and stack centred.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {items.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
