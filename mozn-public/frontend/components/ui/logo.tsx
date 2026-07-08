import Image from "next/image";
import * as React from "react";

import { cn } from "../lib/cn";

type LogoProps = {
  className?: string;
  size?: number;
};

// Renders the light + dark logo together; the `dark:` variant (registered in
// globals.css against `[data-theme="dark"]`) shows whichever matches the theme.
// Both toggles are utility classes so they share one cascade layer — the
// earlier `@layer components` swap lost to Tailwind's `.hidden` utility in v4.
// Stays a server component (no JS) and avoids hydration flicker since the boot
// script sets `data-theme` before paint.
export function Logo({ className, size = 120 }: LogoProps) {
  const height = Math.round((size * 181) / 180);
  return (
    <span
      className={cn("inline-block leading-none", className)}
      style={{ width: size, height }}
    >
      <Image
        src="/brand/mozn-logo-primary.svg"
        alt="Mozn Early Warning System"
        width={size}
        height={height}
        className="block dark:hidden w-full h-full"
        priority
        draggable={false}
      />
      <Image
        src="/brand/mozn-logo-primary-dark.svg"
        alt=""
        aria-hidden
        width={size}
        height={height}
        className="hidden dark:block w-full h-full"
        priority
        draggable={false}
      />
    </span>
  );
}
