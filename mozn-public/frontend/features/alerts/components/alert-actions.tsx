import { cn } from "@/components/lib/cn";

import { severityClasses } from "../lib/severity";

import type { Severity } from "../lib/severity";

type AlertActionsProps = {
  readonly steps: readonly string[];
  readonly severity: Severity;
};

export function AlertActions({ steps, severity }: AlertActionsProps) {
  const classes = severityClasses(severity);
  const badgeSurface = classes.badge.split(" ").find((c) => c.startsWith("bg-"));

  return (
    <ol className="flex flex-col gap-[14px] w-full m-0 p-0 list-none">
      {steps.map((step, index) => (
        <li key={step} className="flex items-start gap-[12px] w-full">
          <span
            className={cn(
              "flex shrink-0 items-center justify-center size-[24px] rounded-[12px]",
              "text-body-xs font-semibold",
              badgeSurface,
              classes.badgeText,
            )}
            aria-hidden
          >
            {index + 1}
          </span>
          <p className="flex-1 min-w-px text-body-sm text-(--color-text-primary)">
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}
