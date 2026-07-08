import "server-only";

import { cookies } from "next/headers";

import { isLang, LANG_COOKIE, type Lang } from "./i18n";

/** Resolve the active UI language from the request cookie. Defaults to English. */
export async function getServerLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : "en";
}
