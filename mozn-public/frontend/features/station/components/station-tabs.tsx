"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/components/lib/cn";
import { useT } from "@/components/state/lang-context";

type Tab = { key: "overview" | "charts" | "data" | "share"; label: string; href: (id: string) => string };

type StationTabsProps = {
  stationId: string;
  className?: string;
};

export function StationTabs({ stationId, className }: StationTabsProps) {
  const pathname = usePathname();
  const t = useT();

  const tabs: Tab[] = [
    { key: "overview", label: t.tabOverview, href: (id) => `/stations/${id}` },
    { key: "charts", label: t.tabCharts, href: (id) => `/stations/${id}/charts` },
    { key: "data", label: t.tabData, href: (id) => `/stations/${id}/data` },
    { key: "share", label: t.tabShare, href: (id) => `/stations/${id}/share` },
  ];

  return (
    <nav
      className={cn(
        "flex items-center gap-[4px] px-[4px] py-[4px] rounded-[12px]",
        "bg-(--color-bg-secondary)",
        className,
      )}
    >
      {tabs.map((tab) => {
        const href = tab.href(stationId);
        const isActive =
          pathname === href ||
          (tab.key === "overview" && pathname === `/stations/${stationId}`);
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "flex-1 text-center px-[12px] py-[8px] rounded-[8px] transition-colors",
              "text-body-xs font-medium whitespace-nowrap",
              isActive
                ? "bg-(--color-bg-primary) text-(--color-text-primary) shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]"
                : "text-(--color-text-muted) hover:text-(--color-text-primary)",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
