import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Multi-line text control. Same border/background/focus language as Input, but
 * with natural (content-driven) height rather than a fixed h-10 — so Arabic
 * descenders never clip and the field grows with `rows`. No card shadow: form
 * controls recess via border, only floating surfaces carry `shadow-card`.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "block min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm transition-[color,border-color,box-shadow] placeholder:text-muted-foreground hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
