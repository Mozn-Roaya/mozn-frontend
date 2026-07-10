import Link from "next/link";
import * as React from "react";

import { LanguageToggle } from "./language-toggle";
import { Logo } from "./logo";
import { StationSearch } from "./station-search";
import { ThemeToggle } from "./theme-toggle";
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
          {/* The public site is standalone — no cross-link to the admin
              dashboard (it lives separately; see deployment notes). */}
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
