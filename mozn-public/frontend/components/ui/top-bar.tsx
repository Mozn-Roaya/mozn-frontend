import Link from "next/link";
import * as React from "react";

import { LanguageToggle } from "./language-toggle";
import { Logo } from "./logo";
import { StationSearch } from "./station-search";
import { ThemeToggle } from "./theme-toggle";
import { GaugeIcon } from "../icons";
import { cn } from "../lib/cn";
import { getDict, type Lang } from "../lib/i18n";

type TopBarProps = {
  className?: string;
  lang?: Lang;
};

export function TopBar({ className, lang = "en" }: TopBarProps) {
  const t = getDict(lang);
  return (
    <header
      className={cn(
        "absolute top-0 left-0 right-0 z-30 pointer-events-none",
        "px-[16px] md:px-[24px] lg:px-[80px] pt-[12px] md:pt-[16px]",
        className,
      )}
    >
      <div className="pointer-events-auto flex items-center gap-[12px] md:gap-[20px] lg:gap-[32px] flex-nowrap">
        <Link href="/" aria-label={t.homeAria} className="shrink-0">
          {/* Figma top-bar logo (node 744:5010) is 48px; smaller on mobile. */}
          <span className="hidden md:block">
            <Logo size={48} />
          </span>
          <span className="block md:hidden">
            <Logo size={32} />
          </span>
        </Link>
        <StationSearch className="md:max-w-[240px] lg:max-w-[280px] flex-1 min-w-0" />
        <div className="flex items-center gap-[4px] md:gap-[8px] shrink-0">
          {/* Cross-zone link to the admin dashboard (Multi-Zones). A plain <a>
              (not next/link) forces a full navigation: the dashboard is a
              separate Next app proxied at /dashboard, so client-side soft-nav /
              prefetch would fail. */}
          <a
            href="/dashboard"
            aria-label={t.dashboardLinkAria}
            className={cn(
              "shrink-0 inline-flex items-center gap-[6px] h-[36px] md:h-[40px] lg:h-[44px]",
              "px-[10px] md:px-[14px] rounded-[8px] md:rounded-[12px]",
              "bg-(--color-bg-primary) border border-solid border-(--color-border-default)",
              "text-(--color-text-primary) shadow-card transition-colors",
              "hover:bg-(--color-bg-secondary) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus)",
            )}
          >
            <GaugeIcon size={20} />
            <span className="hidden sm:inline text-body-xs font-medium">
              {t.dashboardLink}
            </span>
          </a>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
