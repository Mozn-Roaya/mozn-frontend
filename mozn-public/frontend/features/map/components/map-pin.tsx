"use client";

import { cn } from "@/components/lib/cn";
import { type Dict } from "@/components/lib/i18n";
import { useT } from "@/components/state/lang-context";

import { PIN_HALO_OPACITY, pinColorFor, type PinKind } from "../lib/pin-status";

type MapPinProps = {
  /**
   * What the pin should communicate. Accepts both station status
   * (normal/warning/offline) and alert severity (yellow/orange/red) — see
   * `pinKindFor` to derive this from a `Station`.
   */
  readonly kind?: PinKind;
  readonly className?: string;
};

/** Localized status word for a pin kind — mirrors `hazardFor` so the dot's
 *  accessible name matches the hazard text shown on the map. */
function pinKindWord(kind: PinKind, t: Dict): string {
  switch (kind) {
    case "red":
      return t.pinSevere;
    case "orange":
      return t.pinWarning;
    case "yellow":
      return t.pinWatch;
    case "offline":
      return t.pinOffline;
    default:
      return t.pinNormal; // normal | warning
  }
}

export function MapPin({ kind = "normal", className }: MapPinProps) {
  const t = useT();
  const color = pinColorFor(kind);
  return (
    <span
      className={cn("relative inline-block size-[28px]", className)}
      // QA: localized accessible name (was a hardcoded-English "Station status:"
      // string with a raw severity token like "red").
      aria-label={t.pinStatusAria(pinKindWord(kind, t))}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: PIN_HALO_OPACITY }}
      />
      <span
        className="absolute left-1/2 top-1/2 size-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-(--color-bg-primary)"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}
