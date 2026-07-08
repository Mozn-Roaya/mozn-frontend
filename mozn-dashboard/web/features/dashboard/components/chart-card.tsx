import * as React from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * Quiet, data-forward panel for the analytics charts (Linear/Vercel register):
 * a small title + optional action, a hairline divider, then the content. No
 * icon chip or subtitle — the metric and the chart carry the meaning. Distinct
 * from `SectionCard` (which keeps the tinted icon chip for the work-queue and
 * activity panels).
 */
export function ChartCard({
  title,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-6 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("flex-1 p-6", contentClassName)}>{children}</div>
    </Card>
  );
}
