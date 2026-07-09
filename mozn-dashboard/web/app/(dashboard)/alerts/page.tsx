import { getRegionOptions, getThresholds } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { ThresholdsView } from "@/features/thresholds/components/thresholds-view";
import { getServerT } from "@/lib/i18n-server";
import type { RegionOption } from "@/types/users";

export const dynamic = "force-dynamic";

export default async function AlertsPageRoute() {
  const page = await getThresholds();
  const { t } = await getServerT();
  // Region options power the create-threshold dialog; fetching them needs
  // regions.view, so best-effort — the editor still renders (create dialog
  // shows no regions) if the caller lacks the permission.
  let regionOptions: RegionOption[] = [];
  try {
    regionOptions = await getRegionOptions();
  } catch {
    /* leave empty */
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title={t("page.alerts.title")}
        subtitle={t("page.alerts.subtitle")}
      />

      <ThresholdsView page={page} regionOptions={regionOptions} />
    </div>
  );
}
