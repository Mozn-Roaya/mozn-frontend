import * as React from "react";

import { cn } from "../lib/cn";

type SectionProps = {
  title: string;
  description: string;
  count: string;
  children: React.ReactNode;
  className?: string;
};

export function Section({ title, description, count, children, className }: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-[20px]", className)}>
      <div className="flex items-start justify-between gap-[40px]">
        <div className="flex flex-col gap-[8px] max-w-[720px]">
          <h2 className="text-heading-md font-semibold text-(--color-text-primary) m-0">
            {title}
          </h2>
          <p className="text-body-xs text-(--color-text-secondary) m-0">
            {description}
          </p>
        </div>
        <span className="shrink-0 mt-[5px] text-label-sm font-semibold uppercase text-(--color-text-muted)">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

type CellProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Cell({ label, children, className, contentClassName }: CellProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-[16px]",
        "rounded-[12px] bg-(--color-bg-primary)",
        "border border-solid border-(--color-border-subtle)",
        "pt-[24px] pb-[16px] px-[16px] overflow-hidden",
        className,
      )}
    >
      <div className={cn("flex flex-1 items-center justify-center", contentClassName)}>
        {children}
      </div>
      <span className="text-body-xs font-medium text-(--color-text-secondary) text-center">
        {label}
      </span>
    </div>
  );
}
