"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Layers, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { paramLabel } from "@/lib/mappers";
import type { CompoundOperator, CompoundRule } from "@/features/thresholds/types";
import type { RegionOption } from "@/types/users";
import type { WeatherParameter } from "@/types/shared";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const SEVERITIES = ["yellow", "orange", "red"] as const;
/** backend severity → UI tier label key (yellow=advisory, orange=watch, red=warning). */
const SEVERITY_TIER: Record<(typeof SEVERITIES)[number], string> = {
  yellow: "advisory",
  orange: "watch",
  red: "warning",
};
const SEVERITY_DOT: Record<(typeof SEVERITIES)[number], string> = {
  yellow: "bg-status-advisory",
  orange: "bg-chart-1",
  red: "bg-status-warning",
};

const OPERATORS: CompoundOperator[] = ["gt", "gte", "lt", "lte", "eq"];
const OP_SYMBOL: Record<CompoundOperator, string> = {
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  eq: "=",
};

type CondDraft = { parameter: string; operator: CompoundOperator; value: string; sustain: string };
type RuleDraft = {
  name: string;
  regionId: string;
  severity: (typeof SEVERITIES)[number];
  isActive: boolean;
  conditions: CondDraft[];
};

const emptyCond = (parameter: string): CondDraft => ({
  parameter,
  operator: "gt",
  value: "",
  sustain: "",
});

export function CompoundRulesManager({
  rules,
  regionOptions,
}: {
  rules: CompoundRule[];
  regionOptions: RegionOption[];
}) {
  const { t, td, locale } = useLocale();
  const router = useRouter();
  const { can } = useRole();
  const canManage = can("compound_rules.create") || can("compound_rules.update");

  const [allParams, setAllParams] = React.useState<WeatherParameter[]>([]);
  // Compound conditions target the alertable parameter set.
  const params = React.useMemo(() => allParams.filter((p) => p.alertable), [allParams]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<RuleDraft | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<CompoundRule | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Parameter catalog for the condition builder.
  React.useEffect(() => {
    if (!dialogOpen || allParams.length > 0) return;
    let alive = true;
    fetch(`${BASE}/api/parameters`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.data) setAllParams(j.data as WeatherParameter[]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [dialogOpen, allParams.length]);

  const regionName = React.useCallback(
    (id: string) => regionOptions.find((r) => r.id === id)?.name ?? "—",
    [regionOptions],
  );
  const paramName = React.useCallback(
    (key: string) => {
      const p = allParams.find((x) => x.key === key);
      return p ? (locale === "ar" ? p.nameAr : p.name) : paramLabel(key);
    },
    [allParams, locale],
  );

  const openCreate = () => {
    setEditingId(null);
    setDraft({
      name: "",
      regionId: regionOptions[0]?.id ?? "",
      severity: "orange",
      isActive: true,
      conditions: [emptyCond("rain_rate_mm"), emptyCond("wind_speed_kmh")],
    });
    setDialogOpen(true);
  };

  const openEdit = (rule: CompoundRule) => {
    setEditingId(rule.id);
    setDraft({
      name: rule.name,
      regionId: rule.regionId,
      severity: rule.severity,
      isActive: rule.isActive,
      conditions: rule.conditions.map((c) => ({
        parameter: c.parameter,
        operator: c.operator,
        value: String(c.value),
        sustain: c.sustainMinutes != null ? String(c.sustainMinutes) : "",
      })),
    });
    setDialogOpen(true);
  };

  const ready =
    draft != null &&
    draft.name.trim() !== "" &&
    draft.regionId !== "" &&
    draft.conditions.length >= 2 &&
    draft.conditions.every((c) => c.parameter !== "" && c.value.trim() !== "" && !Number.isNaN(Number(c.value)));

  const save = async () => {
    if (!draft || saving) return;
    if (!ready) {
      toast(t("compound.incomplete"), "info");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: draft.name.trim(),
        region_id: draft.regionId,
        severity: draft.severity,
        is_active: draft.isActive,
        conditions: draft.conditions.map((c) => ({
          parameter: c.parameter,
          operator: c.operator,
          value: Number(c.value),
          sustain_minutes: c.sustain.trim() !== "" ? Number(c.sustain) : null,
        })),
      };
      const url = editingId ? `${BASE}/api/compound-rules/${editingId}` : `${BASE}/api/compound-rules`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast(json.error ?? t("compound.saveFailed"), "info");
        return;
      }
      toast(editingId ? t("compound.updated") : t("compound.created"));
      setDialogOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule: CompoundRule) => {
    setBusyId(rule.id);
    try {
      const res = await fetch(`${BASE}/api/compound-rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !rule.isActive }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast(json.error ?? t("compound.saveFailed"), "info");
        return;
      }
      toast(rule.isActive ? t("compound.disabled") : t("compound.enabled"));
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await fetch(`${BASE}/api/compound-rules/${deleteTarget.id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast(json.error ?? t("compound.deleteFailed"), "info");
        return;
      }
      toast(t("compound.deleted"));
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const condSummary = (rule: CompoundRule) =>
    rule.conditions
      .map((c) => `${paramName(c.parameter)} ${OP_SYMBOL[c.operator]} ${c.value}`)
      .join(" · ");

  const setCond = (i: number, patch: Partial<CondDraft>) =>
    setDraft((d) => (d ? { ...d, conditions: d.conditions.map((c, j) => (j === i ? { ...c, ...patch } : c)) } : d));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle p-4">
        <p className="text-sm text-muted-foreground">
          {t("compound.count", { count: rules.length })}
        </p>
        {can("compound_rules.create") ? (
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {t("compound.newButton")}
          </Button>
        ) : null}
      </div>

      {rules.length === 0 ? (
        <EmptyState icon={Layers} title={t("compound.emptyTitle")} message={t("compound.emptyBody")} />
      ) : (
        <ul className="divide-y divide-border-subtle">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-start gap-4 p-4">
              <span aria-hidden className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", SEVERITY_DOT[rule.severity])} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{td(rule.name)}</span>
                  <Badge variant="secondary" className="shrink-0">{regionName(rule.regionId) === "—" ? "—" : t("region." + regionName(rule.regionId))}</Badge>
                  {!rule.isActive ? (
                    <Badge variant="offline" className="shrink-0">{t("compound.inactive")}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t("compound.allOf")}: {condSummary(rule)}
                </p>
              </div>
              {canManage ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleActive(rule)}
                    disabled={busyId === rule.id || !can("compound_rules.update")}
                    aria-label={t("compound.toggleActive")}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8 text-muted-foreground" aria-label={t("compound.actions")}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {can("compound_rules.update") ? (
                        <DropdownMenuItem onClick={() => openEdit(rule)}>
                          <Pencil className="size-4" />
                          {t("compound.edit")}
                        </DropdownMenuItem>
                      ) : null}
                      {can("compound_rules.delete") ? (
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(rule)}
                          className="text-text-warning focus:bg-status-warning/10 focus:text-text-warning"
                        >
                          <Trash2 className="size-4" />
                          {t("compound.delete")}
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setDraft(null); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
          {draft ? (
            <form onSubmit={(e) => { e.preventDefault(); void save(); }}>
              <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground">
                  <Layers className="size-5" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <DialogTitle>{editingId ? t("compound.editTitle") : t("compound.createTitle")}</DialogTitle>
                  <DialogDescription>{t("compound.createDesc")}</DialogDescription>
                </div>
              </DialogHeader>

              <div className="mt-5 grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="cr-name" className="text-sm font-medium text-foreground">
                    {t("compound.name")} <span className="text-destructive">*</span>
                  </label>
                  <Input id="cr-name" value={draft.name} onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))} placeholder={t("compound.namePlaceholder")} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="cr-region" className="text-sm font-medium text-foreground">
                      {t("compound.region")} <span className="text-destructive">*</span>
                    </label>
                    {regionOptions.length === 0 ? (
                      <p className="rounded-lg border border-border-subtle bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                        {t("compound.noRegions")}
                      </p>
                    ) : (
                      <Select value={draft.regionId} onValueChange={(v) => setDraft((d) => (d ? { ...d, regionId: v } : d))}>
                        <SelectTrigger id="cr-region" className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {regionOptions.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{t("region." + r.name)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="cr-severity" className="text-sm font-medium text-foreground">
                      {t("compound.severity")}
                    </label>
                    <Select value={draft.severity} onValueChange={(v) => setDraft((d) => (d ? { ...d, severity: v as RuleDraft["severity"] } : d))}>
                      <SelectTrigger id="cr-severity" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SEVERITIES.map((s) => (
                          <SelectItem key={s} value={s}>{t("severity." + SEVERITY_TIER[s])}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditions builder */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{t("compound.conditions")}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDraft((d) => (d ? { ...d, conditions: [...d.conditions, emptyCond(params[0]?.key ?? "rain_rate_mm")] } : d))}
                    >
                      <Plus className="size-4" />
                      {t("compound.addCondition")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("compound.conditionsHint")}</p>
                  <div className="grid gap-2">
                    {draft.conditions.map((c, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-secondary/30 p-2">
                        <Select value={c.parameter} onValueChange={(v) => setCond(i, { parameter: v })}>
                          <SelectTrigger className="h-9 min-w-[9rem] flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {params.length === 0 ? (
                              <SelectItem value={c.parameter}>{paramName(c.parameter)}</SelectItem>
                            ) : (
                              params.map((p) => <SelectItem key={p.key} value={p.key}>{locale === "ar" ? p.nameAr : p.name}</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                        <Select value={c.operator} onValueChange={(v) => setCond(i, { operator: v as CompoundOperator })}>
                          <SelectTrigger className="h-9 w-16"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map((op) => <SelectItem key={op} value={op}>{OP_SYMBOL[op]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          inputMode="decimal"
                          dir="ltr"
                          value={c.value}
                          onChange={(e) => setCond(i, { value: e.target.value })}
                          className="h-9 w-20 tabular-nums"
                          placeholder={t("compound.value")}
                          aria-label={t("compound.value")}
                        />
                        <Input
                          type="number"
                          inputMode="numeric"
                          dir="ltr"
                          value={c.sustain}
                          onChange={(e) => setCond(i, { sustain: e.target.value })}
                          className="h-9 w-24 tabular-nums"
                          placeholder={t("compound.sustain")}
                          aria-label={t("compound.sustain")}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 shrink-0 text-muted-foreground hover:text-text-warning"
                          disabled={draft.conditions.length <= 2}
                          onClick={() => setDraft((d) => (d ? { ...d, conditions: d.conditions.filter((_, j) => j !== i) } : d))}
                          aria-label={t("compound.removeCondition")}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
                  <span className="text-sm font-medium text-foreground">{t("compound.active")}</span>
                  <Switch checked={draft.isActive} onCheckedChange={(v) => setDraft((d) => (d ? { ...d, isActive: v } : d))} aria-label={t("compound.active")} />
                </label>
              </div>

              <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">{t("common.cancel")}</Button>
                </DialogClose>
                <Button type="submit" disabled={saving || !ready}>
                  {editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                  {editingId ? t("common.save") : t("compound.createSubmit")}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning">
              <Trash2 className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("compound.deleteTitle")}</DialogTitle>
              <DialogDescription>
                {t("compound.deleteDesc", { name: deleteTarget ? td(deleteTarget.name) : "" })}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={busyId === deleteTarget?.id}>
              <Trash2 className="size-4" />
              {t("compound.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
