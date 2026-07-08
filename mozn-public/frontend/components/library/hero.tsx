import * as React from "react";

const stats: Array<[string, string]> = [
  ["16", "Total"],
  ["5", "Foundations"],
  ["1", "Controls"],
  ["5", "Map"],
  ["1", "Alerts"],
  ["4", "Panels"],
];

export function Hero() {
  return (
    <section className="flex flex-col gap-[12px]">
      <p className="text-label-md font-semibold uppercase text-(--color-text-muted) m-0">
        MOZN Design System · Basic Components
      </p>
      <h1 className="text-display-xl font-bold text-(--color-text-primary) m-0">
        Components.
      </h1>
      <p className="max-w-[780px] text-body-md text-(--color-text-secondary) m-0">
        Building blocks for the early warning dashboard — organized atomic-style
        from primitive icons up to composed dashboard panels. Every component is
        token-bound for automatic dark-mode support.
      </p>
      <dl className="flex gap-[32px] m-0">
        {stats.map(([value, label]) => (
          <div key={label} className="flex flex-col gap-[2px]">
            <dt className="sr-only">{label}</dt>
            <dd className="text-heading-md font-semibold text-(--color-text-primary) m-0">
              {value}
            </dd>
            <span className="text-label-sm font-semibold uppercase text-(--color-text-muted)">
              {label}
            </span>
          </div>
        ))}
      </dl>
    </section>
  );
}
