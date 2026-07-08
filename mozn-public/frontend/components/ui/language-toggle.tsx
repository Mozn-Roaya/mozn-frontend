"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { GlobeIcon } from "../icons";
import { cn } from "../lib/cn";
import { LANG_COOKIE } from "../lib/i18n";
import { useLang } from "../state/lang-context";

type Props = {
  className?: string;
};

const ONE_YEAR = 60 * 60 * 24 * 365;

export function LanguageToggle({ className }: Props) {
  const router = useRouter();
  const lang = useLang();
  const [isPending, startTransition] = React.useTransition();

  function toggle() {
    if (isPending) return;
    const next = lang === "en" ? "ar" : "en";
    const html = document.documentElement;
    html.lang = next;
    html.dir = next === "ar" ? "rtl" : "ltr";
    // Cookie drives the server render (so it's Arabic from the first byte);
    // localStorage drives the pre-hydration boot script (so dir/font are right
    // before paint on a hard reload).
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    try {
      localStorage.setItem(LANG_COOKIE, next);
    } catch {
      // localStorage may be unavailable.
    }
    // Re-render Server Components (station panel, overview, alerts) in the new
    // language inside a transition: React keeps the current UI interactive
    // until the new render is ready instead of flashing a reload.
    startTransition(() => router.refresh());
  }

  const label = lang === "en" ? "تبديل إلى العربية" : "Switch to English";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-busy={isPending}
      className={cn(
        "shrink-0 inline-flex items-center gap-[6px] h-[36px] px-[10px] rounded-[8px]",
        "text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-secondary)",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus)",
        "transition-opacity",
        isPending && "opacity-60",
        className,
      )}
    >
      <GlobeIcon size={20} />
      <span className="text-body-xs font-medium uppercase">
        {lang === "en" ? "AR" : "EN"}
      </span>
    </button>
  );
}
