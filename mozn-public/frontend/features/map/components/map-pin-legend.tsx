"use client";

import { cn } from "@/components/lib/cn";
import { useT } from "@/components/state/lang-context";

import { pinColorFor, type PinKind } from "../lib/pin-status";

type MapPinLegendProps = {
  readonly className?: string;
};

/**
 * The three-status key from the Figma design system (Map Pin / Legend
 * 386:17): Normal · Warning · Offline. Colours bind to the same semantic
 * tokens as the pins, so the key stays in sync across light/dark. Active
 * alerts still colour individual pins by finer severity (yellow/orange/red)
 * via `pinKindFor`; the legend groups those under "Warning".
 */
export function MapPinLegend({ className }: MapPinLegendProps) {
  const t = useT();
  const items: ReadonlyArray<{ kind: PinKind; label: string }> = [
    { kind: "normal", label: t.legendNormal },
    { kind: "warning", label: t.legendWarning },
    { kind: "offline", label: t.legendOffline },
  ];
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-x-[12px] gap-y-[6px] md:gap-x-[16px] lg:gap-x-[20px] px-[12px] md:px-[16px] lg:px-[20px] py-[8px] md:py-[8px] lg:py-[12px] rounded-[12px] lg:rounded-[16px]",
        "bg-(--color-bg-primary) border border-solid border-(--color-border-subtle)",
        "shadow-[0_2px_4px_0_rgba(33,41,51,0.06)]",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.kind} className="inline-flex items-center gap-[8px]">
          <span
            className="size-[8px] md:size-[10px] lg:size-[12px] rounded-full"
            style={{ backgroundColor: pinColorFor(item.kind) }}
          />
          <span className="text-body-xs lg:text-body-sm font-medium text-(--color-text-primary)">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
