import { PageHeading } from "@/components/common/page-heading";
import { AlertManagementView } from "@/features/alert-management/components/alert-management-view";
import { getServerT } from "@/lib/i18n-server";

export default async function ActiveAlertsPageRoute() {
  const { t } = await getServerT();

  return (
    <div className="space-y-6">
      <PageHeading
        title={t("page.activeAlerts.title")}
        subtitle={t("page.activeAlerts.subtitle")}
      />
      <AlertManagementView />
    </div>
  );
}
