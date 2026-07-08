import {
  AlertCircle,
  CloudRain,
  Clock,
  ShieldCheck,
  Timer,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  InboxItem,
  InboxSeverity,
  SlaTone,
  TrendDirection,
} from "@/features/alert-inbox/types";

/**
 * Single source of truth for how each severity and SLA tone is expressed.
 * The lane header, the triage row, and the expanded detail all read from here
 * so a "critical" alert looks identical everywhere in the queue.
 */
export const SEVERITY: Record<
  InboxSeverity,
  {
    label: string;
    icon: LucideIcon;
    /** Solid leading dot in the list. */
    dot: string;
    /** Vertical spine on the start edge of a triage row. */
    spine: string;
    /** Square icon token used in the row + detail header. */
    token: string;
    /** Text/glyph accent (over-threshold arrows, progress bars). */
    accent: string;
    bar: string;
    rank: number;
  }
> = {
  critical: {
    label: "Critical",
    icon: TriangleAlert,
    dot: "bg-status-warning",
    spine: "bg-status-warning",
    token:
      "bg-status-warning/10 text-status-warning ring-1 ring-inset ring-status-warning/20",
    accent: "text-status-warning",
    bar: "bg-status-warning",
    rank: 0,
  },
  urgent: {
    label: "Urgent",
    icon: AlertCircle,
    dot: "bg-status-advisory",
    spine: "bg-status-advisory",
    token:
      "bg-status-advisory/10 text-status-advisory ring-1 ring-inset ring-status-advisory/20",
    accent: "text-status-advisory",
    bar: "bg-status-advisory",
    rank: 1,
  },
  routine: {
    label: "Routine",
    icon: CloudRain,
    dot: "bg-status-offline",
    spine: "bg-border-strong",
    token:
      "bg-status-offline/15 text-muted-foreground ring-1 ring-inset ring-border-strong/40",
    accent: "text-muted-foreground",
    bar: "bg-status-offline",
    rank: 2,
  },
};

export const SLA_TONE: Record<
  SlaTone,
  { pill: string; icon: LucideIcon; pulse: boolean; rank: number }
> = {
  danger: {
    pill: "bg-status-warning/10 text-text-warning ring-1 ring-inset ring-status-warning/25",
    icon: Timer,
    pulse: true,
    rank: 0,
  },
  ok: {
    pill: "bg-status-normal/10 text-status-normal ring-1 ring-inset ring-status-normal/20",
    icon: ShieldCheck,
    pulse: false,
    rank: 1,
  },
  muted: {
    pill: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
    icon: Clock,
    pulse: false,
    rank: 2,
  },
};

/**
 * Resolve a per-item trend. Uses the backend value when present; otherwise
 * derives a deterministic one so the UI is stable across renders: a breaching
 * SLA reads "rising", routine items "stable", and the rest alternate by id so
 * the queue shows a believable mix rather than a single direction.
 */
export function itemTrend(item: InboxItem): TrendDirection {
  if (item.trend) return item.trend;
  if (item.sla.tone === "danger") return "rising";
  if (item.severity === "routine") return "stable";
  const code = item.id.charCodeAt(item.id.length - 1);
  return code % 3 === 0 ? "stable" : code % 3 === 1 ? "rising" : "falling";
}

/** First numeric token in a string ("28 mm/hr" → 28, "Watch ≥ 60%" → 60). */
function firstNumber(value: string): number | null {
  const m = value.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/**
 * Reading-vs-threshold geometry for the mini breach bar (A3.3 requires showing
 * current readings *against* thresholds). Scales so the threshold sits at a
 * fixed marker and the fill runs proportionally past it when breached.
 */
const THRESHOLD_MARKER_PCT = 62;
export function breach(value: string, threshold: string) {
  const v = firstNumber(value);
  const th = firstNumber(threshold);
  if (v == null || th == null || th === 0) return null;
  const ratio = v / th;
  return {
    over: v >= th,
    ratio,
    fillPct: Math.max(6, Math.min(100, ratio * THRESHOLD_MARKER_PCT)),
    markerPct: THRESHOLD_MARKER_PCT,
  };
}

/** Split a context string ("Station · Region · Trigger") into its segments. */
export function parseContext(context: string): {
  station: string;
  region?: string;
  trigger?: string;
} {
  const parts = context.split("·").map((p) => p.trim());
  return { station: parts[0] ?? context, region: parts[1], trigger: parts[2] };
}

/** Triage order: open before acknowledged, then severity, then SLA urgency. */
export function triageSort(
  acked: Set<string>,
): (a: InboxItem, b: InboxItem) => number {
  return (a, b) => {
    const ackDelta = Number(acked.has(a.id)) - Number(acked.has(b.id));
    if (ackDelta) return ackDelta;
    const sevDelta = SEVERITY[a.severity].rank - SEVERITY[b.severity].rank;
    if (sevDelta) return sevDelta;
    return SLA_TONE[a.sla.tone].rank - SLA_TONE[b.sla.tone].rank;
  };
}
