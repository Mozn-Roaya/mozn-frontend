import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Toolbar search field: a leading search icon over a secondary-styled Input.
 * `className` sets the wrapper width (it varies per toolbar, e.g.
 * `sm:max-w-[280px]`); all other props forward to the underlying Input.
 */
export function SearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="h-9 bg-secondary ps-9" {...props} />
    </div>
  );
}
