"use client";

import Link from "next/link";
import { Activity, ArrowRight, ChevronRight, ShieldCheck, Siren, TriangleAlert, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { useT, useTD } from "@/components/providers/locale-provider";
import type { AttentionItem, NeedsAttention as NeedsAttentionData } from "@/features/dashboard/types";
import { SectionCard } from "./section-card";
import { ATTENTION_SEVERITY } from "../lib/status";

const SEVERITY_ICON = {
  warning: TriangleAlert,
  advisory: Activity,
  offline: WifiOff,
} as const;

function AttentionRow({ item }: { item: AttentionItem }) {
  const td = useTD();
  const Icon = SEVERITY_ICON[item.severity];
  const severity = ATTENTION_SEVERITY[item.severity];

  return (
    <li>
      <Link
        href="/alert-inbox"
        className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-start transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            severity.chipClass,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{td(item.title)}</p>
          <p className="truncate text-xs text-muted-foreground">{td(item.meta)}</p>
        </div>
        {/* Elapsed as a subtle time pill. */}
        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {td(item.elapsed)}
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground rtl:rotate-180"
          aria-hidden
        />
      </Link>
    </li>
  );
}

export function NeedsAttention({ data }: { data: NeedsAttentionData }) {
  const t = useT();
  return (
    <SectionCard
      icon={Siren}
      iconClassName="bg-status-warning/10 text-status-warning"
      title={t("dashboard.needsAttention.title")}
      action={
        <Badge variant="warning">
          {t("dashboard.needsAttention.open", { count: data.openCount })}
        </Badge>
      }
      bodyClassName="px-6"
      footer={
        <Link
          href="/alert-inbox"
          className="group flex w-full items-center justify-center gap-1.5 rounded-md py-0.5 text-sm font-semibold text-text-link transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("dashboard.needsAttention.openInbox")}
          {/* Arrow nudges toward its destination on hover — right in LTR, left
              in RTL (where it's mirrored). Skipped for reduced-motion users. */}
          <ArrowRight
            className="size-4 transition-transform duration-200 rtl:rotate-180 motion-reduce:transition-none ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
            aria-hidden
          />
        </Link>
      }
    >
      {data.items.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t("dashboard.needsAttention.emptyTitle")}
          message={t("dashboard.needsAttention.empty")}
        />
      ) : (
        <ul className="divide-y divide-border-subtle">
          {data.items.map((item) => (
            <AttentionRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
