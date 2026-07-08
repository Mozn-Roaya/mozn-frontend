"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useT } from "@/components/providers/locale-provider";
import { BrandMark } from "./brand-mark";
import { NavList } from "./nav-list";
import { UserCard } from "./user-card";

/**
 * Shared inner content of the sidebar — used by both the fixed desktop sidebar
 * and the mobile drawer so navigation stays consistent across breakpoints.
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useT();
  return (
    <div className="flex h-full flex-col">
      {/* Brand band — exactly the topbar's 64px height with a full-width hairline,
          so the sidebar divider lines up with the header's bottom border to form
          one continuous line. Calm, sentence-weight wordmark (Vercel never pushes
          the geometric voice past ~600 weight). */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border-subtle px-6">
        <BrandMark className="size-9 shrink-0" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-lg font-semibold leading-tight tracking-tight text-foreground">
            {t("chrome.brandName")}
          </span>
          <span className="text-xs font-medium leading-tight text-muted-foreground">
            {t("chrome.adminPanel")}
          </span>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 py-4">
        <NavList onNavigate={onNavigate} />
      </ScrollArea>

      <div className="border-t border-border-subtle px-3 py-3">
        <UserCard />
      </div>
    </div>
  );
}
