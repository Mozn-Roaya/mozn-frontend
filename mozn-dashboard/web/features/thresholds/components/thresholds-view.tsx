"use client";

import type { ReactNode } from "react";

import { useT } from "@/components/providers/locale-provider";
import { Card } from "@/components/ui/card";
import type { ThresholdsPage, CompoundRule } from "@/features/thresholds/types";
import type { RegionOption } from "@/types/users";
import { MetricThresholdsEditor } from "./metric-thresholds-editor";
import { CompoundRulesManager } from "./compound-rules-manager";
import { ChangeHistory } from "./change-history";

/** Labelled group giving the screen a scannable hierarchy: an eyebrow `h2` per
 *  section. Letter-spacing is reset in RTL (it breaks Arabic cursive joining). */
function Section({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground rtl:tracking-normal">
          {label}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ThresholdsView({
  page,
  regionOptions,
  compoundRules,
}: {
  page: ThresholdsPage;
  regionOptions: RegionOption[];
  compoundRules: CompoundRule[];
}) {
  const t = useT();

  return (
    <div className="space-y-8">
      <Section
        label={t("thresholds.section.perMetric")}
        description={t("thresholds.section.perMetricDesc")}
      >
        <MetricThresholdsEditor
          metrics={page.metrics}
          regionOptions={regionOptions}
        />
      </Section>

      <Section
        label={t("thresholds.section.compound")}
        description={t("thresholds.section.compoundDesc")}
      >
        <CompoundRulesManager rules={compoundRules} regionOptions={regionOptions} />
      </Section>

      <Section label={t("thresholds.history.title")}>
        <Card className="p-6">
          <ChangeHistory changes={page.changes} />
        </Card>
      </Section>
    </div>
  );
}
