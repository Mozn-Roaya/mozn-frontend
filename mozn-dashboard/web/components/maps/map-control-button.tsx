"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A standalone floating map control: a rounded, card-coloured square button.
 * Shared by the dashboard Station Health Map and the station location picker so
 * their controls look identical.
 */
export function MapControlButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid size-10 place-items-center rounded-xl border border-border bg-card text-foreground shadow-card transition-colors",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-muted",
      )}
    >
      {children}
    </button>
  );
}
