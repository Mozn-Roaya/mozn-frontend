"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DirectionProvider } from "@radix-ui/react-direction";

import { translate, translateData, type Locale } from "@/lib/i18n";

const COOKIE = "mozn-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a namespaced key (e.g. "stations.title"), with optional vars. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Translate a raw backend data value; falls back to the value unchanged. */
  td: (value: string | null | undefined) => string;
}

const LocaleContext = React.createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
  td: (value) => value ?? "",
});

/** Reflect the active language onto <html> so the whole document flips to RTL
 * for Arabic (dir drives flex/grid order, text alignment, and logical spacing).
 */
function applyToDocument(locale: Locale) {
  const el = document.documentElement;
  el.lang = locale;
  el.dir = locale === "ar" ? "rtl" : "ltr";
}

/** Holds the active UI language. The initial value comes from the server (a
 * cookie) so SSR renders the correct language and direction with no flash; the
 * choice is persisted back to the cookie (1 year) and applied to <html>. */
export function LocaleProvider({
  initialLocale = "en",
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);
  const router = useRouter();

  // Keep <html dir/lang> in lockstep with the active locale. Runs on the same
  // commit as the locale state change below, so the RTL flip lands with the
  // re-rendered content. Also self-heals any SSR/client cookie mismatch.
  React.useEffect(() => {
    applyToDocument(locale);
  }, [locale]);

  const setLocale = React.useCallback(
    (next: Locale) => {
      if (next === locale) return;
      try {
        document.cookie = `${COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      } catch {
        /* cookies unavailable; in-memory only */
      }
      // Flip the client locale immediately: the chrome, page headings, and every
      // t()/td()-translated value re-render at once with NO server round-trip — so
      // the switch is instant. router.refresh() then updates the few
      // server-computed strings (relative times, audit action labels) in the
      // background; the visible switch has already happened.
      setLocaleState(next);
      router.refresh();
    },
    [router, locale],
  );

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );

  const td = React.useCallback(
    (value: string | null | undefined) => translateData(locale, value),
    [locale],
  );

  const value = React.useMemo(
    () => ({ locale, setLocale, t, td }),
    [locale, setLocale, t, td],
  );
  return (
    <LocaleContext.Provider value={value}>
      {/* Radix components default to LTR and ignore <html dir> unless a
          DirectionProvider is present — this makes ScrollArea/Select/Dropdown/
          Dialog/Tabs all respect the active locale's direction. */}
      <DirectionProvider dir={locale === "ar" ? "rtl" : "ltr"}>
        {children}
      </DirectionProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return React.useContext(LocaleContext);
}

/** Shorthand when a component only needs the translate function. */
export function useT() {
  return React.useContext(LocaleContext).t;
}

/** Shorthand when a component only needs the data-value translator. */
export function useTD() {
  return React.useContext(LocaleContext).td;
}
