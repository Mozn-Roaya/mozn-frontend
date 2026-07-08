import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface SectionCardProps extends React.ComponentProps<typeof Card> {
  title: string;
  description?: string;
  /** Optional leading icon — rendered in a tinted chip to anchor the section. */
  icon?: LucideIcon;
  /** Override the icon chip color (e.g. a warning tint). */
  iconClassName?: string;
  /** Slot rendered on the right of the header (badge, legend, link…). */
  action?: React.ReactNode;
  /** Slot rendered below the body (footer note / link). */
  footer?: React.ReactNode;
  bodyClassName?: string;
}

/**
 * Card with a consistent header (icon + title + optional description / action)
 * and optional footer. Used by every panel on the dashboard so spacing and
 * hierarchy stay uniform.
 */
export function SectionCard({
  title,
  description,
  icon: Icon,
  iconClassName,
  action,
  footer,
  children,
  className,
  bodyClassName,
  ...props
}: SectionCardProps) {
  return (
    <Card className={cn("flex flex-col", className)} {...props}>
      <div className="flex items-start justify-between gap-4 p-6 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground",
                iconClassName,
              )}
              aria-hidden
            >
              <Icon className="size-5" />
            </span>
          ) : null}
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-lg font-semibold leading-tight tracking-tight">{title}</h2>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={cn("flex-1 px-6", bodyClassName)}>{children}</div>

      {footer ? (
        <div className="mt-auto border-t border-border-subtle px-6 py-3.5">{footer}</div>
      ) : (
        <div className="pb-6" />
      )}
    </Card>
  );
}
