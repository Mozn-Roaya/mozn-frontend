# Internationalization & RTL

Both apps are fully **bilingual — English and Arabic — with complete right-to-left
(RTL) support**. This is a first-class requirement, not an afterthought: every
screen must work and look correct in both languages and both text directions.

The i18n system is **lightweight and library-free** — a plain typed dictionary and
a `translate()` function, plus a locale cookie. There is no `next-intl`,
`react-i18next`, or similar.

> **The rule:** every user-facing string ships with **both** `en` and `ar` copy,
> and every directional style uses **logical** Tailwind utilities so the layout
> mirrors automatically in Arabic.

---

## How it works

### Dashboard (`mozn-dashboard/web`)

- **`lib/i18n.ts`** — pure (safe on client and server). A flat, namespaced `dict`
  (keys like `"nav.dashboard"`, `"stations.title"`) merged from per-area maps in
  `lib/i18n/*` (`chrome`, `dashboard`, `stations`, `alert-inbox`, `thresholds`,
  `history`, `users`, `settings`, `alert-templates`, `alert-management`, `gov`).
  `translate(locale, key, vars?)` fills `{placeholders}`. `type Locale = "en" | "ar"`.
- **`translateData(locale, value)`** — translates backend free-text keyed on the
  raw English value (via `data.ts`), falling back to the value unchanged. Use it for
  proper nouns / fixture copy coming from the API.
- **Server:** `lib/i18n-server.ts` (`server-only`) — `getServerLocale()` reads the
  `mozn-locale` cookie (`"ar"` else `"en"`); `getServerT()` returns a bound
  `{ locale, t, td }`. The root layout sets `<html lang dir>` from it.
- **Client:** `components/providers/locale-provider.tsx` exposes `useT()`,
  `useTD()`, `useLocale()`. `setLocale` writes the `mozn-locale` cookie (1 year),
  flips `<html lang/dir>` immediately, then calls `router.refresh()` so
  server-computed strings update. It also wraps children in Radix
  `DirectionProvider` so Radix primitives mirror correctly.

### Public app (`mozn-public/frontend`)

- **`components/lib/i18n.ts`** — pure/isomorphic dictionary + helpers: a fully
  translated `EN`/`AR` dict, `getDict(lang)`, `pickLang(lang, base, arabic)` (AR
  falls back to the base string when empty), and `localeFor` (`ar-u-nu-latn` —
  Arabic copy with Latin digits). Dynamic backend content uses `name_ar` /
  `message_ar` / `guidance_steps_ar` fields.
- **`components/lib/lang-server.ts`** (`server-only`) — `getServerLang()` reads the
  **`mozn-lang`** cookie; both layouts use it to set SSR `lang`/`dir`.
- **`components/state/lang-context.tsx`** — `LanguageProvider` + `useLang()` /
  `useT()` for client components.
- `components/ui/language-toggle.tsx` writes the cookie + `localStorage`, flips
  `<html lang/dir>` imperatively, then `router.refresh()` in a transition (no
  reload flash).

---

## RTL: use logical utilities only

Because the same markup serves both directions, **never** use physical
direction utilities. Use the logical equivalents so Arabic mirrors for free:

| Don't use | Use instead |
| --- | --- |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `ml-*` / `mr-*` | `ms-*` / `me-*` |
| `left-*` / `right-*` | `start-*` / `end-*` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` |

When you genuinely need a fixed physical side (rare), gate it behind the direction
explicitly and test both layouts.

---

## Fonts

Both apps pair **Poppins** for Latin with a dedicated Arabic face, so Arabic
glyphs render correctly in RTL:

- **Dashboard** — Poppins + **Almarai** (listed together in `--font-sans`).
- **Public app** — Poppins + **Cairo** (`globals.css` swaps `--font-sans` to Cairo
  under `html[lang="ar"]`, keeping the same type scale).

---

## Checklist when adding UI copy

1. Add the key to the relevant area dictionary with **both** `en` and `ar` values.
2. Reference it via `useT()` (client) or the server `t` helper — no hardcoded
   strings in JSX.
3. Use logical Tailwind utilities for all spacing/positioning/alignment.
4. Open the screen in Arabic (toggle the language, or set the locale cookie —
   `mozn-locale` in the dashboard, `mozn-lang` in the public app) and verify the
   RTL layout, not just English LTR.
