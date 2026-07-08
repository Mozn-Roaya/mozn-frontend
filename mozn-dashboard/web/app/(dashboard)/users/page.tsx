import { getUsers } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { UsersAccessTabs } from "@/features/users/components/users-access-tabs";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function UsersPageRoute() {
  const page = await getUsers();
  const { t } = await getServerT();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <PageHeading
        title={t("page.users.title")}
        subtitle={t("page.users.subtitle", {
          admins: page.adminCount,
          gov: page.govCount,
        })}
      />

      <UsersAccessTabs page={page} />
    </div>
  );
}
