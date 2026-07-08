import { BatteryFull, BatteryLow, BatteryMedium, BatteryWarning } from "lucide-react";

import { cn } from "@/lib/utils";

/** Four-bar signal strength indicator (0–4). The aria label is supplied by the
 * caller (already localized) so this stays a plain presentational component. */
export function SignalBars({
  strength,
  ariaLabel,
}: {
  strength: number;
  ariaLabel: string;
}) {
  return (
    <span className="inline-flex items-end gap-0.5" aria-label={ariaLabel}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-sm",
            i < strength ? "bg-status-normal" : "bg-border-strong/60",
          )}
          style={{ height: `${6 + i * 3}px` }}
        />
      ))}
    </span>
  );
}

/** Battery percentage with a level-aware icon and color. */
export function BatteryMeter({ percent }: { percent: number | null }) {
  if (percent === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const { Icon, color } =
    percent >= 60
      ? { Icon: BatteryFull, color: "text-status-normal" }
      : percent >= 40
        ? { Icon: BatteryMedium, color: "text-status-normal" }
        : percent >= 20
          ? { Icon: BatteryLow, color: "text-status-advisory" }
          : { Icon: BatteryWarning, color: "text-status-warning" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium", color)}>
      <Icon className="size-4" aria-hidden />
      {percent}%
    </span>
  );
}
