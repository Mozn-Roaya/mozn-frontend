"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";

export type SortDir = "asc" | "desc";

export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

/** Toggle helper: re-clicking a column flips direction; a new column starts ascending. */
export function nextSort<K extends string>(
  prev: SortState<K>,
  key: K,
): SortState<K> {
  return prev.key === key
    ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
    : { key, dir: "asc" };
}

/**
 * Sortable column header used across every data table (Stations, Users,
 * Alert history). Renders the correct chevron and exposes `aria-sort` so the
 * sort state is announced to screen readers.
 *
 * Alignment is always to the start edge (the system-wide table convention), so
 * the header label lines up with its start-aligned body cells in both LTR and
 * RTL. Action columns, which sit at the end, use a plain `TableHead`, not this.
 */
export function SortableHead<K extends string>({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = sort.key === column;
  const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={className}
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon
          className={cn("size-3.5 shrink-0", !active && "opacity-60")}
          aria-hidden
        />
      </button>
    </TableHead>
  );
}
