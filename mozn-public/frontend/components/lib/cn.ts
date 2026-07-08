import { clsx, type ClassValue } from "clsx";

/**
 * Join class names. Backed by `clsx` so it accepts strings, arrays, and the
 * conditional-object syntax that shadcn components (e.g. `ui/chart`) rely on.
 *
 * Deliberately NOT wrapped in `tailwind-merge`: this app defines custom
 * utilities (`text-heading-md`, `text-body-sm`, `shadow-card`) and puts a
 * `text-(--color-*)` colour on the same element. tailwind-merge (without a
 * bespoke config) would treat `text-heading-md` and `text-(--color-*)` as the
 * same "text" group and silently drop the font-size utility — a typography
 * regression across the app. clsx only concatenates, so it is conflict-free.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
