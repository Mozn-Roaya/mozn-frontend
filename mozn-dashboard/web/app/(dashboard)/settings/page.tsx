import { getSettings } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { SettingsView } from "@/features/settings/components/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPageRoute() {
  const page = await getSettings();

  return (
    <div className="space-y-6">
      <PageHeading titleKey="page.settings.title" subtitleKey="page.settings.subtitle" />

      <SettingsView page={page} />
    </div>
  );
}
