"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocale } from "@/components/providers/locale-provider";

// Force Western (Latin) digits in Arabic to match the rest of the dashboard,
// while still getting Arabic month/weekday names.
const numbering = (locale: string) => (locale === "ar" ? "ar-u-nu-latn" : "en");

/** A single-date picker: Popover + shadcn Calendar. Locale-aware (RTL mirror +
 * Arabic month/weekday names with Western digits). Pass `disabled` to grey out
 * days that have no data. */
export function DatePicker({
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
  className,
}: {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder: string;
  ariaLabel?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
}) {
  const { locale } = useLocale();
  const [open, setOpen] = React.useState(false);
  const nu = numbering(locale);

  const label = value
    ? new Intl.DateTimeFormat(nu, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(value)
    : placeholder;

  // Localize the calendar chrome (Arabic names, Western digits) only for AR;
  // English uses react-day-picker's defaults.
  const formatters =
    locale === "ar"
      ? {
          formatCaption: (m: Date) =>
            new Intl.DateTimeFormat(nu, { month: "long", year: "numeric" }).format(m),
          // Full weekday names (الأحد، الاثنين، …). The grid cells are widened
          // in calendar.tsx so these don't overflow / run together.
          formatWeekdayName: (d: Date) =>
            new Intl.DateTimeFormat(nu, { weekday: "long" }).format(d),
          formatDay: (d: Date) =>
            new Intl.DateTimeFormat(nu, { day: "numeric" }).format(d),
          formatMonthDropdown: (m: Date) =>
            new Intl.DateTimeFormat(nu, { month: "long" }).format(m),
          formatYearDropdown: (y: Date) =>
            new Intl.DateTimeFormat(nu, { year: "numeric" }).format(y),
        }
      : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={ariaLabel ?? placeholder}
          className={cn(
            "h-9 justify-start gap-2 bg-card font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="size-4 text-muted-foreground" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          disabled={disabled}
          dir={locale === "ar" ? "rtl" : "ltr"}
          formatters={formatters}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
