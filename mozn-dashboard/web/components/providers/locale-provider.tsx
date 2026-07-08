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

  // Keep <html dir/lang> in lockstep with the active locale. The server already
  // sets it from the cookie, but this self-heals any SSR/client mismatch (e.g.
  // a cookie set client-side on a previous visit) so RTL is never half-applied.
  React.useEffect(() => {
    applyToDocument(locale);
  }, [locale]);

  const setLocale = React.useCallback(
    (next: Locale) => {
      setLocaleState(next);
      try {
        document.cookie = `${COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      } catch {
        /* cookies unavailable; in-memory only */
      }
      applyToDocument(next);
      // Client components flip via context immediately, but server components
      // (page headings, backend data) are rendered from the cookie — refresh so
      // they re-render in the new locale instead of showing the previous one.
      router.refresh();
    },
    [router],
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
