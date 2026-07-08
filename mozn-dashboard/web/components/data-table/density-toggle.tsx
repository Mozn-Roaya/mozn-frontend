"use client";

import * as React from "react";
import { Rows2, Rows3 } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useT } from "@/components/providers/locale-provider";

export type Density = "comfortable" | "compact";

/** Row-padding utility class for the chosen density (applied to each TableRow). */
export const rowPadFor = (density: Density) =>
  density === "compact" ? "[&>td]:py-1.5" : "[&>td]:py-3";

/** Comfortable/compact row-height switch, shared across every data table. */
export function DensityToggle({
  value,
  onChange,
}: {
  value: Density;
  onChange: (density: Density) => void;
}) {
  const t = useT();
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as Density)}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="comfortable" aria-label={t("common.comfortable")}>
        <Rows2 className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" aria-label={t("common.compact")}>
        <Rows3 className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
