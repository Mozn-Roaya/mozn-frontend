"use client";

import * as React from "react";

import { getDict, type Dict, type Lang } from "../lib/i18n";

type LangContextValue = {
  readonly lang: Lang;
  readonly t: Dict;
};

// Default to English so components rendered outside a provider (e.g. the
// `/components` showcase page) still work.
const LangContext = React.createContext<LangContextValue>({
  lang: "en",
  t: getDict("en"),
});

type LanguageProviderProps = {
  /** Resolved on the server from the `mozn-lang` cookie — seeds the client so
   *  there's no hydration mismatch and no English→Arabic flash. */
  readonly lang: Lang;
  readonly children: React.ReactNode;
};

export function LanguageProvider({ lang, children }: LanguageProviderProps) {
  const value = React.useMemo<LangContextValue>(
    () => ({ lang, t: getDict(lang) }),
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** Active language ("en" | "ar"). */
export function useLang(): Lang {
  return React.useContext(LangContext).lang;
}

/** Translation dictionary for the active language. */
export function useT(): Dict {
  return React.useContext(LangContext).t;
}
