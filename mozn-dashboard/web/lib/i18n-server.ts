import "server-only";
import { cookies } from "next/headers";

import { translate, translateData, type Locale } from "./i18n";

export const LOCALE_COOKIE = "mozn-locale";

/** Read the active locale from the request cookie (server components). */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "ar" ? "ar" : "en";
}

/** Convenience: bind `translate` to the request locale for a server component. */
export async function getServerT() {
  const locale = await getServerLocale();
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    td: (value: string | null | undefined) => translateData(locale, value),
  };
}
