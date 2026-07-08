"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLocale } from "@/components/providers/locale-provider";
import { LEAF_CRUMBS, NAV_GROUPS } from "./nav-config";
import { CommandPalette } from "./command-palette";
import { LanguageToggle } from "./language-toggle";
import { NotificationsMenu } from "./notifications-menu";
import { SidebarContent } from "./sidebar-content";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const { locale, t } = useLocale();
  const pathname = usePathname();

  // Global shortcuts to open the palette: ⌘/Ctrl-K anywhere, or "/" when the
  // user isn't already typing in a field.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const slash = e.key === "/" && !typing;
      if (cmdK || slash) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Breadcrumb trail — resolve the active nav item from the route (exact match
  // first, then the deepest matching sub-route) so it always tracks the sidebar,
  // then append a leaf crumb for form/detail sub-routes. The full path lives
  // here; pages no longer render their own breadcrumb.
  const crumbs = React.useMemo(() => {
    const items = NAV_GROUPS.flatMap((g) => g.items);
    const section =
      items.find((i) => i.href === pathname) ??
      items.find((i) => i.href && i.href !== "/" && pathname.startsWith(i.href));
    const leaf = LEAF_CRUMBS.find((c) => c.match(pathname));

    const trail: { label: string; href?: string }[] = [];
    if (section) {
      // Section links to its screen only when it isn't the last crumb.
      trail.push({ label: t(section.labelKey), href: leaf ? section.href : undefined });
    }
    if (leaf) trail.push({ label: t(leaf.labelKey) });
    return trail;
  }, [pathname, t]);

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border bg-card">
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile sidebar drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("topbar.openMenu")}>
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={locale === "ar" ? "right" : "left"} className="w-[260px] p-0">
            <SheetTitle>{t("topbar.navigation")}</SheetTitle>
            <SheetDescription>{t("topbar.navDesc")}</SheetDescription>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb — brand / section / sub-page */}
        <nav aria-label={t("topbar.breadcrumbAria")} className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="text-sm font-medium tracking-tight text-foreground">
            {t("chrome.brandName")}
          </span>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <React.Fragment key={i}>
                <span className="text-base leading-none text-border-strong" aria-hidden>
                  /
                </span>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="truncate text-sm font-medium tracking-tight text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Global search + actions */}
        <div className="ms-auto flex flex-1 items-center justify-end gap-2 sm:flex-none">
          {/* Looks like the old search input, but opens the command palette
              (also ⌘/Ctrl-K or "/"). Styling mirrors <Input> so nothing shifts. */}
          <div className="relative w-full max-w-[240px] sm:w-[240px] lg:w-[280px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={t("topbar.searchLabel")}
              aria-keyshortcuts="Control+K /"
              className="flex h-9 w-full items-center rounded-xl border border-input bg-card ps-9 pe-3 text-start text-sm text-muted-foreground transition-[color,border-color,box-shadow] hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
              <span className="truncate">{t("topbar.search")}</span>
            </button>
          </div>
          <LanguageToggle />
          <ThemeToggle />
          <NotificationsMenu />
        </div>
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
