"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";

/** "Add station" action — navigates to the full-page form (A2.1).
 * Hidden for Gov roles, which have a read-only view of stations (G2). */
export function AddStationDialog({ regions: _regions }: { regions: string[] }) {
  const t = useT();
  const { isGov } = useRole();

  if (isGov) return null;

  return (
    <Button asChild>
      <Link href="/stations/new">
        <Plus className="size-4" />
        {t("stations.addStation")}
      </Link>
    </Button>
  );
}
