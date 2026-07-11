"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { History, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT, useTD } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import type { ThresholdsPage } from "@/features/thresholds/types";

type Change = ThresholdsPage["changes"][number];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Audit trail of threshold edits, with per-entry revert. Sits at the foot of
 *  the screen — available but out of the primary editing flow. Revert asks for
 *  confirmation, since it silently restores earlier threshold values. */
export function ChangeHistory({ changes }: { changes: ThresholdsPage["changes"] }) {
  const t = useT();
  const td = useTD();
  const router = useRouter();
  const { can } = useRole();
  const [reverted, setReverted] = React.useState<Set<string>>(new Set());
  const [pending, setPending] = React.useState<Change | null>(null);
  const [saving, setSaving] = React.useState(false);

  const confirmRevert = async () => {
    if (!pending || saving) return;
    const target = pending;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/thresholds/${target.thresholdId}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history_id: target.id }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast(json.error ?? t("thresholds.history.revertFailed"), "info");
        return;
      }
      setReverted((p) => new Set(p).add(target.id));
      toast(t("thresholds.history.reverted"));
      setPending(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (!changes || changes.length === 0) {
    return (
      <EmptyState
        icon={History}
        title={t("thresholds.history.emptyTitle")}
        message={t("thresholds.history.empty")}
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-border-subtle">
        {changes.map((c) => {
          const isReverted = reverted.has(c.id);
          return (
            <li key={c.id} className="flex items-center gap-4 py-3.5 first:pt-0">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium text-foreground",
                    isReverted && "line-through opacity-60",
                  )}
                >
                  {td(c.change)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("thresholds.history.by", { name: td(c.by) })} · {td(c.when)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground"
                disabled={isReverted || !can("thresholds.update")}
                onClick={() => setPending(c)}
              >
                <RotateCcw className="size-4" />
                {t("thresholds.history.revert")}
              </Button>
            </li>
          );
        })}
      </ul>

      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning"
            >
              <RotateCcw className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("thresholds.history.revertConfirmTitle")}</DialogTitle>
              <DialogDescription>
                {pending
                  ? t("thresholds.history.revertConfirmDesc", { change: td(pending.change) })
                  : ""}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmRevert} disabled={saving}>
              <RotateCcw className="size-4" />
              {t("thresholds.history.revertConfirmCta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
