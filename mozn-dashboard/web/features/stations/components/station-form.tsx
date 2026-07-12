"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Check,
  Info,
  MapPin,
  Radar,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { useLocale } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import { StationSummaryCard } from "@/components/station-detail/station-summary-card";
import type { StationDetail } from "@/components/station-detail/station-detail";
import type { MunicipalityOption } from "@/lib/api";
import {
  isInLibya,
  SENSORS,
  sensorsToParams,
  type SensorKey,
  type StationFormValue,
  type StationInitialStatus,
} from "./station-form-shared";

// Leaflet touches `window` on import — load the picker client-only.
const StationLocationPicker = dynamic(
  () =>
    import("@/components/maps/station-location-picker").then(
      (m) => m.StationLocationPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center bg-secondary/50 text-sm text-muted-foreground">
        …
      </div>
    ),
  },
);

export interface StationFormInitial {
  /** Real station UUID (edit mode) — the PUT target + shown as the Station ID. */
  id?: string;
  name: string;
  nameAr: string;
  region: string;
  city?: string;
  code?: string;
  /** Owning municipality UUID (edit mode) — preselects the city + its contacts. */
  municipalityId?: string;
  latitude?: number;
  longitude?: number;
  /** Backend sensor param keys (e.g. "temp_high_c"); mapped to FE sensor groups. */
  sensors?: string[];
  operationalStatus?: "active" | "maintenance" | "deactivated";
  wuStationId?: string | null;
}

const CONTACTS_API_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function hashCode(s: string): string {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `MZN-${String((h % 9000) + 1000)}`;
}

export function StationForm({
  mode,
  regions,
  initial,
}: {
  mode: "create" | "edit";
  regions: string[];
  initial?: StationFormInitial;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const { can } = useRole();
  const [saving, setSaving] = React.useState(false);
  // Persisting a station hits POST /api/stations (create) or PUT /api/stations/:id
  // (edit); gate on the matching backend permission for the current mode.
  const canPersistStation = can(mode === "create" ? "stations.create" : "stations.update");
  // Emergency contacts persist via PUT /api/municipalities/:id.
  const canEditContacts = can("municipalities.update");

  // Derive the editable defaults from the (edit-mode) station detail so a save
  // round-trips the real values instead of clobbering coords/sensors/interval.
  const initialStatus: StationInitialStatus =
    initial?.operationalStatus === "maintenance"
      ? "maintenance"
      : initial?.operationalStatus === "deactivated"
        ? "offline"
        : "active";
  // Per-station sensor selection isn't configurable yet — every station reports
  // the full set — so all sensors are pre-selected and the picker is shown
  // disabled (a placeholder for a future per-station-type capability).
  const initialSensors = SENSORS.reduce(
    (acc, s) => ({ ...acc, [s]: true }),
    {} as Record<SensorKey, boolean>,
  );

  const [form, setForm] = React.useState<StationFormValue>(() => ({
    name: initial?.name ?? "",
    nameAr: initial?.nameAr ?? "",
    region: initial?.region ?? regions[0] ?? "",
    city: initial?.city ?? initial?.name?.split(/\s+/)[0] ?? "",
    municipalityId: initial?.municipalityId ?? "",
    wuStationId: initial?.wuStationId ?? "",
    lat: initial?.latitude != null ? String(initial.latitude) : "",
    lng: initial?.longitude != null ? String(initial.longitude) : "",
    status: initialStatus,
    sensors: initialSensors,
  }));

  const set = <K extends keyof StationFormValue>(key: K, value: StationFormValue[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Emergency contacts (per municipality) ─────────────────────────────────
  // Contacts live on the municipality (backend), not localStorage: pick the
  // city, edit the two numbers, and they persist on blur via the municipalities
  // API. readOnly (Gov Viewer) can view but not edit.
  const [municipalities, setMunicipalities] = React.useState<MunicipalityOption[]>([]);
  const [contacts, setContacts] = React.useState({ emergencyServices: "", civilDefense: "" });
  const [contactsSaving, setContactsSaving] = React.useState(false);
  const savedContactsRef = React.useRef({ emergencyServices: "", civilDefense: "" });

  React.useEffect(() => {
    let alive = true;
    fetch(`${CONTACTS_API_BASE}/api/municipalities`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!alive) return;
        const list: MunicipalityOption[] = Array.isArray(data) ? data : [];
        setMunicipalities(list);
        // Edit mode: seed the contact inputs from the station's municipality.
        const current = list.find((m) => m.id === (initial?.municipalityId ?? ""));
        if (current) {
          const c = { emergencyServices: current.emergencyServices, civilDefense: current.civilDefense };
          setContacts(c);
          savedContactsRef.current = c;
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [initial?.municipalityId]);

  // Prefer municipalities in the selected region; fall back to all if none match.
  const municipalityOptions = React.useMemo(() => {
    const forRegion = municipalities.filter((m) => m.region === form.region);
    return forRegion.length > 0 ? forRegion : municipalities;
  }, [municipalities, form.region]);

  const selectMunicipality = (id: string) => {
    set("municipalityId", id);
    const m = municipalities.find((x) => x.id === id);
    if (m) {
      set("city", m.name);
      const c = { emergencyServices: m.emergencyServices, civilDefense: m.civilDefense };
      setContacts(c);
      savedContactsRef.current = c;
    }
  };

  const saveContacts = async () => {
    if (!canEditContacts || !form.municipalityId) return;
    if (
      contacts.emergencyServices === savedContactsRef.current.emergencyServices &&
      contacts.civilDefense === savedContactsRef.current.civilDefense
    ) {
      return; // nothing changed
    }
    setContactsSaving(true);
    try {
      const res = await fetch(`${CONTACTS_API_BASE}/api/municipalities/${form.municipalityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contacts),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast(json.error ?? t("stations.contactsSaveFailed"), "info");
        return;
      }
      savedContactsRef.current = contacts;
      toast(t("stations.contactsSaved"));
    } finally {
      setContactsSaving(false);
    }
  };

  const lat = parseFloat(form.lat);
  const lng = parseFloat(form.lng);
  const hasCoords = form.lat.trim() !== "" && form.lng.trim() !== "" && !Number.isNaN(lat) && !Number.isNaN(lng);
  const inLibya = hasCoords && isInLibya(lat, lng);
  const coordsInvalid = hasCoords && !inLibya;

  // The station's real id is the backend-generated UUID (present only in edit
  // mode). `previewCode` is a short cosmetic code for the public-preview card.
  const stationRecordId = initial?.id ?? "";
  const previewCode = initial?.code ?? hashCode(form.name || "new");
  const selectedSensors = SENSORS.filter((s) => form.sensors[s]);
  const canSave =
    form.name.trim() !== "" &&
    form.nameAr.trim() !== "" &&
    form.municipalityId !== "" &&
    hasCoords &&
    !coordsInvalid &&
    selectedSensors.length > 0;

  // Public preview reflects only what's been entered so far — no live reading
  // exists until the station is activated, so the summary card's weather
  // section renders its own empty state.
  const preview = React.useMemo<StationDetail>(
    () => ({
      name: form.name.trim() || "—",
      nameAr: form.nameAr.trim() || undefined,
      code: previewCode,
      region: form.region,
      city: form.city.trim() || form.name.trim().split(/\s+/)[0],
      availability: "live",
      updated: "preview",
    }),
    [form, previewCode],
  );

  const save = async () => {
    if (!canSave || saving || !canPersistStation) return;
    setSaving(true);
    try {
      const sensors = sensorsToParams(selectedSensors);
      // Form status → backend operational_status ("offline" is a UI convenience
      // that maps onto the backend's "deactivated").
      const operationalStatus =
        form.status === "offline" ? "deactivated" : (form.status as "active" | "maintenance");

      if (mode === "create") {
        const res = await fetch(`${CONTACTS_API_BASE}/api/stations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            municipality_id: form.municipalityId,
            wu_station_id: form.wuStationId.trim() || null,
            name: form.name.trim(),
            name_ar: form.nameAr.trim(),
            station_type: "",
            latitude: lat,
            longitude: lng,
            elevation: 0,
            sensors,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string; data?: { id?: string } };
        if (!res.ok) {
          toast(json.error ?? t("stations.saveFailed"), "info");
          return;
        }
        // Create can't set operational_status; apply a non-active choice after.
        if (json.data?.id && operationalStatus !== "active") {
          await fetch(`${CONTACTS_API_BASE}/api/stations/${json.data.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operational_status: operationalStatus }),
          });
        }
        toast(t("stations.addedToast", { name: form.name.trim(), region: t("region." + form.region) }));
        router.push("/stations");
        router.refresh();
      } else {
        const res = await fetch(`${CONTACTS_API_BASE}/api/stations/${stationRecordId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            municipality_id: form.municipalityId,
            wu_station_id: form.wuStationId.trim() || null,
            name: form.name.trim(),
            name_ar: form.nameAr.trim(),
            latitude: lat,
            longitude: lng,
            sensors,
            operational_status: operationalStatus,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast(json.error ?? t("stations.saveFailed"), "info");
          return;
        }
        toast(t("stations.savedToast", { name: form.name.trim() }));
        router.push("/stations");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header — title + actions. The section trail (Stations / Edit station)
          lives in the topbar breadcrumb, so it isn't repeated here. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "edit" ? t("stations.editTitle") : t("stations.addStation")}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/stations">{t("common.cancel")}</Link>
          </Button>
          <Button onClick={save} disabled={!canSave || saving || !canPersistStation}>
            <Check className="size-4" />
            {t("stations.saveActivate")}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        {/* Left — sectioned form */}
        <div className="space-y-6">
          {/* Identity */}
          <Card className="p-4 sm:p-6">
            <SectionHead title={t("stations.section.identity")} hint={t("stations.identityHint")} />
            <div className="mt-5 grid gap-4">
              <Field label={t("stations.stationName")} htmlFor="st-name" required>
                <Input
                  id="st-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder={t("stations.namePlaceholder")}
                  autoFocus
                />
              </Field>
              <Field label={t("stations.nameArabic")} htmlFor="st-name-ar" required>
                <Input
                  id="st-name-ar"
                  value={form.nameAr}
                  onChange={(e) => set("nameAr", e.target.value)}
                  placeholder="طبرق الساحلية"
                  dir="rtl"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("stations.region")} htmlFor="st-region">
                  <Select value={form.region} onValueChange={(v) => set("region", v)}>
                    <SelectTrigger id="st-region" className="w-full">
                      <div className="flex min-w-0 items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-muted-foreground" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r} value={r}>{t("region." + r)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("stations.city")} htmlFor="st-municipality">
                  <Select
                    value={form.municipalityId}
                    onValueChange={selectMunicipality}
                    disabled={!canPersistStation}
                  >
                    <SelectTrigger id="st-municipality" className="w-full">
                      <div className="flex min-w-0 items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-muted-foreground" />
                        <SelectValue placeholder={t("stations.cityPlaceholder")} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {municipalityOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          {t("stations.noMunicipalities")}
                        </div>
                      ) : (
                        municipalityOptions.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {locale === "ar" ? m.nameAr || m.name : m.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("stations.wuStationId")} htmlFor="st-wu">
                  <Input
                    id="st-wu"
                    dir="ltr"
                    value={form.wuStationId}
                    onChange={(e) => set("wuStationId", e.target.value)}
                    placeholder={t("stations.wuStationIdPlaceholder")}
                  />
                </Field>
                <Field label={t("stations.initialStatus")} htmlFor="st-status">
                  <Select value={form.status} onValueChange={(v) => set("status", v as StationInitialStatus)}>
                    <SelectTrigger id="st-status" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("stations.status.active")}</SelectItem>
                      <SelectItem value="maintenance">{t("status.maintenance")}</SelectItem>
                      <SelectItem value="offline">{t("status.offline")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label={t("stations.stationId")} htmlFor="st-id">
                <Input
                  id="st-id"
                  value={mode === "edit" ? stationRecordId : ""}
                  readOnly
                  dir="ltr"
                  placeholder={mode === "create" ? t("stations.stationIdAuto") : undefined}
                  className="bg-secondary/60 font-mono text-xs text-muted-foreground"
                />
              </Field>
            </div>
          </Card>

          {/* Location */}
          <Card className="p-4 sm:p-6">
            <SectionHead title={t("stations.section.location")} hint={t("stations.locationHint")} />
            {/* Interactive Libya map — click or drag the pin to set coordinates */}
            <div className="relative mt-5 h-[620px] overflow-hidden rounded-2xl border border-border-subtle bg-secondary/50">
              <StationLocationPicker
                lat={hasCoords ? lat : undefined}
                lng={hasCoords ? lng : undefined}
                theme={theme}
                onPick={(la, lo) => {
                  set("lat", la.toFixed(4));
                  set("lng", lo.toFixed(4));
                }}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={t("stations.latitude")} htmlFor="st-lat">
                <Input id="st-lat" type="number" step="any" dir="ltr" value={form.lat} onChange={(e) => set("lat", e.target.value)} placeholder="32.8872" aria-invalid={coordsInvalid} />
              </Field>
              <Field label={t("stations.longitude")} htmlFor="st-lng">
                <Input id="st-lng" type="number" step="any" dir="ltr" value={form.lng} onChange={(e) => set("lng", e.target.value)} placeholder="13.1913" aria-invalid={coordsInvalid} />
              </Field>
            </div>
            {/* Validation chips */}
            {coordsInvalid ? (
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-text-warning">
                <TriangleAlert className="size-4 shrink-0" aria-hidden />
                {t("stations.coordError")}
              </p>
            ) : inLibya ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip ok>{t("stations.chip.withinLibya")}</Chip>
              </div>
            ) : null}
          </Card>

          {/* Sensors */}
          <Card className="p-4 sm:p-6">
            <SectionHead title={t("stations.section.sensors")} hint={t("stations.sensorsHint")} />
            <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {SENSORS.map((s) => (
                <label key={s} className="flex items-center gap-2.5 text-sm">
                  {/* Disabled: all sensors are on and not per-station configurable yet. */}
                  <Checkbox checked disabled />
                  <span className="font-medium text-muted-foreground">{t("stations.sensor." + s)}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Emergency contacts — per municipality (city), shared by all its
              stations. Saved to the backend on blur; readOnly can only view. */}
          <Card className="p-4 sm:p-6">
            <SectionHead
              title={t("stations.section.emergency")}
              hint={
                form.municipalityId
                  ? t("stations.emergencySharedHint", { city: form.city.trim() })
                  : t("stations.emergencyPickHint")
              }
            />
            {form.municipalityId ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label={t("stations.emergencyServices")} htmlFor="st-emr-services">
                  <Input
                    id="st-emr-services"
                    dir="ltr"
                    inputMode="tel"
                    readOnly={!canEditContacts}
                    disabled={contactsSaving}
                    value={contacts.emergencyServices}
                    onChange={(e) => setContacts((c) => ({ ...c, emergencyServices: e.target.value }))}
                    onBlur={saveContacts}
                  />
                </Field>
                <Field label={t("stations.civilDefense")} htmlFor="st-emr-civil">
                  <Input
                    id="st-emr-civil"
                    dir="ltr"
                    inputMode="tel"
                    readOnly={!canEditContacts}
                    disabled={contactsSaving}
                    value={contacts.civilDefense}
                    onChange={(e) => setContacts((c) => ({ ...c, civilDefense: e.target.value }))}
                    onBlur={saveContacts}
                  />
                </Field>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-border bg-secondary/40 py-6 text-center text-sm text-muted-foreground">
                {t("stations.emergencyNeedsCity")}
              </p>
            )}
          </Card>

        </div>

        {/* Right — live Public Preview (sticky) */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border-subtle bg-secondary/40 p-5">
            <div className="flex items-center gap-2 text-brand-foreground">
              <Radar className="size-4" aria-hidden />
              <span className="text-sm font-semibold">{t("stations.previewEyebrow")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("stations.previewHint")}</p>

            <div className="mt-4 rounded-2xl border border-border bg-background p-5 shadow-card">
              <StationSummaryCard detail={preview} onClose={() => {}} />
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-text-link/10 px-3.5 py-3 text-xs leading-relaxed text-text-link">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("stations.previewActivateNote")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {hint ? <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function Chip({
  children,
  ok,
}: {
  children: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs font-medium text-foreground">
      {ok ? <Check className="size-3.5 text-status-normal" /> : null}
      {children}
    </span>
  );
}
