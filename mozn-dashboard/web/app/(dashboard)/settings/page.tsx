import { getSettings } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { SettingsView } from "@/features/settings/components/settings-view";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function SettingsPageRoute() {
  const page = await getSettings();
  const { t } = await getServerT();

  return (
    <div className="space-y-6">
      <PageHeading
        title={t("page.settings.title")}
        subtitle={t("page.settings.subtitle")}
      />

      <SettingsView page={page} />
    </div>
  );
}
