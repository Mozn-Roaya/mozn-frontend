import { cn } from "@/components/lib/cn";
import { getDict, type Lang } from "@/components/lib/i18n";

import { AlertActions } from "./alert-actions";
import { AlertContacts } from "./alert-contacts";
import { AlertHeader } from "./alert-header";
import { defaultContacts } from "../lib/defaults";

import type { Severity } from "../lib/severity";
import type { AlertLayout, ContactInfo } from "../types";

type WarningAlertProps = {
  readonly title?: string;
  readonly description?: string;
  readonly severity?: Severity;
  readonly layout?: AlertLayout;
  readonly steps?: readonly string[];
  readonly contacts?: readonly ContactInfo[];
  readonly className?: string;
  /** Small secondary line under the description — typically the active
   *  time window or lead time. */
  readonly meta?: string;
  readonly lang?: Lang;
};

export function WarningAlert({
  title,
  description,
  severity = "warning",
  layout = "expanded",
  steps,
  contacts,
  className,
  meta,
  lang = "en",
}: WarningAlertProps) {
  const t = getDict(lang);
  const isExpanded = layout === "expanded";
  const resolvedTitle = title ?? t.defaultWarningTitle;
  const resolvedDescription = description ?? t.defaultWarningDescription;
  const resolvedSteps = steps ?? t.defaultGuidance;
  const resolvedContacts = contacts ?? defaultContacts(lang);

  return (
    <section
      className={cn(
        "flex flex-col items-start w-full rounded-[16px] overflow-hidden",
        "bg-(--color-bg-primary) border border-solid border-(--color-border-subtle)",
        "shadow-card",
        className,
      )}
      aria-live="polite"
    >
      <AlertHeader
        title={resolvedTitle}
        description={resolvedDescription}
        severity={severity}
        layout={layout}
        meta={meta}
        lang={lang}
      />

      {isExpanded && (
        <div className="flex flex-col gap-[16px] w-full px-[20px] py-[18px]">
          <AlertActions steps={resolvedSteps} severity={severity} />
          <div className="h-px w-full bg-(--color-border-subtle)" />
          <AlertContacts contacts={resolvedContacts} lang={lang} />
        </div>
      )}
    </section>
  );
}
