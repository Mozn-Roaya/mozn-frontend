"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import { UsersTable } from "./users-table";
import { RolePermissions } from "./role-permissions";
import type { RegionOption, UsersPage } from "@/features/users/types";
import type { RoleMatrix } from "@/types/roles";

/** Users & Access hub: the user list (A4.0/A4.1) and the role matrix (A4.2). */
export function UsersAccessTabs({
  page,
  roleMatrix,
  regionOptions,
}: {
  page: UsersPage;
  roleMatrix: RoleMatrix;
  regionOptions: RegionOption[];
}) {
  const t = useT();
  const { can } = useRole();
  const [tab, setTab] = React.useState("list");
  // The "Add user" action lives here, outside the table Card, so it sits with
  // the page-level actions like every other screen. It triggers the table's
  // create dialog through this ref.
  const openCreateRef = React.useRef<(() => void) | null>(null);

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="list">{t("users.tab.list")}</TabsTrigger>
          <TabsTrigger value="roles">{t("users.tab.roles")}</TabsTrigger>
        </TabsList>
        {tab === "list" && can("users.create") ? (
          <Button size="sm" onClick={() => openCreateRef.current?.()}>
            <Plus className="size-4" />
            {t("users.addUser")}
          </Button>
        ) : null}
      </div>

      <TabsContent value="list" className="flex min-h-0 flex-1 flex-col">
        <UsersTable
          page={page}
          roleOptions={roleMatrix.roles}
          regionOptions={regionOptions}
          openCreateRef={openCreateRef}
        />
      </TabsContent>

      <TabsContent value="roles">
        <RolePermissions matrix={roleMatrix} />
      </TabsContent>
    </Tabs>
  );
}
