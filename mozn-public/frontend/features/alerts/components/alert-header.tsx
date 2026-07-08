import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/components/lib/cn";

import { LivePill } from "./live-pill";
import { SEVERITY_META } from "../lib/severity";

import type { Severity } from "../lib/severity";
import type { AlertLayout } from "../types";
import type { Lang } from "@/components/lib/i18n";

type AlertHeaderProps = {
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
  readonly layout: AlertLayout;
  /**
   * Optional small line between the description and the rest of the card —
   * used today to surface the alert's active time window or lead time.
   * Kept generic so future surfaces (e.g. "issued by" attribution) can pass
   * different content without growing the prop list.
   */
  readonly meta?: string;
  readonly lang?: Lang;
};

const SEVERITY_ICON_SIZE_PX = 22;
const CHEVRON_SIZE_PX = 16;

export function AlertHeader({
  title,
  description,
  severity,
  layout,
  meta,
  lang = "en",
}: AlertHeaderProps) {
  const severityMeta = SEVERITY_META[severity];
  const Icon = severityMeta.icon;
  const isCollapsed = layout === "collapsed";
  const iconTint = severityMeta.classes.accent
    .split(" ")
    .find((c) => c.startsWith("text-"));

  return (
    <header
      className={cn(
        "flex flex-col gap-[8px] w-full px-[20px] py-[18px]",
        severityMeta.classes.surface,
      )}
    >
      <div className="flex items-center justify-between w-full gap-[8px]">
        <div className="flex items-center gap-[10px] min-w-0">
          <Icon
            size={SEVERITY_ICON_SIZE_PX}
            className={cn("shrink-0", iconTint)}
          />
          <h3 className="text-heading-sm font-bold text-(--color-text-primary) truncate min-w-0 m-0">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-[8px] shrink-0">
          <LivePill severity={severity} lang={lang} />
          {isCollapsed && (
            <ChevronDownIcon
              size={CHEVRON_SIZE_PX}
              className="text-(--color-text-secondary)"
              aria-hidden
            />
          )}
        </div>
      </div>
      <p className="w-full text-body-sm text-(--color-text-primary) m-0">
        {description}
      </p>
      {meta && (
        <p className="w-full text-body-xs text-(--color-text-secondary) m-0">
          {meta}
        </p>
      )}
    </header>
  );
}
