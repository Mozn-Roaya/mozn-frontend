import { getCompoundRules, getRegionOptions, getThresholds } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { ThresholdsView } from "@/features/thresholds/components/thresholds-view";
import { getServerT } from "@/lib/i18n-server";
import type { RegionOption } from "@/types/users";
import type { CompoundRule } from "@/types/thresholds";

export const dynamic = "force-dynamic";

export default async function AlertsPageRoute() {
  const page = await getThresholds();
  const { t } = await getServerT();
  // Region options power the create dialogs; fetching them needs regions.view,
  // so best-effort — the editor still renders if the caller lacks the permission.
  let regionOptions: RegionOption[] = [];
  try {
    regionOptions = await getRegionOptions();
  } catch {
    /* leave empty */
  }
  // Compound rules (best-effort; needs compound_rules.view).
  let compoundRules: CompoundRule[] = [];
  try {
    compoundRules = await getCompoundRules();
  } catch {
    /* leave empty */
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={t("page.alerts.title")}
        subtitle={t("page.alerts.subtitle")}
      />

      <ThresholdsView page={page} regionOptions={regionOptions} compoundRules={compoundRules} />
    </div>
  );
}
