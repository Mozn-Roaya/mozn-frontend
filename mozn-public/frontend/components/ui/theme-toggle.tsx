"use client";

import * as React from "react";

import { SunIcon, MoonIcon } from "../icons";
import { cn } from "../lib/cn";
import { useT } from "../state/lang-context";

type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof document === "undefined") return "light";
  const fromAttr = document.documentElement.dataset.theme;
  if (fromAttr === "dark" || fromAttr === "light") return fromAttr;
  return "light";
}

type Props = {
  className?: string;
};

export function ThemeToggle({ className }: Props) {
  const t = useT();
  const [theme, setTheme] = React.useState<Theme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setTheme(getInitial());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    const html = document.documentElement;
    // Add a one-shot transition class so colors animate only when the user
    // toggles. We strip it after the transition window so unrelated repaints
    // don't get caught up.
    html.classList.add("mz-theme-transition");
    html.dataset.theme = next;
    window.setTimeout(() => {
      html.classList.remove("mz-theme-transition");
    }, 320);
    try {
      localStorage.setItem("mozn-theme", next);
      window.dispatchEvent(new CustomEvent("mozn-theme-change", { detail: next }));
    } catch {
      // localStorage may be unavailable (Safari private, SSR).
    }
  }

  const Icon = theme === "light" ? MoonIcon : SunIcon;
  // QA: localized — this aria-label is the icon-only button's only accessible name.
  const label = theme === "light" ? t.themeToDark : t.themeToLight;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={theme === "dark"}
      className={cn(
        "shrink-0 inline-flex size-[36px] items-center justify-center rounded-[8px]",
        "text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-bg-secondary)",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus)",
        className,
      )}
      // Hide until mounted so SSR vs client first-paint matches.
      style={{ visibility: mounted ? "visible" : "hidden" }}
    >
      <Icon size={20} />
    </button>
  );
}
