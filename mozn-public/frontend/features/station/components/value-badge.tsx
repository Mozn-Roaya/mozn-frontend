import * as React from "react";

/**
 * Small muted pill that qualifies the value next to it — currently only
 * "Estimated" / "تقديري" on offline stations.
 *
 * Shared by `TemperatureCard` and `WeatherMetric` so the mark reads identically
 * on every surface: a reader who sees it on one tile and not another would
 * reasonably conclude the unmarked one is a real reading.
 */
export function ValueBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-solid border-(--color-border-subtle) bg-(--color-bg-secondary) px-[6px] py-[1px] text-body-xxs font-medium text-(--color-text-muted)">
      {label}
    </span>
  );
}
