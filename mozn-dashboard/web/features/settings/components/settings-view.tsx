"use client";

import * as React from "react";
import {
  ArrowRight,
  BellRing,
  Check,
  Info,
  type LucideIcon,
  Palette,
  Pencil,
  Plus,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableBodyRowClass,
  tableHeaderRowClass,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { useMounted } from "@/hooks/use-mounted";
import { useLocale } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import type { SettingsPage, ValidationRule } from "@/features/settings/types";
import type { WeatherParameter } from "@/types/shared";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type SettingsPreferences,
} from "@/features/settings/preferences";

// Writes go through the same-origin route handlers (app/api/settings and
// app/api/validation-rules); BASE prefixes them when the app is served under a
// sub-path, matching users-table / stations-table.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Settings for the MOZN Early Warning System console. Appearance (theme +
// language) applies live through its own providers; the operational sections —
// alerting/escalation, station monitoring, and live data — are a draft committed
// by the Save bar and persisted to localStorage (see features/settings/preferences).
type SectionId = "appearance" | "alerting" | "monitoring" | "live";

const SECTIONS: { id: SectionId; labelKey: string; icon: LucideIcon }[] = [
  { id: "appearance", labelKey: "settings.section.appearance", icon: Palette },
  { id: "alerting", labelKey: "settings.section.alerting", icon: BellRing },
  { id: "monitoring", labelKey: "settings.section.monitoring", icon: RadioTower },
  { id: "live", labelKey: "settings.section.live", icon: RefreshCw },
];

/* ------------------------------- primitives ------------------------------ */

function Row({
  title,
  description,
  htmlFor,
  children,
}: {
  title: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    // Full-width row (keeps the divider edge-to-edge); the label+control content
    // is capped so the control stays visually attached to its label.
    <div className="py-4">
      <div className="flex flex-col gap-2 sm:max-w-2xl sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="sm:max-w-sm">
          <Label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
            {title}
          </Label>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center sm:justify-end">{children}</div>
      </div>
    </div>
  );
}

function Group({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      {title || description ? (
        <div className="pb-1">
          {title ? (
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          ) : null}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="divide-y divide-border-subtle">{children}</div>
    </section>
  );
}

/** Number field with a trailing unit suffix (min, %). */
function NumberField({
  id,
  value,
  onChange,
  unit,
  min,
  max,
  disabled,
  ariaLabel,
}: {
  id?: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    // dir=ltr on the wrapper too: the number Input is LTR (value at the start,
    // pe-12 padding at the end = right), so the unit suffix's `end-3` must also
    // resolve to the right — otherwise it lands on the left and overlaps the value.
    <div dir="ltr" className="relative w-36">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        dir="ltr"
        min={min}
        max={max}
        disabled={disabled}
        aria-label={ariaLabel}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
        className={cn("tabular-nums", unit && "pe-12")}
      />
      {unit ? (
        <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
          {unit}
        </span>
      ) : null}
    </div>
  );
}

/* --------------------------------- view ---------------------------------- */

export function SettingsView({ page }: { page: SettingsPage }) {
  const { t, td, locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { readOnly } = useRole();

  // Minutes unit that agrees with the count: Arabic uses the plural "دقائق" for
  // 3–10 and the singular "دقيقة" otherwise; English "min" is invariant.
  const minutesUnit = (n: number) =>
    t(n >= 3 && n <= 10 ? "settings.unit.minutesPlural" : "settings.unit.minutes");

  const [active, setActive] = React.useState<SectionId>("appearance");
  const [dirty, setDirty] = React.useState(false);

  // Editable data-validation rules (edited via their own dialog, saved immediately).
  const [rules, setRules] = React.useState<ValidationRule[]>(page.validationRules);
  const [editingRule, setEditingRule] = React.useState<ValidationRule | null>(null);
  const [creatingRule, setCreatingRule] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ValidationRule | null>(null);
  const [ruleParams, setRuleParams] = React.useState<WeatherParameter[]>([]);

  // Parameter catalog for the create dialog (from the backend).
  React.useEffect(() => {
    if (!creatingRule || ruleParams.length > 0) return;
    let alive = true;
    fetch(`${BASE}/api/parameters`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.data) setRuleParams(j.data as WeatherParameter[]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [creatingRule, ruleParams.length]);

  // Draft preferences. Defaults are deterministic (safe for SSR); persisted
  // values are merged in after mount to avoid a hydration mismatch. `notif` is
  // seeded from the backend tier list so a fresh install reflects server state.
  const defaults = React.useMemo<SettingsPreferences>(
    () => ({
      ...DEFAULT_PREFERENCES,
      notif: Object.fromEntries(page.notifications.map((n) => [n.id, n.enabled])),
    }),
    [page.notifications],
  );
  const [prefs, setPrefs] = React.useState<SettingsPreferences>(defaults);
  const savedRef = React.useRef(defaults);

  // Client-only hydrate (see the comment above the defaults): seeding persisted
  // values into initial state would desync the server/client markup, so the
  // set-state-in-effect here is deliberate.
  React.useEffect(() => {
    const loaded = loadPreferences(defaults);
    /* eslint-disable react-hooks/set-state-in-effect -- one-time client-only hydrate from localStorage (see comment above) */
    setPrefs(loaded);
    savedRef.current = loaded;
    setDirty(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [defaults]);

  // next-themes reports `theme` only after mount; gate the segmented control so
  // it doesn't render a wrong selection during SSR/first paint.
  const mounted = useMounted();

  const update = <K extends keyof SettingsPreferences>(
    key: K,
    value: SettingsPreferences[K],
  ) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };
  const setNotif = (id: string, value: boolean) => {
    setPrefs((p) => ({ ...p, notif: { ...p.notif, [id]: value } }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (readOnly) return;
    // Operational preferences (units, SLA, thresholds, refresh, region, …) have
    // no backend keys — persist them to localStorage exactly as before.
    savePreferences(prefs);

    // Notification toggles ARE backed by real backend setting keys
    // (page.notifications[].id). Diff against the initial server state and PUT
    // only the toggles that changed to /api/settings.
    let firstError: string | null = null;
    for (const notif of page.notifications) {
      const next = prefs.notif[notif.id] ?? false;
      if (next === notif.enabled) continue;
      const res = await fetch(`${BASE}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: notif.id, value: next ? "true" : "false" }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok && firstError === null) firstError = json.error ?? t("settings.saveFailed");
    }

    if (firstError) {
      // Keep the Save bar (dirty) so the user can retry the failed toggle(s).
      toast(firstError, "info");
      return;
    }

    savedRef.current = prefs;
    setDirty(false);
    toast(t("settings.saved"));
    router.refresh();
  };
  const handleDiscard = () => {
    setPrefs(savedRef.current);
    setDirty(false);
  };

  function renderSection() {
    switch (active) {
      case "appearance":
        return (
          <Group>
            {/* Theme & language apply immediately via their providers (like the
                top bar) — they're intentionally outside the Save draft. */}
            <Row title={t("settings.theme.label")} description={t("settings.theme.desc")} htmlFor="theme">
              <Select
                value={mounted ? theme : undefined}
                onValueChange={(v) => v && setTheme(v)}
              >
                <SelectTrigger id="theme" className="w-40" aria-label={t("settings.theme.label")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("settings.theme.light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.theme.dark")}</SelectItem>
                  <SelectItem value="system">{t("settings.theme.system")}</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row title={t("settings.language.label")} description={t("settings.language.desc")} htmlFor="language">
              <Select value={locale} onValueChange={(v) => v && setLocale(v as Locale)}>
                <SelectTrigger id="language" className="w-40" aria-label={t("settings.language.label")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row title={t("settings.tempUnit.label")} description={t("settings.tempUnit.desc")} htmlFor="tempUnit">
              <Select
                value={prefs.tempUnit}
                onValueChange={(v) => v && update("tempUnit", v as SettingsPreferences["tempUnit"])}
              >
                <SelectTrigger id="tempUnit" className="w-40" aria-label={t("settings.tempUnit.label")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c">°C</SelectItem>
                  <SelectItem value="f">°F</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row title={t("settings.windUnit.label")} description={t("settings.windUnit.desc")} htmlFor="windUnit">
              <Select
                value={prefs.windUnit}
                onValueChange={(v) => v && update("windUnit", v as SettingsPreferences["windUnit"])}
              >
                <SelectTrigger id="windUnit" className="w-40" aria-label={t("settings.windUnit.label")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kmh">km/h</SelectItem>
                  <SelectItem value="ms">m/s</SelectItem>
                  <SelectItem value="kt">kt</SelectItem>
                </SelectContent>
              </Select>
            </Row>

          </Group>
        );

      case "alerting":
        return (
          <div className="space-y-8">
            <Group title={t("settings.urgency.title")} description={t("settings.urgency.desc")}>
              {page.notifications.length === 0 ? (
                <EmptyState icon={BellRing} message={t("settings.urgency.empty")} />
              ) : (
                page.notifications.map((pref) => (
                  <Row key={pref.id} title={td(pref.title)} description={td(pref.description)}>
                    <Switch
                      checked={prefs.notif[pref.id] ?? false}
                      onCheckedChange={(v) => setNotif(pref.id, v)}
                      disabled={readOnly}
                      aria-label={td(pref.title)}
                    />
                  </Row>
                ))
              )}
            </Group>

            <Group title={t("settings.escalation.title")} description={t("settings.escalation.desc")}>
              <Row title={t("settings.sla.label")} description={t("settings.sla.desc")} htmlFor="sla">
                <NumberField
                  id="sla"
                  value={prefs.slaAckMinutes}
                  onChange={(n) => update("slaAckMinutes", n)}
                  unit={minutesUnit(prefs.slaAckMinutes)}
                  min={1}
                  max={240}
                />
              </Row>
              <Row title={t("settings.autoEscalate.label")} description={t("settings.autoEscalate.desc")}>
                <Switch
                  checked={prefs.autoEscalate}
                  onCheckedChange={(v) => update("autoEscalate", v)}
                  aria-label={t("settings.autoEscalate.label")}
                />
              </Row>
              <Row title={t("settings.autoEscalate.after")} description={t("settings.autoEscalate.afterDesc")} htmlFor="esc">
                <NumberField
                  id="esc"
                  value={prefs.autoEscalateMinutes}
                  onChange={(n) => update("autoEscalateMinutes", n)}
                  unit={minutesUnit(prefs.autoEscalateMinutes)}
                  min={1}
                  max={480}
                  disabled={!prefs.autoEscalate}
                  ariaLabel={t("settings.autoEscalate.after")}
                />
              </Row>
            </Group>
          </div>
        );

      case "monitoring":
        return (
          <div className="space-y-8">
            <Group title={t("settings.health.title")} description={t("settings.health.desc")}>
              <Row title={t("settings.offline.label")} description={t("settings.offline.desc")} htmlFor="offline">
                <NumberField
                  id="offline"
                  value={prefs.offlineAfterMinutes}
                  onChange={(n) => update("offlineAfterMinutes", n)}
                  unit={minutesUnit(prefs.offlineAfterMinutes)}
                  min={5}
                  max={720}
                />
              </Row>
              <Row title={t("settings.lowBattery.label")} description={t("settings.lowBattery.desc")} htmlFor="battery">
                <NumberField
                  id="battery"
                  value={prefs.lowBatteryPct}
                  onChange={(n) => update("lowBatteryPct", n)}
                  unit="%"
                  min={1}
                  max={100}
                />
              </Row>
            </Group>

            <div>
              <div className="flex items-start justify-between gap-3 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("settings.validation.groupTitle")}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t("settings.validation.groupDesc")}</p>
                </div>
                {!readOnly ? (
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => setCreatingRule(true)}>
                    <Plus className="size-4" />
                    {t("settings.validation.addRule")}
                  </Button>
                ) : null}
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className={tableHeaderRowClass}>
                      <TableHead className="ps-4">{t("settings.table.metric")}</TableHead>
                      <TableHead>{t("settings.table.validRange")}</TableHead>
                      <TableHead>{t("settings.table.maxRate")}</TableHead>
                      <TableHead>{t("settings.table.status")}</TableHead>
                      <TableHead className="w-12 text-end" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="h-[220px] p-0">
                          <EmptyState
                            icon={ShieldCheck}
                            title={t("settings.validation.emptyTitle")}
                            message={t("settings.validation.empty")}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      rules.map((rule) => (
                        <TableRow key={rule.metric} className={tableBodyRowClass}>
                          <TableCell className="ps-4 font-semibold text-foreground">
                            {td(rule.metric)}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">{td(rule.validRange)}</TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">{td(rule.maxRate)}</TableCell>
                          <TableCell>
                            {rule.active ? (
                              <Badge variant="normal" className="gap-1.5 uppercase tracking-wide">
                                <span className="size-1.5 rounded-full bg-status-normal" />
                                {t("settings.table.active")}
                              </Badge>
                            ) : (
                              <Badge variant="offline" className="gap-1.5 uppercase tracking-wide">
                                <span className="size-1.5 rounded-full bg-status-offline" />
                                {t("users.statusInactive")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => setEditingRule(rule)}
                                disabled={readOnly}
                                aria-label={t("settings.table.edit")}
                              >
                                <Pencil className="size-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-text-warning"
                                onClick={() => setDeleteTarget(rule)}
                                disabled={readOnly}
                                aria-label={t("settings.validation.delete")}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {page.validationNote ? (
                <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {td(page.validationNote)}
                </p>
              ) : null}
            </div>
          </div>
        );

      case "live":
        return (
          <Group title={t("settings.live.title")} description={t("settings.live.desc")}>
            <Row title={t("settings.refresh.label")} description={t("settings.refresh.desc")} htmlFor="refresh">
              <Select
                value={prefs.refreshInterval}
                onValueChange={(v) => update("refreshInterval", v as SettingsPreferences["refreshInterval"])}
              >
                <SelectTrigger id="refresh" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">{t("settings.refresh.off")}</SelectItem>
                  <SelectItem value="30s">{t("settings.refresh.30s")}</SelectItem>
                  <SelectItem value="1m">{t("settings.refresh.1m")}</SelectItem>
                  <SelectItem value="5m">{t("settings.refresh.5m")}</SelectItem>
                  <SelectItem value="15m">{t("settings.refresh.15m")}</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row title={t("settings.region.label")} description={t("settings.region.desc")} htmlFor="region">
              <Select
                value={prefs.defaultRegion}
                onValueChange={(v) => update("defaultRegion", v)}
                disabled={page.regions.length === 0}
              >
                <SelectTrigger id="region" className="w-56">
                  <SelectValue placeholder={t("settings.region.empty")} />
                </SelectTrigger>
                <SelectContent>
                  {["all", ...page.regions.map((r) => r.name)].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r === "all" ? t("settings.region.all") : td(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </Group>
        );
    }
  }

  const activeMeta = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-[228px_minmax(0,1fr)]">
        {/* Section rail */}
        <aside className="lg:sticky lg:top-[96px] lg:self-start">
          <nav
            aria-label={t("settings.title")}
            className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 lg:flex-col"
          >
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-brand-subtle font-semibold text-brand-foreground"
                      : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {/* Active state mirrors the primary sidebar nav: tinted surface +
                      brand indicator bar pinned to the start edge (flips in RTL). */}
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-primary"
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive
                        ? "text-brand-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                    aria-hidden
                  />
                  {t(s.labelKey)}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Active section — sizes to its content. */}
        <Card className="p-6">
          <div className="mb-2 flex items-center gap-2.5 border-b border-border-subtle pb-4">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-subtle text-brand-foreground">
              <activeMeta.icon className="size-5" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold tracking-tight">{t(activeMeta.labelKey)}</h2>
          </div>
          {renderSection()}
        </Card>
      </div>

      {/* Save-on-change bar (operational sections only; appearance is live) */}
      {dirty ? (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card motion-safe:animate-in motion-safe:slide-in-from-bottom-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-status-advisory" aria-hidden />
            {t("settings.unsaved")}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscard}>
              {t("settings.discard")}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={readOnly}>
              <Check className="size-4" />
              {t("common.save")}
            </Button>
          </div>
        </div>
      ) : null}

      {editingRule ? (
        <ValidationRuleDialog
          rule={editingRule}
          onOpenChange={(open) => !open && setEditingRule(null)}
          onSave={async (next) => {
            if (readOnly) return;
            // Persist the structured numeric bounds (null clears a bound) plus
            // the active flag (backed by the rule's is_active column).
            const res = await fetch(`${BASE}/api/validation-rules/${next.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                valid_range_min: next.validRangeMin,
                valid_range_max: next.validRangeMax,
                max_rate_of_change: next.maxRateOfChange,
                rate_interval_min: next.rateIntervalMin,
                is_active: next.active,
              }),
            });
            const json = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) {
              toast(json.error ?? t("settings.saveFailed"), "info");
              return;
            }
            setRules((prev) => prev.map((r) => (r.id === next.id ? next : r)));
            toast(t("settings.validation.saved"));
            setEditingRule(null);
            router.refresh();
          }}
        />
      ) : null}

      {creatingRule ? (
        <CreateValidationRuleDialog
          params={ruleParams.filter((p) => p.validation)}
          regions={page.regions}
          onOpenChange={(open) => !open && setCreatingRule(false)}
          onCreate={async (input) => {
            if (readOnly) return;
            const res = await fetch(`${BASE}/api/validation-rules`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            });
            const json = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) {
              toast(json.error ?? t("settings.validation.createFailed"), "info");
              return;
            }
            toast(t("settings.validation.created"));
            setCreatingRule(false);
            router.refresh();
          }}
        />
      ) : null}

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning">
              <Trash2 className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("settings.validation.deleteTitle")}</DialogTitle>
              <DialogDescription>
                {t("settings.validation.deleteDesc", { metric: deleteTarget ? td(deleteTarget.metric) : "" })}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget || readOnly) return;
                const res = await fetch(`${BASE}/api/validation-rules/${deleteTarget.id}`, { method: "DELETE" });
                const json = (await res.json().catch(() => ({}))) as { error?: string };
                if (!res.ok) {
                  toast(json.error ?? t("settings.validation.deleteFailed"), "info");
                  return;
                }
                setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
                toast(t("settings.validation.deleted"));
                setDeleteTarget(null);
                router.refresh();
              }}
            >
              <Trash2 className="size-4" />
              {t("settings.validation.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --------- Validation-rule string <-> structured field bridging ----------
 * The API contract keeps validRange/maxRate as canonical English strings
 * ("-10 to 60 °C", "15° per 15 min", or "—" for no limit). The editor exposes
 * them as structured numeric fields; we parse on open and re-serialise on save
 * so the wire format is untouched. */

type RangeParts = { min: string; max: string; unit: string };
type RateParts = { enabled: boolean; delta: string; unit: string; window: string };

function parseRange(raw: string): RangeParts {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*to\s*(-?\d+(?:\.\d+)?)\s*(.*)$/i.exec(raw ?? "");
  if (m) return { min: m[1], max: m[2], unit: m[3].trim() };
  return { min: "", max: "", unit: (raw ?? "").trim() };
}

function formatRange({ min, max, unit }: RangeParts): string {
  const u = unit ? ` ${unit}` : "";
  return `${min} to ${max}${u}`;
}

function parseRate(raw: string): RateParts {
  const s = (raw ?? "").trim();
  if (!s || s === "—" || s === "-") return { enabled: false, delta: "", unit: "", window: "" };
  const m = /^(-?\d+(?:\.\d+)?)\s*(\S+?)?\s*per\s*(\d+)\s*min$/i.exec(s);
  if (m) return { enabled: true, delta: m[1], unit: (m[2] ?? "").trim(), window: m[3] };
  return { enabled: true, delta: "", unit: "", window: "" };
}

function formatRate({ enabled, delta, unit, window }: RateParts): string {
  if (!enabled) return "—";
  // No space before a bare degree sign ("15°"); a space before word units ("50 mm").
  const sep = unit && !unit.startsWith("°") ? " " : "";
  return `${delta}${sep}${unit} per ${window} min`;
}

/** Compact number input used inside the range / rate rows. */
function MiniNumber({
  value,
  onChange,
  ariaLabel,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  autoFocus?: boolean;
}) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      dir="ltr"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      className="text-center tabular-nums"
    />
  );
}

/** Static, non-editable unit chip (matches input height). */
function UnitChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      dir="ltr"
      className="grid h-10 min-w-[3.25rem] shrink-0 place-items-center rounded-xl border border-border bg-muted px-3 text-sm font-medium text-muted-foreground"
    >
      {children}
    </span>
  );
}

function ValidationRuleDialog({
  rule,
  onSave,
  onOpenChange,
}: {
  rule: ValidationRule;
  onSave: (next: ValidationRule) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, td } = useLocale();
  // Seed the numeric inputs from the structured backend fields (authoritative);
  // the unit label has no numeric field, so it still comes from the display
  // string. Fall back to the parsed value when a structured field is null.
  const [range, setRange] = React.useState<RangeParts>(() => {
    const parsed = parseRange(rule.validRange);
    return {
      min: rule.validRangeMin != null ? String(rule.validRangeMin) : parsed.min,
      max: rule.validRangeMax != null ? String(rule.validRangeMax) : parsed.max,
      unit: parsed.unit,
    };
  });
  const [rate, setRate] = React.useState<RateParts>(() => {
    const parsed = parseRate(rule.maxRate);
    return {
      enabled: rule.maxRateOfChange != null,
      delta: rule.maxRateOfChange != null ? String(rule.maxRateOfChange) : parsed.delta,
      unit: parsed.unit,
      window: rule.rateIntervalMin != null ? String(rule.rateIntervalMin) : parsed.window,
    };
  });
  const [ruleActive, setRuleActive] = React.useState(rule.active);

  // The rate's unit is preserved from the original string. When a rule that had
  // no limit ("—") is switched on, seed a sensible unit from the range's unit
  // (dropping any "/time" part, e.g. "mm/hr" -> "mm").
  const baseUnit = range.unit.split("/")[0]?.trim() ?? "";
  const enableRate = (on: boolean) =>
    setRate((r) => ({ ...r, enabled: on, unit: r.unit || baseUnit }));

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Send structured numbers, not the parsed display strings. An empty
            // bound or a disabled rate clears that field (null). `active` has no
            // backend field — it stays display-only and is not persisted.
            const num = (v: string) => (v.trim() === "" ? null : Number(v));
            onSave({
              ...rule,
              validRange: formatRange(range),
              maxRate: formatRate(rate),
              active: ruleActive,
              validRangeMin: num(range.min),
              validRangeMax: num(range.max),
              maxRateOfChange: rate.enabled ? num(rate.delta) : null,
              rateIntervalMin: rate.enabled ? num(rate.window) : null,
            });
          }}
        >
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("settings.validation.editTitle", { metric: td(rule.metric) })}</DialogTitle>
              <DialogDescription>{t("settings.validation.editDesc")}</DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-5 grid gap-5">
            {/* Valid range — from / to with a fixed unit chip. */}
            <div className="grid gap-2">
              <span className="text-sm font-medium text-foreground">
                {t("settings.table.validRange")}
              </span>
              <div className="flex items-end gap-2">
                <div className="grid flex-1 gap-1.5">
                  <label htmlFor="vr-min" className="text-xs text-muted-foreground">
                    {t("settings.validation.rangeFrom")}
                  </label>
                  <MiniNumber
                    value={range.min}
                    onChange={(v) => setRange((r) => ({ ...r, min: v }))}
                    ariaLabel={t("settings.validation.rangeFrom")}
                    autoFocus
                  />
                </div>
                <ArrowRight className="mb-3 size-4 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
                <div className="grid flex-1 gap-1.5">
                  <label htmlFor="vr-max" className="text-xs text-muted-foreground">
                    {t("settings.validation.rangeTo")}
                  </label>
                  <MiniNumber
                    value={range.max}
                    onChange={(v) => setRange((r) => ({ ...r, max: v }))}
                    ariaLabel={t("settings.validation.rangeTo")}
                  />
                </div>
                {range.unit ? <UnitChip>{range.unit}</UnitChip> : null}
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.validation.rangeHint")}</p>
            </div>

            {/* Max rate of change — optional; a toggle reveals the fields. */}
            <div className="grid gap-2 rounded-xl border border-border-subtle bg-secondary/30 p-3">
              <label className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {t("settings.validation.limitRate")}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("settings.validation.limitRateHint")}
                  </span>
                </span>
                <Switch
                  checked={rate.enabled}
                  onCheckedChange={enableRate}
                  aria-label={t("settings.validation.limitRate")}
                />
              </label>
              {rate.enabled ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="w-24">
                    <MiniNumber
                      value={rate.delta}
                      onChange={(v) => setRate((r) => ({ ...r, delta: v }))}
                      ariaLabel={t("settings.table.maxRate")}
                    />
                  </div>
                  {rate.unit ? <UnitChip>{rate.unit}</UnitChip> : null}
                  <span className="text-sm text-muted-foreground">{t("settings.validation.ratePer")}</span>
                  <div className="w-24">
                    <MiniNumber
                      value={rate.window}
                      onChange={(v) => setRate((r) => ({ ...r, window: v }))}
                      ariaLabel={t("settings.validation.ratePer")}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t("settings.unit.minutes")}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Rule active */}
            <label className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {t("settings.validation.activeLabel")}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t("settings.validation.activeHint")}
                </span>
              </span>
              <Switch checked={ruleActive} onCheckedChange={setRuleActive} aria-label={t("settings.validation.activeLabel")} />
            </label>
          </div>

          <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button type="submit">
              <Check className="size-4" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Create a new validation rule: pick a parameter (backend catalog) and set its
 *  valid range and optional max rate of change. New rules default to active. */
function CreateValidationRuleDialog({
  params,
  regions,
  onCreate,
  onOpenChange,
}: {
  params: WeatherParameter[];
  regions: { id: string; name: string }[];
  onCreate: (input: {
    parameter: string;
    region_id: string | null;
    valid_range_min: number | null;
    valid_range_max: number | null;
    max_rate_of_change: number | null;
    rate_interval_min: number | null;
  }) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, td, locale } = useLocale();
  const [parameter, setParameter] = React.useState("");
  const [scope, setScope] = React.useState("global");
  const [min, setMin] = React.useState("");
  const [max, setMax] = React.useState("");
  const [rateOn, setRateOn] = React.useState(false);
  const [delta, setDelta] = React.useState("");
  const [rateInterval, setRateInterval] = React.useState("");

  const selected = parameter || params[0]?.key || "";
  const unit = params.find((p) => p.key === selected)?.unit ?? "";
  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selected) return;
            onCreate({
              parameter: selected,
              region_id: scope === "global" ? null : scope,
              valid_range_min: num(min),
              valid_range_max: num(max),
              max_rate_of_change: rateOn ? num(delta) : null,
              rate_interval_min: rateOn ? num(rateInterval) : null,
            });
          }}
        >
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground">
              <Plus className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("settings.validation.createTitle")}</DialogTitle>
              <DialogDescription>{t("settings.validation.createDesc")}</DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-5 grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="new-rule-param" className="text-sm font-medium text-foreground">
                {t("settings.validation.parameter")}
              </label>
              <Select value={selected} onValueChange={setParameter}>
                <SelectTrigger id="new-rule-param" className="w-full">
                  <SelectValue placeholder={t("settings.validation.parameterPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {params.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {locale === "ar" ? p.nameAr : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="new-rule-scope" className="text-sm font-medium text-foreground">
                {t("settings.validation.scope")}
              </label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger id="new-rule-scope" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">{t("settings.validation.scopeGlobal")}</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{td(r.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("settings.validation.scopeHint")}</p>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-foreground">{t("settings.table.validRange")}</span>
              <div className="flex items-end gap-2">
                <div className="grid flex-1 gap-1.5">
                  <label className="text-xs text-muted-foreground">{t("settings.validation.rangeFrom")}</label>
                  <MiniNumber value={min} onChange={setMin} ariaLabel={t("settings.validation.rangeFrom")} />
                </div>
                <ArrowRight className="mb-3 size-4 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
                <div className="grid flex-1 gap-1.5">
                  <label className="text-xs text-muted-foreground">{t("settings.validation.rangeTo")}</label>
                  <MiniNumber value={max} onChange={setMax} ariaLabel={t("settings.validation.rangeTo")} />
                </div>
                {unit ? <UnitChip>{unit}</UnitChip> : null}
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.validation.rangeHint")}</p>
            </div>

            <div className="grid gap-2 rounded-xl border border-border-subtle bg-secondary/30 p-3">
              <label className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{t("settings.validation.limitRate")}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{t("settings.validation.limitRateHint")}</span>
                </span>
                <Switch checked={rateOn} onCheckedChange={setRateOn} aria-label={t("settings.validation.limitRate")} />
              </label>
              {rateOn ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="w-24">
                    <MiniNumber value={delta} onChange={setDelta} ariaLabel={t("settings.table.maxRate")} />
                  </div>
                  {unit ? <UnitChip>{unit}</UnitChip> : null}
                  <span className="text-sm text-muted-foreground">{t("settings.validation.ratePer")}</span>
                  <div className="w-24">
                    <MiniNumber value={rateInterval} onChange={setRateInterval} ariaLabel={t("settings.validation.ratePer")} />
                  </div>
                  <span className="text-sm text-muted-foreground">{t("settings.unit.minutes")}</span>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="mt-6 border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button type="submit" disabled={!selected}>
              <Plus className="size-4" />
              {t("settings.validation.createSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
