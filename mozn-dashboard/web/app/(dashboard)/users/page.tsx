import { getRegionOptions, getRoleMatrix, getUsers } from "@/lib/api";
import { PageHeading } from "@/components/common/page-heading";
import { UsersAccessTabs } from "@/features/users/components/users-access-tabs";
import { getServerT } from "@/lib/i18n-server";
import type { RoleMatrix } from "@/types/roles";
import type { RegionOption } from "@/types/users";

export const dynamic = "force-dynamic";

export default async function UsersPageRoute() {
  const [page, { t }] = await Promise.all([getUsers(), getServerT()]);
  // Best-effort: the matrix needs roles.view and regions need regions.view; if
  // the caller lacks them the users list still renders (assignment lists empty).
  let roleMatrix: RoleMatrix = { roles: [], permissions: [] };
  let regionOptions: RegionOption[] = [];
  try {
    [roleMatrix, regionOptions] = await Promise.all([getRoleMatrix(), getRegionOptions()]);
  } catch {
    /* leave empty */
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <PageHeading
        title={t("page.users.title")}
        subtitle={t("page.users.subtitle", {
          admins: page.adminCount,
          gov: page.govCount,
        })}
      />

      <UsersAccessTabs page={page} roleMatrix={roleMatrix} regionOptions={regionOptions} />
    </div>
  );
}
