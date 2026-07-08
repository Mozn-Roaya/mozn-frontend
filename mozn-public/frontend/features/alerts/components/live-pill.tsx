import { cn } from "@/components/lib/cn";
import { getDict, type Lang } from "@/components/lib/i18n";

import { severityClasses } from "../lib/severity";

import type { Severity } from "../lib/severity";

type LivePillProps = {
  readonly severity: Severity;
  readonly className?: string;
  readonly lang?: Lang;
};

export function LivePill({ severity, className, lang = "en" }: LivePillProps) {
  const t = getDict(lang);
  const accent = severityClasses(severity).accent.split(" ").find((c) => c.startsWith("bg-"));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-full",
        accent,
        className,
      )}
      role="status"
      aria-label={t.live}
    >
      <span className="size-[5px] rounded-full bg-(--color-text-inverse)" />
      <span className="text-[9px] tracking-[0.9px] uppercase font-semibold text-(--color-text-inverse)">
        {t.live}
      </span>
    </span>
  );
}
