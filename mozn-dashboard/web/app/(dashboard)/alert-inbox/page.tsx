import { getAlertInbox } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { AlertInboxView } from "@/features/alert-inbox/components/alert-inbox-view";

export const dynamic = "force-dynamic";

export default async function AlertInboxPageRoute() {
  const page = await getAlertInbox();

  return (
    <div className="space-y-6">
      <PageHeading titleKey="page.inbox.title" subtitleKey="page.inbox.subtitle" />
      <AlertInboxView page={page} />
    </div>
  );
}
