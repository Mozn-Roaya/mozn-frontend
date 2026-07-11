import { getActiveAlerts } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { AlertManagementView } from "@/features/alert-management/components/alert-management-view";

export const dynamic = "force-dynamic";

export default async function ActiveAlertsPageRoute() {
  const alerts = await getActiveAlerts();

  return (
    <div className="space-y-6">
      <PageHeading titleKey="page.activeAlerts.title" subtitleKey="page.activeAlerts.subtitle" />
      <AlertManagementView initialAlerts={alerts} />
    </div>
  );
}
