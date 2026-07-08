"use client";

import * as React from "react";
import { Check, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useT } from "@/components/providers/locale-provider";

export interface FacetedOption {
  value: string;
  label: string;
  /** Optional facet count shown at the end of the row. */
  count?: number;
  /** Optional status dot (Tailwind bg-* class) shown before the label. */
  dot?: string;
}

/**
 * shadcn-style data-table faceted filter: a dashed outline button showing the
 * filter's title and the current selection as badges, opening a checkbox list
 * (each option with its count). Multi-select — an empty selection means "all".
 */
export function FacetedFilter({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: FacetedOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const t = useT();
  const selectedSet = new Set(selected);

  const toggle = (value: string) => {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange([...next]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <Filter className="size-4 text-muted-foreground" />
          {title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="max-h-72 overflow-auto p-1">
          {options.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("common.noResults")}
            </p>
          ) : (
            options.map((o) => {
              const isSelected = selectedSet.has(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  aria-pressed={isSelected}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-md border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input [&_svg]:invisible",
                    )}
                  >
                    <Check className="size-3.5" />
                  </span>
                  {o.dot ? (
                    <span
                      aria-hidden
                      className={cn("size-2 shrink-0 rounded-full", o.dot)}
                    />
                  ) : null}
                  <span className="flex-1 text-start">{o.label}</span>
                  {o.count !== undefined ? (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {o.count}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
        {selected.length > 0 ? (
          <>
            <Separator />
            <div className="p-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full rounded-sm px-2 py-1.5 text-center text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                {t("common.clearFilters")}
              </button>
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
