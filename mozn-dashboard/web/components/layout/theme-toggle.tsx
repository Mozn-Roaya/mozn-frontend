"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/locale-provider";
import { useMounted } from "@/hooks/use-mounted";

/** Topbar light/dark theme toggle. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useT();
  const mounted = useMounted();

  // Until mounted, theme is unknown on the server — render a deterministic
  // default so SSR and the first client paint match (no hydration mismatch).
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="size-9 border border-border"
    >
      {isDark ? (
        <Sun className="size-5 text-muted-foreground" />
      ) : (
        <Moon className="size-5 text-muted-foreground" />
      )}
    </Button>
  );
}
