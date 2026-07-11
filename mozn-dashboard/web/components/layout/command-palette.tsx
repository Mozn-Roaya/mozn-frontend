"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { CornerDownLeft, RadioTower, Search, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { fuzzyRank } from "@/lib/fuzzy";
import { dict } from "@/lib/i18n";
import { useLocale } from "@/components/providers/locale-provider";
import { useRole } from "@/components/providers/role-provider";
import type { StationRow, StationsPage } from "@/types/stations";
import { NAV_GROUPS, canAccessNav } from "./nav-config";

// Station status → dot colour. Mirrors STATUS_DOT in the Stations table so the
// palette speaks the same visual language.
const STATUS_DOT: Record<string, string> = {
  online: "bg-status-normal",
  warning: "bg-status-warning",
  anomaly: "bg-status-advisory",
  maintenance: "bg-text-link",
  offline: "bg-status-offline",
};

interface Item {
  key: string;
  kind: "nav" | "station";
  label: string;
  sublabel?: string;
  /** All strings the item can be matched on (EN + AR labels, region, id…). */
  keywords: string[];
  href: string;
  icon?: LucideIcon;
  status?: string;
}

/** Highlight the fuzzy-matched characters within a label. */
function Highlight({ text, indices }: { text: string; indices: number[] }) {
  if (indices.length === 0) return <>{text}</>;
  const hit = new Set(indices);
  return (
    <>
      {Array.from(text).map((ch, i) =>
        hit.has(i) ? (
          <mark
            key={i}
            className="bg-primary/15 text-foreground [font-weight:inherit]"
          >
            {ch}
          </mark>
        ) : (
          <React.Fragment key={i}>{ch}</React.Fragment>
        ),
      )}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { locale, t, td } = useLocale();
  const { isGov, assignedRegion, can } = useRole();

  const [query, setQuery] = React.useState("");
  const [stations, setStations] = React.useState<StationRow[] | null>(null);
  // In-flight guard for the one-shot station fetch — a ref, not state, since it
  // only prevents a duplicate request and is never rendered.
  const loadingStations = React.useRef(false);
  const [active, setActive] = React.useState(0);

  const listRef = React.useRef<HTMLDivElement>(null);

  // Reset the query/selection each time the palette opens. Done during render —
  // tracked against the previous open state — rather than in an effect so the
  // first opened frame already shows a cleared field.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }

  // Lazily pull the station list the first time the palette opens (cached for
  // the session after that).
  React.useEffect(() => {
    if (!open || stations !== null || loadingStations.current) return;
    loadingStations.current = true;
    // basePath does not auto-prefix raw fetch(); the /api/stations route handler
    // lives under the zone's basePath (/dashboard/api/stations), so prefix it.
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/stations`)
      .then((r) => (r.ok ? (r.json() as Promise<StationsPage>) : Promise.reject()))
      .then((page) => setStations(page.groups.flatMap((g) => g.rows)))
      .catch(() => setStations([]))
      .finally(() => {
        loadingStations.current = false;
      });
  }, [open, stations]);

  // Nav destinations, scoped to the account's permissions (same rule as the
  // sidebar), with both locales searchable.
  const navItems = React.useMemo<Item[]>(() => {
    return NAV_GROUPS.flatMap((g) => g.items)
      .filter((i) => i.href && canAccessNav(i, can))
      .map((i) => {
        const entry = dict[i.labelKey];
        return {
          key: `nav:${i.href}`,
          kind: "nav" as const,
          label: t(i.labelKey),
          keywords: entry ? [entry.en, entry.ar] : [t(i.labelKey)],
          href: i.href!,
          icon: i.icon,
        };
      });
  }, [can, t]);

  // Station destinations, region-scoped for gov roles.
  const stationItems = React.useMemo<Item[]>(() => {
    if (!stations) return [];
    const regionEntry = (region: string) => dict[`region.${region}`];
    return stations
      .filter((s) => !isGov || s.region === assignedRegion)
      .map((s) => {
        const region = regionEntry(s.region);
        return {
          key: `station:${s.id}`,
          kind: "station" as const,
          label: locale === "ar" ? s.nameAr : s.name,
          sublabel: td(s.region),
          keywords: [
            s.name,
            s.nameAr,
            s.id,
            s.region,
            region?.en ?? "",
            region?.ar ?? "",
          ].filter(Boolean),
          // There's no standalone station detail route — the per-station screen
          // is the edit form (same target the Stations table row links to).
          href: `/stations/${s.id}/edit`,
          status: s.status,
        };
      });
  }, [stations, isGov, assignedRegion, locale, td]);

  // Rank + assemble the visible result list. With no query we show the nav
  // destinations as a "jump to" list rather than dumping every station.
  const results = React.useMemo<(Item & { indices: number[] })[]>(() => {
    const q = query.trim();
    if (!q) {
      return navItems.map((it) => ({ ...it, indices: [] }));
    }
    const rank = (items: Item[]) =>
      items
        .map((it) => {
          const m = fuzzyRank(q, it.label, it.keywords);
          return m ? { ...it, indices: m.indices, score: m.score } : null;
        })
        .filter((x): x is Item & { indices: number[]; score: number } => x !== null)
        .sort((a, b) => b.score - a.score);

    const navHits = rank(navItems);
    const stationHits = rank(stationItems).slice(0, 20);
    return [...navHits, ...stationHits];
  }, [query, navItems, stationItems]);

  // Keep the active index in range whenever the result set shrinks. Clamping
  // during render (guarded, so it can't loop) avoids a frame where `active`
  // points past the end of the list.
  if (active > 0 && active > results.length - 1) {
    setActive(results.length === 0 ? 0 : results.length - 1);
  }

  const select = React.useCallback(
    (item: Item) => {
      onOpenChange(false);
      router.push(item.href);
    },
    [onOpenChange, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) select(item);
    }
  };

  // Scroll the active row into view as the selection moves.
  React.useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[15vh] z-50 flex max-h-[70vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-card duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">
            {t("palette.title")}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t("palette.description")}
          </DialogPrimitive.Description>

          {/* Search field */}
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder={t("palette.placeholder")}
              aria-label={t("palette.title")}
              className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Results */}
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                {query.trim()
                  ? t("palette.empty", { query: query.trim() })
                  : t("palette.loadingStations")}
              </p>
            ) : (
              results.map((item, i) => {
                const showHeader = i === 0 || results[i - 1].kind !== item.kind;
                const isActive = i === active;
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.key}>
                    {showHeader ? (
                      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                        {item.kind === "nav"
                          ? t("palette.groupPages")
                          : t("palette.groupStations")}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      data-index={i}
                      onClick={() => select(item)}
                      onMouseMove={() => setActive(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {Icon ? (
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      ) : (
                        <span className="flex size-4 shrink-0 items-center justify-center">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              STATUS_DOT[item.status ?? ""] ?? "bg-status-offline",
                            )}
                            aria-hidden
                          />
                        </span>
                      )}
                      <span className="flex-1 truncate font-medium text-foreground">
                        <Highlight text={item.label} indices={item.indices} />
                      </span>
                      {item.sublabel ? (
                        <span className="shrink-0 truncate text-xs text-muted-foreground">
                          {item.sublabel}
                        </span>
                      ) : null}
                      {item.kind === "station" ? (
                        <RadioTower className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
                      ) : null}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Footer hint bar */}
          <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              {t("palette.hintNavigate")}
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>
                <CornerDownLeft className="size-3" />
              </Kbd>
              {t("palette.hintSelect")}
            </span>
            <span className="ms-auto flex items-center gap-1.5">
              <Kbd>Esc</Kbd>
              {t("palette.hintClose")}
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
