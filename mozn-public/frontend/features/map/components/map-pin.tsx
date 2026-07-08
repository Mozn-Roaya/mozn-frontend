import { cn } from "@/components/lib/cn";

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

export function MapPin({ kind = "normal", className }: MapPinProps) {
  const color = pinColorFor(kind);
  return (
    <span
      className={cn("relative inline-block size-[28px]", className)}
      aria-label={`Station status: ${kind}`}
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
