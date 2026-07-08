"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useT } from "@/components/providers/locale-provider";

type SelectionBarProps = {
  /** Number of selected rows. The bar is hidden when this is 0. */
  count: number;
  /** Clears the current selection. */
  onClear: () => void;
  /** Optional bulk-action buttons rendered before the Clear control. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * Contextual selection toolbar shown while table rows are selected. Renders
 * inline as a muted strip at the top of the table (inside the card), styled the
 * shadcn/ui way: neutral surface, a secondary Badge for the count, a vertical
 * Separator, and ghost controls. Shared across every data table.
 */
export function SelectionBar({ count, onClear, children, className }: SelectionBarProps) {
  const t = useT();

  if (count <= 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center gap-2 border-b bg-muted/50 px-4 py-2",
        "duration-200 animate-in fade-in slide-in-from-top-1 motion-reduce:animate-none",
        className,
      )}
    >
      <Badge variant="secondary" className="rounded-md tabular-nums">
        {t("common.selected", { count })}
      </Badge>

      {children ? (
        <>
          <Separator orientation="vertical" className="mx-0.5 h-5" />
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        </>
      ) : null}

      <Button
        size="icon"
        variant="ghost"
        className="ms-auto size-8 text-muted-foreground"
        onClick={onClear}
        aria-label={t("common.clear")}
        title={t("common.clear")}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
