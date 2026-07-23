# Styling & Design Tokens

Both apps use **Tailwind CSS v4** with a **CSS-first**, token-driven approach.
All colours, typography, spacing, radius and shadow trace back to design tokens
defined in each app's `app/globals.css` — **never** to raw hex values in
component code. The tokens mirror the Mozn Figma file, so design and code stay in
lockstep.

There is no `tailwind.config.js`. Tailwind v4 is wired through PostCSS
(`@tailwindcss/postcss`), and the theme is declared in CSS via `@theme`.

> **The one rule to remember:** don't hardcode colour, spacing, radius or type in a
> component. Use a token/utility. If you need a new one, add it to `globals.css`.

---

## The two apps differ in one important way

Both are token-first, but they expose semantic colours differently and toggle dark
mode differently. Know which app you're in.

| | Dashboard (`mozn-dashboard/web`) | Public app (`mozn-public/frontend`) |
| --- | --- | --- |
| Semantic colours | `@theme inline` aliases → utilities like `bg-primary`, `text-muted-foreground`, `border-border` | Consumed via the v4 var shorthand: `bg-(--color-bg-primary)`, `text-(--color-text-muted)` |
| Dark mode | **class-based** — `.dark` on `<html>` (via `next-themes`) | **attribute-based** — `[data-theme="dark"]` on `<html>` |
| Dark variant | `@custom-variant dark (&:where(.dark, .dark *))` | `@custom-variant dark` registered against `[data-theme="dark"]` |

Mixing them up (e.g. using `.dark` in the public app) silently breaks theming.

---

## Dashboard token model

- **Raw tokens** live in `:root` (light) and `.dark` (dark) as CSS variables —
  surfaces, brand, neutrals, interactive states, borders, the status palette, the
  chart palette, and shadows. Only these flip for dark; everything built on them
  reskins automatically.
- **`@theme inline`** aliases those variables to Tailwind color/font/radius/shadow
  tokens (`--color-primary: var(--primary)`, etc.), so utilities like `bg-primary`,
  `text-muted-foreground`, `border-border`, `rounded-lg`, `shadow-card` resolve to
  the semantic tokens.
- **Status palette:** `--status-normal / --status-warning / --status-advisory /
  --status-offline` — use these for station health, not ad-hoc colours.
- **Chart series:** `--chart-1..4` + `--chart-track` (recharts via shadcn Charts).
- Tokens with **no Figma source** are annotated `CODE EXTENSION` in `globals.css`
  (e.g. `--status-advisory`, `--chart-4`). Keep that annotation if you add more.
- Compose classes with `cn()` from `lib/utils.ts`.

## Public app token model (two-tier)

- **Tier 1 — `@theme`:** theme-invariant, utility-generating primitives — the
  colour ramps (`grey` / `brand-blue` / `sky-blue`), `status` / `severity` /
  `advisory` swatches, the `chart` series palette, the type scale, spacing, radius,
  shadow and motion. Exposed as both `var(--token)` and utilities (`bg-grey-50`,
  `text-body-sm`, `shadow-card`).
- **Tier 2 — `:root` + `[data-theme="dark"]` (in `@layer base`):** the **semantic
  theming layer** (`--color-bg-*`, `--color-text-*`, `--color-border-*`,
  `--color-interactive-*`, chart furniture). These alias tier-1 primitives to
  intent and flip wholesale for dark. Consume them via the v4 var shorthand —
  `bg-(--color-bg-primary)`, `text-(--color-text-muted)` — **not** utility classes
  (they are intentionally kept out of `@theme`).

Add a new primitive/scale to `@theme`; add a new per-theme intent to the
`:root` / dark blocks. Don't use `@theme inline` for the semantic layer here —
components reference `var(--color-*)` directly, which `inline` wouldn't emit.

---

## Shared conventions

- **Typography utilities** set size + line-height in one shot from the Figma type
  scale — e.g. `text-display-xl`, `text-heading-xl`, `text-body-sm`,
  `text-label-md`. Compose weight explicitly (`font-normal` / `font-medium` /
  `font-semibold` / `font-bold`).
- **Spacing:** the numeric scale resolves in 4px steps (`--spacing: 4px`), matching
  Figma — `p-1 = 4px`, `p-4 = 16px`, `gap-2 = 8px`. Stay on the scale.
- **Radius:** `rounded-sm` (2px) → `rounded-3xl` (24px) → `rounded-full`.
- **Shadows:** `shadow-card`, `shadow-pin`, `shadow-legend`.
- **Bracketed pixel values** are only for off-scale one-offs (`min-h-[96px]`,
  `w-[368px]`) — prefer the scale whenever the value is on the 4px grid.
- **Fonts:** Poppins for Latin, paired with a dedicated Arabic face — **Almarai**
  in the dashboard, **Cairo** in the public app — so Arabic glyphs render correctly
  in RTL. See [`i18n-and-rtl.md`](./i18n-and-rtl.md).
- **Logical utilities only** for anything directional (`ps/pe`, `ms/me`,
  `start/end`, `text-start`) so RTL mirrors — see [`i18n-and-rtl.md`](./i18n-and-rtl.md).
