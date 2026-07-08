"use client";

import * as React from "react";
import { Check, Globe } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/components/providers/locale-provider";
import type { Locale } from "@/lib/i18n";

// Language names stay in their own language regardless of the active UI locale.
const LANGUAGES: { locale: Locale; label: string }[] = [
  { locale: "en", label: "English" },
  { locale: "ar", label: "العربية" },
];

/** Topbar language switcher (EN/AR). Applies immediately and persists via cookie. */
export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("language.switch")}
          className="size-9 border border-border"
        >
          <Globe className="size-5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.locale}
            onClick={() => setLocale(l.locale)}
            className="gap-2"
          >
            <Check
              aria-hidden
              className={cn("size-4", locale === l.locale ? "opacity-100" : "opacity-0")}
            />
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
