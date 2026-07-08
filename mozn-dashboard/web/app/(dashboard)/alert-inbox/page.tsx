import { getAlertInbox } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { AlertInboxView } from "@/features/alert-inbox/components/alert-inbox-view";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function AlertInboxPageRoute() {
  const page = await getAlertInbox();
  const { t } = await getServerT();

  return (
    <div className="space-y-6">
      <PageHeading
        title={t("page.inbox.title")}
        subtitle={t("page.inbox.subtitle")}
      />
      <AlertInboxView page={page} />
    </div>
  );
}
