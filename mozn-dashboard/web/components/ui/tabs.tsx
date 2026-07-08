"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    // Segmented control: a rounded track that holds the triggers. The active
    // trigger lifts onto a card surface (see TabsTrigger).
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-muted p-1",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        // Active segment: raised card surface + brand text (the app's active
        // language, as in the sidebar and settings rail). Dark mode lifts to the
        // secondary surface so the active pill stays lighter than the track.
        "data-[state=active]:bg-card data-[state=active]:text-brand-foreground data-[state=active]:shadow-sm dark:data-[state=active]:bg-secondary",
        // Recolour the count badge (if any) to brand on the active segment.
        "data-[state=active]:[&_[data-slot=tab-count]]:bg-brand-foreground/15 data-[state=active]:[&_[data-slot=tab-count]]:text-brand-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Count pill shown inside a TabsTrigger. Translucent so it reads on both the
 *  track (inactive) and the raised active surface; recoloured to brand when its
 *  trigger is active (see TabsTrigger). */
function TabsCount({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tab-count"
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground/10 px-1 text-[11px] font-semibold leading-none tabular-nums text-muted-foreground transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsCount, TabsContent };
