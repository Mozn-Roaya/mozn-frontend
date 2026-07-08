"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Info,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/common/empty-state";
import { useT, useTD } from "@/components/providers/locale-provider";

type NotifTone = "critical" | "warning" | "info" | "success";

interface Notif {
  id: string;
  titleKey: string;
  descKey: string;
  /** Raw relative-time string; localized via `td()` against lib/i18n/data.ts. */
  time: string;
  tone: NotifTone;
  read: boolean;
  href: string;
}

const TONE: Record<NotifTone, { icon: LucideIcon; className: string }> = {
  critical: { icon: TriangleAlert, className: "text-status-warning" },
  warning: { icon: TriangleAlert, className: "text-status-advisory" },
  info: { icon: Info, className: "text-text-link" },
  success: { icon: CheckCircle2, className: "text-status-normal" },
};

export function NotificationsMenu() {
  const t = useT();
  const td = useTD();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notif[]>([]);
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unread ? t("notif.ariaUnread", { count: unread }) : t("notif.aria")}
          className="relative size-9 border border-border"
        >
          <Bell className="size-5 text-muted-foreground" />
          {unread > 0 ? (
            <span className="absolute -end-0.5 -top-0.5 flex min-w-[1.125rem] items-center justify-center rounded-full bg-status-warning px-1 text-[10px] font-semibold leading-[1.125rem] text-white ring-2 ring-card">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[360px] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{t("notif.title")}</h2>
            {unread > 0 ? (
              <span data-slot="pill" className="rounded-full bg-status-warning/10 px-1.5 text-xs font-semibold tabular-nums text-text-warning">
                {t("notif.new", { count: unread })}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-1 text-xs font-medium text-text-link transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <CheckCheck className="size-3.5" />
            {t("notif.markAllRead")}
          </button>
        </div>

        <ScrollArea className="max-h-[380px]">
          {items.length === 0 ? (
            <EmptyState icon={BellOff} message={t("notif.caughtUp")} />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {items.map((n) => {
                const Icon = TONE[n.tone].icon;
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                        !n.read && "bg-accent/40",
                      )}
                    >
                      <Icon
                        className={cn("mt-0.5 size-4 shrink-0", TONE[n.tone].className)}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "min-w-0 flex-1 truncate text-sm text-foreground",
                              n.read ? "font-medium" : "font-semibold",
                            )}
                          >
                            {t(n.titleKey)}
                          </p>
                          {!n.read ? (
                            <span
                              className="size-2 shrink-0 rounded-full bg-status-warning"
                              aria-label={t("notif.unread")}
                            />
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {t(n.descKey)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{td(n.time)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t border-border-subtle p-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-center">
            <Link href="/alert-inbox" onClick={() => setOpen(false)}>
              {t("notif.viewAll")}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
