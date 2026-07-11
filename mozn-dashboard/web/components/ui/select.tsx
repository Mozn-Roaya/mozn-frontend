"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";

// Radix Select (v2) has no `modal` prop, and while its dropdown is open it makes
// the page (including an enclosing Dialog's card) pointer-events:none — so a
// click on a label/empty space in the dialog leaks to the overlay and Radix
// reads it as an outside-click, closing the dialog. We can't detect that from
// the DOM reliably (Radix flushSync-unmounts the popper, and the dialog can even
// close via a focus-outside that fires AFTER the select is gone). Instead the
// Select records here when it is open / was just open, and DialogContent checks
// this to keep the dialog open for that one interaction.
let openSelectCount = 0;
let lastSelectActiveAt = 0;

/** True while any Select dropdown is open, or briefly after one closed — the
 *  window in which a Dialog's "outside" interaction is really the Select
 *  dismissing. */
export function isSelectRecentlyActive(): boolean {
  return openSelectCount > 0 || Date.now() - lastSelectActiveAt < 300;
}

/** Set `dir` on the Radix root from the active locale so the (portaled) content
 * mirrors for Arabic even if the DirectionProvider context is out of reach. An
 * explicit `dir` prop from the caller still wins. */
function Select({
  dir,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  const { locale } = useLocale();
  return (
    <SelectPrimitive.Root
      dir={dir ?? (locale === "ar" ? "rtl" : "ltr")}
      onOpenChange={(open) => {
        if (open) openSelectCount += 1;
        else {
          openSelectCount = Math.max(0, openSelectCount - 1);
          lastSelectActiveAt = Date.now();
        }
        onOpenChange?.(open);
      }}
      {...props}
    />
  );
}
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn("flex cursor-default items-center justify-center py-1 text-muted-foreground", className)}
      {...props}
    >
      <ChevronUp className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn("flex cursor-default items-center justify-center py-1 text-muted-foreground", className)}
      {...props}
    >
      <ChevronDown className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        // No vertical padding: the trigger height is fixed (h-10, or h-9 via
        // callers) and items-center handles centering. py-2 would shrink the box
        // below the RTL line-height (text-sm bumps 14→16px / 24px leading) and
        // clip Arabic glyphs — badly at h-9 (~18px box).
        "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm transition-[color,border-color,box-shadow] placeholder:text-muted-foreground hover:border-border-strong focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  side = "bottom",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const { locale } = useLocale();
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        // Pin direction on the portaled element itself: it lives under <body>,
        // so it can't rely on a closer RTL ancestor, and this makes the logical
        // ps-/start- utilities on items resolve correctly regardless of context.
        dir={locale === "ar" ? "rtl" : "ltr"}
        className={cn(
          // Cap height to the space available below the trigger so the menu can
          // always open downward without running off-screen (it scrolls inside
          // when the list is taller than the gap).
          "relative z-50 max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-card animate-in fade-in-0 zoom-in-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        // Always open below the trigger; don't flip upward over the page.
        side={side}
        avoidCollisions={false}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "w-full min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 ps-8 pe-2 text-sm outline-none focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute start-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
