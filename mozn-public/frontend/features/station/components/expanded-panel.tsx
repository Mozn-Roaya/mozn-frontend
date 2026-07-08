"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createPortal } from "react-dom";

import { XIcon } from "@/components/icons";
import { cn } from "@/components/lib/cn";
import { stationName, type Dict } from "@/components/lib/i18n";
import { useLang, useT } from "@/components/state/lang-context";

import type { Station } from "@/components/api/types";

type ExpandedTab = "charts" | "data";

type ExpandedPanelProps = {
  station: Station;
  tab: ExpandedTab;
  children: React.ReactNode;
};

/**
 * Expanded Panel modal — Figma nodes 232:2 (Charts) and 268:81 (Data).
 * A centered overlay card on a dark backdrop that floats above the map at
 * `--z-modal`. Never renders or touches the Leaflet map itself.
 *
 * Routing (per design decision): `/stations/:id/charts` and `/data` each
 * render this shell with the matching `tab`; the internal toggle links
 * between the two routes and the close control returns to the overview.
 * On mobile it drops to a bottom-sheet, consistent with the station side
 * panel.
 */
export function ExpandedPanel({ station, tab, children }: ExpandedPanelProps) {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const name = stationName(station, lang);
  const overviewHref = `/stations/${station.id}`;
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);

  const close = React.useCallback(() => {
    router.push(overviewHref);
  }, [router, overviewHref]);

  // Portal target only exists on the client.
  React.useEffect(() => setMounted(true), []);

  // Trigger the entrance transition one frame after mount; honor reduced motion.
  React.useEffect(() => {
    setReduced(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    );
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Escape closes; lock body scroll while the modal is mounted.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [close]);

  const isCharts = tab === "charts";

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center lg:items-center bg-(--color-bg-overlay) px-0 lg:px-[24px] py-0 lg:py-[24px]"
      style={{ zIndex: "var(--z-modal)" }}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — ${isCharts ? t.tabCharts : t.tabData}`}
      onMouseDown={(e) => {
        // Backdrop click (not a click that started inside the card) closes.
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={cn(
          "flex w-full flex-col overflow-hidden bg-(--color-bg-primary) shadow-modal",
          // Mobile: bottom-sheet. Desktop: centered rounded card.
          "max-h-[90vh] rounded-t-3xl lg:max-h-[calc(100vh-48px)] lg:rounded-[20px]",
          "lg:max-w-[calc(100vw-48px)]",
          isCharts ? "lg:w-[960px]" : "lg:w-[560px]",
        )}
        style={{
          opacity: show ? 1 : 0,
          transform: show || reduced ? "none" : "translateY(10px) scale(0.98)",
          transition: reduced
            ? "opacity 150ms ease-out"
            : "opacity 280ms cubic-bezier(0.16,1,0.3,1), transform 280ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Mobile grab handle */}
        <div className="lg:hidden flex justify-center pt-[8px] pb-[4px] shrink-0">
          <span className="h-[4px] w-[36px] rounded-full bg-(--color-border-default)" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-[16px] px-[24px] pt-[20px] lg:px-[32px] lg:pt-[32px] shrink-0">
          <div className="flex min-w-0 flex-col gap-[4px]">
            <StatusChip status={station.status} t={t} />
            <p className="text-heading-md font-semibold text-(--color-text-primary) truncate m-0">
              {name}
            </p>
            <p className="text-body-xs text-(--color-text-muted) truncate m-0">
              #{station.wu_station_id} · {t.libya}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={t.closeAria}
            className={cn(
              "grid size-[32px] shrink-0 place-items-center rounded-full",
              "bg-(--color-bg-secondary) text-(--color-text-secondary)",
              "hover:text-(--color-text-primary) transition-colors",
            )}
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Charts | Data toggle */}
        <div className="px-[24px] pt-[16px] lg:px-[32px] shrink-0">
          <div className="inline-flex gap-[4px] rounded-lg bg-(--color-bg-secondary) p-[4px]">
            <TabLink href={`${overviewHref}/charts`} active={isCharts}>
              {t.tabCharts}
            </TabLink>
            <TabLink href={`${overviewHref}/data`} active={!isCharts}>
              {t.tabData}
            </TabLink>
          </div>
        </div>

        {/* Tab content — scrollable, but the scrollbar chrome is hidden
            (still scrolls via wheel/touch/keyboard). */}
        <div className="flex-1 overflow-y-auto px-[24px] pt-[20px] lg:px-[32px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>

        {/* Footer */}
        <div className="px-[24px] pb-[20px] pt-[12px] lg:px-[32px] lg:pb-[24px] shrink-0">
          <p className="text-body-xxs text-(--color-text-muted) m-0">
            {t.dataByMozn}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "min-w-[96px] rounded-md px-[16px] py-[6px] text-center text-label-lg transition-colors",
        active
          ? "bg-(--color-bg-primary) font-semibold text-(--color-text-primary) shadow-[0_1px_2px_0_rgba(0,0,0,0.06)]"
          : "font-medium text-(--color-text-muted) hover:text-(--color-text-primary)",
      )}
    >
      {children}
    </Link>
  );
}

function StatusChip({
  status,
  t,
}: {
  status: Station["status"];
  t: Dict;
}) {
  const meta = {
    normal: {
      label: t.legendNormal,
      color: "var(--color-status-normal-500)",
      bg: "var(--color-bg-normal-subtle)",
    },
    warning: {
      label: t.legendWarning,
      color: "var(--color-status-warning-500)",
      bg: "var(--color-bg-warning-subtle)",
    },
    offline: {
      label: t.legendOffline,
      color: "var(--color-status-offline-400)",
      bg: "var(--color-bg-offline-subtle)",
    },
  }[status];

  return (
    <span
      className="inline-flex w-fit items-center gap-[6px] rounded-full px-[10px] py-[3px] text-body-xxs font-semibold"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      <span
        className="size-[6px] rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}
