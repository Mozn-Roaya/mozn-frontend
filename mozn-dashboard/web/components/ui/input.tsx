import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // `appearance-none`: strip the native widget — critically for
        // type="search", whose UA control positions its own text and *ignores*
        // line-height/padding, seating Arabic glyphs low so descenders clip
        // (and it varies by browser build). With the native appearance gone, our
        // box model governs layout. `block` over `flex` (an input has no flex
        // children); no vertical padding — height is fixed by h-10 and the
        // RTL line-height override (globals.css) handles centering.
        "block h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 text-sm transition-[color,border-color,box-shadow] placeholder:text-muted-foreground hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&[type=number]]:[-moz-appearance:textfield]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
