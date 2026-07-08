"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          // The knob must read as a light, raised disc in every state. In light
          // mode `bg-background` is near-white; in dark mode it would flip to
          // near-black and vanish on the track, so force the light `--foreground`
          // there. translate-x is physical, so flip the "on" travel in RTL.
          "pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4 dark:bg-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
