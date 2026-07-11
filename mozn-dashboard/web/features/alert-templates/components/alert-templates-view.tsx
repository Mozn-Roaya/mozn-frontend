"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CloudRain,
  Eye,
  GripVertical,
  Headset,
  Info,
  LayoutTemplate,
  type LucideIcon,
  MoreHorizontal,
  Pencil,
  PhoneCall,
  Plus,
  Save,
  ThermometerSnowflake,
  ThermometerSun,
  Trash2,
  TriangleAlert,
  Waves,
  Wind,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { dict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeading } from "@/components/common/page-heading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { useLocale } from "@/components/providers/locale-provider";
import { useAdminConfig } from "@/components/providers/admin-config-provider";
import { useRole } from "@/components/providers/role-provider";
import { SeverityBadge } from "@/components/common/status-badges";
import type {
  AlertTemplate,
  TemplateVersionKey,
} from "@/features/alert-templates/types";
import type { AlertSeverity, LocalizedStep } from "@/types/shared";

// Writes go through the Next route handlers, which the backend serves under the
// dashboard base path in production.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const EVENT_ICON: Record<string, LucideIcon> = {
  flashFlood: Waves,
  heavyRain: CloudRain,
  highWind: Wind,
  heatwave: ThermometerSun,
  coastalSurge: Waves,
  tempDrop: ThermometerSnowflake,
};

// Backend severity tiers map onto the shared alert-severity chip so templates
// reuse the same visual language as the rest of the app.
const SEVERITY_TIER: Record<AlertTemplate["severity"], AlertSeverity> = {
  yellow: "advisory",
  orange: "watch",
  red: "warning",
};

const VERSION_KEYS: TemplateVersionKey[] = ["enDay", "enNight", "arDay", "arNight"];
const isArabicVersion = (k: TemplateVersionKey) => k === "arDay" || k === "arNight";

// Create-dialog option lists. `value` is the snake_case backend event_type
// (getTemplates maps it back to the camelCase eventKey); the labels reuse the
// same templates.event.* copy the rest of the screen shows.
const EVENT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "flash_flood", labelKey: "templates.event.flashFlood" },
  { value: "heavy_rain", labelKey: "templates.event.heavyRain" },
  { value: "high_wind", labelKey: "templates.event.highWind" },
  { value: "heatwave", labelKey: "templates.event.heatwave" },
  { value: "coastal_surge", labelKey: "templates.event.coastalSurge" },
  { value: "temp_drop", labelKey: "templates.event.tempDrop" },
  { value: "custom", labelKey: "templates.event.custom" },
];
// Backend severity tiers, in ascending order — labelled via the shared
// severity.* copy through SEVERITY_TIER (yellow→advisory, etc).
const SEVERITY_OPTIONS: AlertTemplate["severity"][] = ["yellow", "orange", "red"];

/**
 * Structural placeholder used only when there are no templates to select, so
 * `active` (below) is always a well-typed `AlertTemplate` and every hook that
 * reads it can run unconditionally. Every field is blank/empty — this is not
 * seed content and is never inserted into `templates`.
 */
const EMPTY_TEMPLATE: AlertTemplate = {
  id: "",
  eventKey: "",
  eventType: "",
  severity: "yellow",
  versions: { enDay: "", enNight: "", arDay: "", arNight: "" },
  steps: [],
};

const doneCount = (v: Record<TemplateVersionKey, string>) =>
  VERSION_KEYS.filter((k) => v[k].trim() !== "").length;

/**
 * Four-segment meter mirroring the four required versions (EN/AR × day/night).
 * Lives in the editor header as the single detailed completion read — the
 * template list uses a plain ready/×4 marker so the two don't compete.
 */
function VersionMeter({ done }: { done: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {VERSION_KEYS.map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-6 rounded-full transition-colors",
            i < done ? "bg-status-normal" : "bg-muted",
          )}
        />
      ))}
    </span>
  );
}

export function AlertTemplatesView({
  initialTemplates,
}: {
  initialTemplates: AlertTemplate[];
}) {
  const { t } = useLocale();
  const { contactsForCity } = useAdminConfig();
  const router = useRouter();
  const { can } = useRole();
  // Every control is gated on the real backend permission for the endpoint it
  // calls (not the coarse readOnly flag): "whoever logs in sees exactly what
  // they can do". Create → POST, edit/save/steps → PUT, delete → DELETE.
  const canCreate = can("templates.create");
  const canEdit = can("templates.update");
  const canDelete = can("templates.delete");
  // The preview mirrors the citizen alert card, which shows national emergency
  // numbers; templates aren't city-scoped, so fall back to the national default.
  const contacts = contactsForCity();

  // Server data is the source of truth; after each write we router.refresh(),
  // which re-runs the page and hands us fresh rows via `initialTemplates`.
  const [templates, setTemplates] = React.useState<AlertTemplate[]>(initialTemplates);
  const [activeId, setActiveId] = React.useState("");

  // Reconcile the freshly-fetched rows in during render (the pattern used
  // elsewhere in this file). If the active template was deleted upstream, drop
  // the stale id so the editor falls back to the first remaining template.
  const [loadedFrom, setLoadedFrom] = React.useState(initialTemplates);
  if (loadedFrom !== initialTemplates) {
    setLoadedFrom(initialTemplates);
    setTemplates(initialTemplates);
    if (activeId && !initialTemplates.some((tp) => tp.id === activeId)) {
      setActiveId("");
    }
  }

  const hasTemplates = templates.length > 0;
  const active =
    templates.find((tp) => tp.id === activeId) ?? templates[0] ?? EMPTY_TEMPLATE;

  // Event names are keyed under templates.event.*; unknown backend event types
  // fall back to the generic "New template" label.
  const eventLabel = React.useCallback(
    (key: string) =>
      dict["templates.event." + key]
        ? t("templates.event." + key)
        : t("templates.event.custom"),
    [t],
  );

  // A template's display name is its event label plus its severity tier, so the
  // same event at multiple severities reads distinctly everywhere the name is
  // shown as plain text (list rows, delete dialog, aria labels).
  const templateName = React.useCallback(
    (tp: AlertTemplate) =>
      `${eventLabel(tp.eventKey)} · ${t("severity." + SEVERITY_TIER[tp.severity])}`,
    [eventLabel, t],
  );

  // Open a template for editing. Selecting a row already swaps the (always
  // visible) editor, so a plain setActiveId here was a no-op on the template
  // that's already active — "Edit" looked broken. We also bring the editor into
  // view and focus its first message field for feedback every time. The focus
  // move must happen in the menu's onCloseAutoFocus (below): Radix returns focus
  // to the trigger on close, which would otherwise clobber an earlier focus().
  const pendingEditFocus = React.useRef(false);
  const openEdit = (tp: AlertTemplate) => {
    setActiveId(tp.id);
    pendingEditFocus.current = true;
  };
  const focusEditor = (e: Event) => {
    if (!pendingEditFocus.current) return;
    pendingEditFocus.current = false;
    e.preventDefault(); // keep Radix from restoring focus to the trigger
    const first = document.getElementById("tpl-enDay") as HTMLTextAreaElement | null;
    if (!first) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    first.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    first.focus({ preventScroll: true });
  };

  // Create dialog. It keeps its own draft — event_type + severity + the four
  // messages + steps — kept entirely separate from the (always-visible) editor's
  // draft/steps for the active template, so opening it never disturbs an in-flight
  // edit. Every field resets to blank each time it opens.
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createEventType, setCreateEventType] = React.useState(EVENT_OPTIONS[0].value);
  const [createSeverity, setCreateSeverity] =
    React.useState<AlertTemplate["severity"]>("yellow");
  const [createMsg, setCreateMsg] = React.useState<Record<TemplateVersionKey, string>>({
    enDay: "",
    enNight: "",
    arDay: "",
    arNight: "",
  });
  const [createSteps, setCreateSteps] = React.useState<LocalizedStep[]>([{ en: "", ar: "" }]);
  const [creating, setCreating] = React.useState(false);

  const openCreate = () => {
    if (!canCreate) return;
    setCreateEventType(EVENT_OPTIONS[0].value);
    setCreateSeverity("yellow");
    setCreateMsg({ enDay: "", enNight: "", arDay: "", arNight: "" });
    setCreateSteps([{ en: "", ar: "" }]);
    setCreateOpen(true);
  };

  // Create-dialog step helpers — parallel to the editor's, over createSteps.
  const setCreateStep = (i: number, lang: keyof LocalizedStep, value: string) =>
    setCreateSteps((s) => s.map((st, idx) => (idx === i ? { ...st, [lang]: value } : st)));
  const addCreateStep = () => setCreateSteps((s) => [...s, { en: "", ar: "" }]);
  const removeCreateStep = (i: number) =>
    setCreateSteps((s) => s.filter((_, idx) => idx !== i));

  const submitCreate = async () => {
    if (!canCreate || creating) return;
    // Same backend contract as Save: all four versions + ≥1 step with no empty
    // element (each side non-empty).
    if (VERSION_KEYS.some((k) => createMsg[k].trim() === "")) {
      toast(t("templates.saveIncomplete"), "info");
      return;
    }
    const validSteps = createSteps
      .map((s) => ({ en: s.en.trim(), ar: s.ar.trim() }))
      .filter((s) => s.en !== "" && s.ar !== "");
    if (validSteps.length < 1) {
      toast(t("templates.stepsRequired"), "info");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: createEventType,
          severity: createSeverity,
          message_en_day: createMsg.enDay,
          message_en_night: createMsg.enNight,
          message_ar_day: createMsg.arDay,
          message_ar_night: createMsg.arNight,
          guidance_steps_en: validSteps.map((s) => s.en),
          guidance_steps_ar: validSteps.map((s) => s.ar),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        data?: unknown;
      };
      if (!res.ok) {
        // Surfaces the backend 409 when (event_type, severity) already exists.
        toast(json.error ?? t("templates.saveFailed"), "info");
        return;
      }
      toast(t("templates.createdToast"));
      setCreateOpen(false);
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  // Delete — confirmed, since there's no undo.
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const deleteTarget = templates.find((tp) => tp.id === deleteId) ?? null;
  const confirmDelete = async () => {
    if (!deleteId || !canDelete) return;
    const res = await fetch(`${BASE}/api/templates/${deleteId}`, { method: "DELETE" });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast(json.error ?? t("templates.deleteFailed"), "info");
      setDeleteId(null);
      return;
    }
    toast(t("templates.deletedToast"));
    setDeleteId(null);
    router.refresh();
  };

  // Draft buffers for the active template; Save commits them. Steps live on the
  // row now, so they seed straight from the active template.
  const [draft, setDraft] = React.useState<Record<TemplateVersionKey, string>>(active.versions);
  const [steps, setSteps] = React.useState<LocalizedStep[]>(active.steps);
  const [previewKey, setPreviewKey] = React.useState<TemplateVersionKey>("enDay");

  // Reset the drafts when the resolved active template changes (a selection, or
  // a delete that falls the editor back to another row). Adjusting state during
  // render — tracked against the previously loaded id — rather than in an effect
  // avoids a frame showing the old template's draft.
  const [draftForId, setDraftForId] = React.useState(active.id);
  if (draftForId !== active.id) {
    setDraftForId(active.id);
    setDraft(active.versions);
    setSteps(active.steps);
  }

  const done = doneCount(draft);
  const ready = done === VERSION_KEYS.length;
  const versionsDirty = VERSION_KEYS.some((k) => draft[k] !== active.versions[k]);
  const stepsDirty =
    steps.length !== active.steps.length ||
    steps.some((s, i) => s.en !== active.steps[i].en || s.ar !== active.steps[i].ar);
  const canSave = canEdit && (versionsDirty || stepsDirty);

  const Icon = EVENT_ICON[active.eventKey] ?? TriangleAlert;
  const eventName = eventLabel(active.eventKey);

  // Step list helpers. Each step holds both languages; edits target one side.
  const setStep = (i: number, lang: keyof LocalizedStep, value: string) =>
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, [lang]: value } : st)));
  const addStep = () => setSteps((s) => [...s, { en: "", ar: "" }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const moveStep = (i: number, dir: -1 | 1) => moveStepTo(i, i + dir);
  const moveStepTo = (from: number, to: number) =>
    setSteps((s) => {
      if (to < 0 || to >= s.length || from === to) return s;
      const next = [...s];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // Drag-to-reorder state for the step list (native HTML5 DnD, drag from handle).
  const [dragStep, setDragStep] = React.useState<number | null>(null);
  const [overStep, setOverStep] = React.useState<number | null>(null);
  const endStepDrag = () => {
    setDragStep(null);
    setOverStep(null);
  };

  const save = async () => {
    if (!canEdit) return;
    // The backend requires all four message versions and at least one guidance
    // step (each with no empty element), so validate before sending.
    if (VERSION_KEYS.some((k) => draft[k].trim() === "")) {
      toast(t("templates.saveIncomplete"), "info");
      return;
    }
    const validSteps = steps
      .map((s) => ({ en: s.en.trim(), ar: s.ar.trim() }))
      .filter((s) => s.en !== "" && s.ar !== "");
    if (validSteps.length < 1) {
      toast(t("templates.stepsRequired"), "info");
      return;
    }
    const res = await fetch(`${BASE}/api/templates/${active.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_en_day: draft.enDay,
        message_en_night: draft.enNight,
        message_ar_day: draft.arDay,
        message_ar_night: draft.arNight,
        guidance_steps_en: validSteps.map((s) => s.en),
        guidance_steps_ar: validSteps.map((s) => s.ar),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast(json.error ?? t("templates.saveFailed"), "info");
      return;
    }
    // Reflect the cleaned steps locally so Save settles to "no changes" until
    // the refreshed rows arrive.
    setSteps(validSteps);
    toast(t("templates.savedToast"));
    router.refresh();
  };

  const previewText = draft[previewKey].trim();
  const previewArabic = isArabicVersion(previewKey);
  // The preview mirrors the citizen card: show each step in the previewed
  // language, falling back to the other side when one is still blank.
  const previewSteps = steps
    .map((s) => (previewArabic ? s.ar || s.en : s.en || s.ar).trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeading title={t("page.templates.title")} subtitle={t("page.templates.subtitle")} />

      {/* Three panes: pick (list) → edit (editor) → result (preview). Left and
          right rails are sticky so the busy centre editor scrolls between them;
          on narrow screens the grid collapses to a single stacked column. */}
      <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)_360px]">
        {/* ── Pane 1 · Template list ─────────────────────────────────────── */}
        <Card className="flex flex-col overflow-hidden p-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {t("templates.libraryTitle")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              onClick={openCreate}
              disabled={!canCreate}
              title={t("templates.newTemplate")}
              aria-label={t("templates.newTemplate")}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <ul className="flex flex-col gap-0.5 overflow-y-auto p-2">
            {!hasTemplates ? (
              <li className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                <LayoutTemplate className="size-5 text-muted-foreground" aria-hidden />
                <span className="text-sm text-muted-foreground">
                  {t("templates.list.empty")}
                </span>
              </li>
            ) : (
            templates.map((tp) => {
              const tdone = doneCount(tp.versions);
              const tready = tdone === VERSION_KEYS.length;
              const TIcon = EVENT_ICON[tp.eventKey] ?? TriangleAlert;
              const selected = tp.id === activeId;
              const status = tready
                ? t("templates.complete")
                : t("templates.incomplete", { done: tdone });
              return (
                <li key={tp.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveId(tp.id)}
                    aria-pressed={selected}
                    aria-label={t("templates.selectAria", { event: templateName(tp), status })}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg py-2 pe-9 ps-2.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "bg-brand-subtle" : "hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <TIcon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {templateName(tp)}
                      </span>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          tready ? "text-status-normal" : "text-status-advisory",
                        )}
                      >
                        {tready ? t("templates.complete") : `${tdone}/4`}
                      </span>
                    </span>
                    {tready ? (
                      <Check className="size-4 shrink-0 text-status-normal" aria-hidden />
                    ) : (
                      <span className="size-1.5 shrink-0 rounded-full bg-status-advisory" aria-hidden />
                    )}
                  </button>

                  {/* Row actions — a sibling of the select button (not nested) so
                      we never place an interactive control inside another. */}
                  <div className="absolute end-1 top-1/2 -translate-y-1/2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          aria-label={t("templates.actionsAria", { event: templateName(tp) })}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onCloseAutoFocus={focusEditor}>
                        <DropdownMenuItem onClick={() => openEdit(tp)}>
                          <Pencil className="size-4" />
                          {t("templates.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(tp.id)}
                          disabled={!canDelete}
                          className="text-text-warning focus:bg-status-warning/10 focus:text-text-warning"
                        >
                          <Trash2 className="size-4" />
                          {t("templates.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })
            )}
          </ul>
        </Card>

        {hasTemplates ? (
        <>
        {/* ── Pane 2 · Editor ────────────────────────────────────────────── */}
        <Card className="divide-y divide-border-subtle p-0">
          {/* Header — active template, severity, live completion meter, Save. */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground">
                <Icon className="size-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                    {eventName}
                  </h2>
                  <SeverityBadge severity={SEVERITY_TIER[active.severity]} />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <VersionMeter done={done} />
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      ready ? "text-status-normal" : "text-status-advisory",
                    )}
                  >
                    {ready ? t("templates.complete") : `${done}/4`}
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={save} disabled={!canSave}>
              <Save className="size-4" />
              {t("templates.save")}
            </Button>
          </div>

          {/* Message versions — 2×2 matrix: Language × day/night. */}
          <div className="p-5">
            <SectionHead
              title={t("templates.section.messages")}
              hint={t("templates.section.messagesHint")}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {VERSION_KEYS.map((k) => {
                const ar = isArabicVersion(k);
                const filled = draft[k].trim() !== "";
                return (
                  <div key={k} className="grid gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={`tpl-${k}`} className="text-sm font-medium text-foreground">
                        {t("templates.v." + k)}
                      </label>
                      {filled ? (
                        <Check className="size-4 text-status-normal" aria-hidden />
                      ) : (
                        <span className="size-1.5 rounded-full bg-status-advisory" aria-hidden />
                      )}
                    </div>
                    <Textarea
                      id={`tpl-${k}`}
                      value={draft[k]}
                      onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                      onFocus={() => setPreviewKey(k)}
                      disabled={!canEdit}
                      dir={ar ? "rtl" : "ltr"}
                      rows={3}
                      className={cn(
                        "min-h-20 resize-none",
                        !filled && "border-status-advisory/40",
                      )}
                      placeholder={ar ? t("templates.placeholder.ar") : t("templates.placeholder.en")}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Response steps. */}
          <div className="p-5">
            <SectionHead
              title={t("templates.section.steps")}
              hint={t("templates.section.stepsHint")}
            />
            {/* Drag a row by its handle to reorder; the handle is also
                keyboard-operable (ArrowUp/ArrowDown) for a11y. */}
            <ul className="mt-4 grid gap-2">
              {steps.length === 0 ? (
                <li className="rounded-xl border border-dashed border-border bg-secondary/40 py-6 text-center text-sm text-muted-foreground">
                  {t("templates.noSteps")}
                </li>
              ) : (
                steps.map((step, i) => (
                  <li
                    key={i}
                    onDragOver={(e) => {
                      if (dragStep === null) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (overStep !== i) setOverStep(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragStep !== null) moveStepTo(dragStep, i);
                      endStepDrag();
                    }}
                    className={cn(
                      "flex items-start gap-2 rounded-lg transition-colors",
                      dragStep === i && "opacity-40",
                      overStep === i &&
                        dragStep !== null &&
                        dragStep !== i &&
                        "bg-brand-subtle/50 ring-2 ring-inset ring-brand-foreground/40",
                    )}
                  >
                    <button
                      type="button"
                      draggable={canEdit}
                      disabled={!canEdit}
                      onDragStart={(e) => {
                        setDragStep(i);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(i));
                      }}
                      onDragEnd={endStepDrag}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          moveStep(i, -1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          moveStep(i, 1);
                        }
                      }}
                      className="mt-1 grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing disabled:cursor-default disabled:opacity-50"
                      aria-label={t("templates.dragStep", { n: i + 1 })}
                      title={t("templates.dragStep", { n: i + 1 })}
                    >
                      <GripVertical className="size-4" aria-hidden />
                    </button>
                    <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand-subtle text-xs font-semibold tabular-nums text-brand-foreground">
                      {i + 1}
                    </span>
                    {/* Both language versions of the one step, kept in the same
                        row so they stay paired through reorder / add / remove. */}
                    <div className="grid flex-1 gap-1.5">
                      <Input
                        value={step.en}
                        dir="ltr"
                        disabled={!canEdit}
                        onChange={(e) => setStep(i, "en", e.target.value)}
                        placeholder={t("templates.stepHint.en")}
                        aria-label={t("templates.stepEn", { n: i + 1 })}
                      />
                      <Input
                        value={step.ar}
                        dir="rtl"
                        disabled={!canEdit}
                        onChange={(e) => setStep(i, "ar", e.target.value)}
                        placeholder={t("templates.stepHint.ar")}
                        aria-label={t("templates.stepAr", { n: i + 1 })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-1 size-8 shrink-0 text-muted-foreground hover:text-text-warning"
                      onClick={() => removeStep(i)}
                      disabled={!canEdit}
                      aria-label={t("templates.removeStep")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-fit"
              onClick={addStep}
              disabled={!canEdit}
            >
              <Plus className="size-4" />
              {t("templates.addStep")}
            </Button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5 shrink-0" aria-hidden />
              {t("templates.emergencyNote")}
            </p>
          </div>
        </Card>

        {/* ── Pane 3 · Live preview (sticky) ─────────────────────────────── */}
        <Card className="p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-4">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-subtle text-brand-foreground">
              <Eye className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">{t("templates.preview")}</h2>
              {/* Name the version being previewed so it isn't implicit — it
                  follows whichever message field is focused. */}
              <p className="truncate text-xs text-muted-foreground">
                {t("templates.v." + previewKey)}
              </p>
            </div>
          </div>

          {/* Citizen-facing banner mock — mirrors the live AlertCard citizens see
              in the station detail (see station-summary-card.tsx): a tinted
              warning header band with a LIVE pill, then the numbered response
              steps and national emergency contacts. */}
          <div
            dir={previewArabic ? "rtl" : "ltr"}
            className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            {/* Header band */}
            <div className="bg-status-warning/10 px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <TriangleAlert className="size-5 shrink-0 text-status-warning" aria-hidden />
                  <span className="truncate text-lg font-bold text-foreground">{eventName}</span>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-status-warning px-2 py-0.5">
                  <span className="size-1 rounded-full bg-white" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
                    {t("dashboard.station.live")}
                  </span>
                </span>
              </div>
              {previewText ? (
                <p className="mt-2 text-xs leading-[18px] text-text-secondary">{previewText}</p>
              ) : (
                <p className="mt-2 text-xs italic leading-[18px] text-muted-foreground">
                  {t("templates.preview.empty")}
                </p>
              )}
            </div>

            {/* Expanded body: response steps + emergency contacts */}
            {previewSteps.length > 0 ? (
              <div className="flex flex-col gap-4 px-5 py-4">
                <ol className="flex flex-col gap-3.5">
                  {previewSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-status-warning/10 text-xs font-semibold tabular-nums text-status-warning">
                        {i + 1}
                      </span>
                      <p className="flex-1 text-sm text-foreground">{step}</p>
                    </li>
                  ))}
                </ol>
                <div className="h-px w-full bg-border-subtle" />
                <div className="flex gap-2.5">
                  <ContactTile
                    icon={Headset}
                    label={t("dashboard.station.emergencyServices")}
                    number={contacts.emergencyServices}
                  />
                  <ContactTile
                    icon={PhoneCall}
                    label={t("dashboard.station.civilDefense")}
                    number={contacts.civilDefense}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Info note */}
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-text-link/10 px-3.5 py-3 text-xs leading-relaxed text-text-link">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("templates.preview.note")}
          </p>
        </Card>
        </>
        ) : (
        <Card className="lg:col-span-2">
          <EmptyState
            icon={LayoutTemplate}
            title={t("templates.empty.title")}
            message={t("templates.empty.body")}
            action={
              <Button onClick={openCreate} disabled={!canCreate}>
                <Plus className="size-4" />
                {t("templates.newTemplate")}
              </Button>
            }
          />
        </Card>
        )}
      </div>

      {/* Create template — picks the (event_type, severity) identity this screen's
          inline editor can't set, then the same four messages + steps. */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] sm:max-w-2xl">
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-foreground"
            >
              <LayoutTemplate className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("templates.create.title")}</DialogTitle>
              <DialogDescription>{t("templates.create.desc")}</DialogDescription>
            </div>
          </DialogHeader>

          <form
            id="template-create-form"
            className="grid max-h-[calc(92vh-13rem)] gap-5 overflow-y-auto pe-1"
            onSubmit={(e) => {
              e.preventDefault();
              submitCreate();
            }}
          >
            {/* Identity — event type × severity (the backend unique key). */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label
                  htmlFor="tpl-create-event"
                  className="text-sm font-medium text-foreground"
                >
                  {t("templates.create.eventLabel")}
                </label>
                <Select value={createEventType} onValueChange={setCreateEventType}>
                  <SelectTrigger id="tpl-create-event" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {t(o.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="tpl-create-severity"
                  className="text-sm font-medium text-foreground"
                >
                  {t("templates.create.severityLabel")}
                </label>
                <Select
                  value={createSeverity}
                  onValueChange={(v) =>
                    setCreateSeverity(v as AlertTemplate["severity"])
                  }
                >
                  <SelectTrigger id="tpl-create-severity" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((sev) => (
                      <SelectItem key={sev} value={sev}>
                        {t("severity." + SEVERITY_TIER[sev])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Message versions — 2×2 matrix, AR fields RTL. */}
            <div>
              <SectionHead
                title={t("templates.section.messages")}
                hint={t("templates.section.messagesHint")}
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {VERSION_KEYS.map((k) => {
                  const ar = isArabicVersion(k);
                  return (
                    <div key={k} className="grid gap-1.5">
                      <label
                        htmlFor={`tpl-create-${k}`}
                        className="text-sm font-medium text-foreground"
                      >
                        {t("templates.v." + k)}
                      </label>
                      <Textarea
                        id={`tpl-create-${k}`}
                        value={createMsg[k]}
                        onChange={(e) =>
                          setCreateMsg((d) => ({ ...d, [k]: e.target.value }))
                        }
                        dir={ar ? "rtl" : "ltr"}
                        rows={3}
                        className="min-h-20 resize-none"
                        placeholder={
                          ar
                            ? t("templates.placeholder.ar")
                            : t("templates.placeholder.en")
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Response steps — bilingual rows with add/remove (at least one). */}
            <div>
              <SectionHead
                title={t("templates.section.steps")}
                hint={t("templates.section.stepsHint")}
              />
              <ul className="mt-4 grid gap-2">
                {createSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand-subtle text-xs font-semibold tabular-nums text-brand-foreground">
                      {i + 1}
                    </span>
                    <div className="grid flex-1 gap-1.5">
                      <Input
                        value={step.en}
                        dir="ltr"
                        onChange={(e) => setCreateStep(i, "en", e.target.value)}
                        placeholder={t("templates.stepHint.en")}
                        aria-label={t("templates.stepEn", { n: i + 1 })}
                      />
                      <Input
                        value={step.ar}
                        dir="rtl"
                        onChange={(e) => setCreateStep(i, "ar", e.target.value)}
                        placeholder={t("templates.stepHint.ar")}
                        aria-label={t("templates.stepAr", { n: i + 1 })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="mt-1 size-8 shrink-0 text-muted-foreground hover:text-text-warning"
                      onClick={() => removeCreateStep(i)}
                      disabled={createSteps.length <= 1}
                      aria-label={t("templates.removeStep")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="mt-3 w-fit"
                onClick={addCreateStep}
              >
                <Plus className="size-4" />
                {t("templates.addStep")}
              </Button>
            </div>
          </form>

          <DialogFooter className="border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" form="template-create-form" disabled={creating || !canCreate}>
              <Plus className="size-4" />
              {t("templates.create.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete template — confirmed (no undo) */}
      <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-warning/10 text-text-warning"
            >
              <TriangleAlert className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("templates.delete.title")}</DialogTitle>
              <DialogDescription>
                {t("templates.delete.desc", {
                  name: deleteTarget ? templateName(deleteTarget) : "",
                })}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="border-t border-border-subtle pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                {t("common.cancel")}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              type="button"
              onClick={confirmDelete}
              disabled={!canDelete}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Emergency-contact tile in the preview — matches the citizen AlertCard. */
function ContactTile({
  icon: Icon,
  label,
  number,
}: {
  icon: LucideIcon;
  label: string;
  number: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-[10px] text-muted-foreground">{label}</p>
        <p className="text-base font-bold tabular-nums text-foreground">{number}</p>
      </div>
    </div>
  );
}

function SectionHead({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
