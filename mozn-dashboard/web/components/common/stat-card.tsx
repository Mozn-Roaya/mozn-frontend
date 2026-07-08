import * as React from "react";
import Link from "next/link";
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatTone =
  | "neutral"
  | "ok"
  | "danger"
  | "warning"
  | "advisory"
  | "watch"
  | "offline";

const TONE: Record<StatTone, { chip: string; value: string }> = {
  neutral: { chip: "bg-accent text-accent-foreground", value: "text-foreground" },
  ok: { chip: "bg-status-normal/10 text-status-normal", value: "text-status-normal" },
  danger: { chip: "bg-status-warning/10 text-status-warning", value: "text-status-warning" },
  warning: { chip: "bg-status-warning/10 text-status-warning", value: "text-status-warning" },
  advisory: { chip: "bg-status-advisory/10 text-status-advisory", value: "text-foreground" },
  watch: { chip: "bg-text-link/10 text-text-link", value: "text-foreground" },
  offline: { chip: "bg-status-offline/15 text-muted-foreground", value: "text-foreground" },
};

/**
 * Shared KPI / status tile: uppercase label + tinted icon chip over a large
 * tabular figure, with either a hint line or a progress bar. Used by the
 * dashboard status strip and the Alert History summary so both stay identical.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  /** Muted suffix after the value, e.g. "/ 153". */
  suffix,
  hint,
  tone = "neutral",
  /** 0–100; renders a progress bar in place of the hint. */
  progress,
  /** Optional drill-down: renders the whole tile as a link to this route. */
  href,
  /** Signed change vs the previous period; shown as a small trend indicator. */
  delta,
  /** Accessible/tooltip description of the delta, e.g. "2 more than yesterday". */
  deltaLabel,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  suffix?: string;
  hint?: string;
  tone?: StatTone;
  progress?: number;
  href?: string;
  delta?: number;
  deltaLabel?: string;
}) {
  const t = TONE[tone];
  const DeltaIcon = delta == null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn("grid size-8 shrink-0 place-items-center rounded-lg", t.chip)}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1 text-2xl font-bold leading-none tabular-nums">
        <span className={t.value}>{value}</span>
        {suffix ? (
          <span className="text-base font-semibold text-muted-foreground">{suffix}</span>
        ) : null}
        {DeltaIcon ? (
          // Neutral (muted) trend indicator — direction only, no good/bad colour,
          // so it never conflicts with a metric's polarity (more offline ≠ good).
          <span
            className="ms-auto inline-flex items-center gap-0.5 self-center text-xs font-medium text-muted-foreground"
            title={deltaLabel}
          >
            <DeltaIcon className="size-3.5" aria-hidden />
            <span className="tabular-nums">{Math.abs(delta!)}</span>
            {deltaLabel ? <span className="sr-only">{deltaLabel}</span> : null}
          </span>
        ) : null}
      </p>
      {progress != null ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-chart-track" aria-hidden>
          <div
            className="h-full rounded-full bg-status-normal transition-all"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : hint ? (
        <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </>
  );

  const base =
    "block rounded-2xl border border-border bg-card p-4 shadow-card transition-colors hover:border-border-strong";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}
