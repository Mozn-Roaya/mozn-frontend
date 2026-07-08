"use client";

import * as React from "react";
import {
  Check,
  ChevronsUp,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useT, useTD } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow, tableBodyRowClass } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import type { InboxItem } from "@/features/alert-inbox/types";
import { parseContext, SEVERITY } from "./inbox-meta";

/** Plain-text tone for the SLA cell — colour is the only urgency cue here. */
const SLA_TEXT: Record<string, string> = {
  danger: "text-text-warning font-medium",
  ok: "text-status-normal",
  muted: "text-muted-foreground",
};

export function InboxAlertRow({
  item,
  acknowledged,
  escalated,
  selected,
  onToggleSelect,
  onAcknowledge,
  onReopen,
  onEscalate,
  onDismiss,
  rowClassName,
}: {
  item: InboxItem;
  acknowledged: boolean;
  escalated: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onAcknowledge: (id: string) => void;
  onReopen: (id: string) => void;
  onEscalate: (id: string) => void;
  onDismiss: (id: string) => void;
  rowClassName?: string;
}) {
  const t = useT();
  const td = useTD();
  const sev = SEVERITY[item.severity];
  const ctx = parseContext(td(item.context));
  const primary = item.metrics[0];
  const extra = item.metrics.length - 1;

  const [ackOpen, setAckOpen] = React.useState(false);
  const [dismissOpen, setDismissOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [reason, setReason] = React.useState("");

  const confirmAck = () => {
    if (!note.trim()) return;
    onAcknowledge(item.id);
    toast(t("inbox.toast.acknowledged"));
    setAckOpen(false);
    setNote("");
  };
  const confirmDismiss = () => {
    if (!reason.trim()) return;
    onDismiss(item.id);
    toast(t("inbox.toast.dismissed"), "info");
    setDismissOpen(false);
    setReason("");
  };

  return (
    <>
      <TableRow className={cn(tableBodyRowClass, acknowledged && "opacity-55", rowClassName)}>
        <TableCell className="ps-4" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            aria-label={t("common.selectRow")}
          />
        </TableCell>

        {/* Severity — colour + word, so it never relies on colour alone */}
        <TableCell className="ps-4">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className={cn("size-2 shrink-0 rounded-full", sev.dot)} aria-hidden />
            <span className={cn("text-sm font-medium", sev.accent)}>
              {t("inboxSeverity." + item.severity)}
            </span>
          </span>
        </TableCell>

        {/* What + where */}
        <TableCell>
          <p className="font-medium text-foreground">
            {ctx.station}
            {escalated ? (
              <span className="ms-2 inline-flex items-center gap-1 align-middle text-[10px] font-semibold uppercase tracking-wide text-status-advisory">
                <ChevronsUp className="size-3" aria-hidden />
                {t("inbox.chip.escalated")}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {td(item.title)}
            {ctx.region ? ` · ${ctx.region}` : ""}
          </p>
        </TableCell>

        {/* Reading vs threshold — plain text */}
        <TableCell className="whitespace-nowrap">
          {primary ? (
            <span className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {td(primary.value)}
              </span>
              <span className="text-xs text-muted-foreground">{td(primary.threshold)}</span>
              {extra > 0 ? (
                <span className="text-xs text-muted-foreground">+{extra}</span>
              ) : null}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Waiting + SLA */}
        <TableCell className="whitespace-nowrap">
          <span className="text-sm text-foreground">{td(item.timeAgo)}</span>
          <span className={cn("ms-2 text-xs", SLA_TEXT[item.sla.tone])}>
            {td(item.sla.label)}
          </span>
        </TableCell>

        {/* Actions */}
        <TableCell className="pe-4 text-end">
          <div className="flex items-center justify-end gap-1.5">
            {acknowledged ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-status-normal">
                <Check className="size-3.5" aria-hidden />
                {t("inbox.chip.acknowledged")}
              </span>
            ) : (
              <Button size="sm" onClick={() => setAckOpen(true)}>
                <Check className="size-4" />
                {t("inbox.action.acknowledge")}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-muted-foreground"
                  aria-label={t("inbox.action.more")}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {acknowledged ? (
                  <DropdownMenuItem
                    onClick={() => {
                      onReopen(item.id);
                      toast(t("inbox.toast.reopened"), "info");
                    }}
                  >
                    <RotateCcw className="size-4" />
                    {t("inbox.action.reopen")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={escalated}
                    onClick={() => {
                      onEscalate(item.id);
                      toast(t("inbox.toast.escalated"));
                    }}
                  >
                    <ChevronsUp className="size-4" />
                    {escalated ? t("inbox.action.escalated") : t("inbox.action.escalate")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => toast(t("inbox.toast.maintenance"))}>
                  <Wrench className="size-4" />
                  {t("inbox.action.setMaintenance")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDismissOpen(true)}
                  className="text-text-warning focus:bg-status-warning/10 focus:text-text-warning"
                >
                  <Trash2 className="size-4" />
                  {t("inbox.action.dismiss")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      {/* Acknowledge — note required; the suggested action rides along as context */}
      <Dialog open={ackOpen} onOpenChange={(o) => { setAckOpen(o); if (!o) setNote(""); }}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); confirmAck(); }}>
            <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-normal/10 text-status-normal">
                <Check className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle>{t("inbox.ack.title")}</DialogTitle>
                <DialogDescription>{t("inbox.ack.desc")}</DialogDescription>
              </div>
            </DialogHeader>
            <div className="mt-5 grid gap-4">
              <p className="rounded-xl border border-border-subtle bg-secondary/50 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">{t("inbox.recommended")} </span>
                {td(item.recommended)}
              </p>
              <div className="grid gap-2">
                <label htmlFor={`ack-note-${item.id}`} className="text-sm font-medium text-foreground">
                  {t("inbox.ack.noteLabel")} <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id={`ack-note-${item.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("inbox.ack.notePlaceholder")}
                  rows={3}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">{t("common.cancel")}</Button>
              </DialogClose>
              <Button type="submit" disabled={!note.trim()}>
                <Check className="size-4" />
                {t("inbox.ack.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dismiss — reason required */}
      <Dialog open={dismissOpen} onOpenChange={(o) => { setDismissOpen(o); if (!o) setReason(""); }}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); confirmDismiss(); }}>
            <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning">
                <Trash2 className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle>{t("inbox.dismiss.title")}</DialogTitle>
                <DialogDescription>{t("inbox.dismiss.desc")}</DialogDescription>
              </div>
            </DialogHeader>
            <div className="mt-5 grid gap-2">
              <label htmlFor={`dismiss-reason-${item.id}`} className="text-sm font-medium text-foreground">
                {t("inbox.dismiss.reasonLabel")} <span className="text-destructive">*</span>
              </label>
              <Textarea
                id={`dismiss-reason-${item.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("inbox.dismiss.reasonPlaceholder")}
                rows={3}
                autoFocus
              />
            </div>
            <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">{t("common.cancel")}</Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={!reason.trim()}>
                <Trash2 className="size-4" />
                {t("inbox.dismiss.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
