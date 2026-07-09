import { getActiveAlerts } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { AlertManagementView } from "@/features/alert-management/components/alert-management-view";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function ActiveAlertsPageRoute() {
  const [alerts, { t }] = await Promise.all([getActiveAlerts(), getServerT()]);

  return (
    <div className="space-y-6">
      <PageHeading
        title={t("page.activeAlerts.title")}
        subtitle={t("page.activeAlerts.subtitle")}
      />
      <AlertManagementView initialAlerts={alerts} />
    </div>
  );
}
