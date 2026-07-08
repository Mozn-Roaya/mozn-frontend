import { getThresholds } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { ThresholdsView } from "@/features/thresholds/components/thresholds-view";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function AlertsPageRoute() {
  const page = await getThresholds();
  const { t } = await getServerT();

  return (
    <div className="space-y-6">
      <PageHeading
        title={t("page.alerts.title")}
        subtitle={t("page.alerts.subtitle")}
      />

      <ThresholdsView page={page} />
    </div>
  );
}
