"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";

/** "Add station" action — navigates to the full-page form (A2.1).
 * Only shown to accounts that can actually create stations (Super Admin);
 * hidden for Gov roles and operators, which lack stations.create. */
export function AddStationDialog({ regions: _regions }: { regions: string[] }) {
  const t = useT();
  const { can } = useRole();

  if (!can("stations.create")) return null;

  return (
    <Button asChild>
      <Link href="/stations/new">
        <Plus className="size-4" />
        {t("stations.addStation")}
      </Link>
    </Button>
  );
}
