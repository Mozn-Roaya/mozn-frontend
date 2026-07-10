"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { MapPin, pinKindFor } from "@/features/map";

import { cn } from "../lib/cn";
import { stationName } from "../lib/i18n";
import { useLang, useT } from "../state/lang-context";
import { useStations } from "../state/stations-context";


import type { Station } from "../api/types";

type StationSearchProps = {
  className?: string;
};

export function StationSearch({ className }: StationSearchProps) {
  const router = useRouter();
  const stations = useStations();
  const t = useT();
  const lang = useLang();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo<Station[]>(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? stations.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.name_ar.includes(query.trim()) ||
            s.wu_station_id.toLowerCase().includes(q),
        )
      : stations;
    return list.slice(0, 50);
  }, [query, stations]);

  React.useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectStation(station: Station) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(`/stations/${encodeURIComponent(station.id)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[activeIndex];
      if (target) selectStation(target);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-[280px]", className)}>
      <label
        className={cn(
          "inline-flex w-full h-[40px] md:h-[32px] lg:h-[40px] items-center gap-[8px] rounded-[8px] px-[12px]",
          "bg-(--color-bg-primary) border border-solid border-(--color-border-default)",
          open && "ring-2 ring-(--color-border-focus)/30",
        )}
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-(--color-text-muted)"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="station-search-list"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-body-sm text-(--color-text-primary) placeholder:text-(--color-text-muted)"
        />
      </label>

      {open && (
        <ul
          id="station-search-list"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[320px] overflow-y-auto rounded-[12px] bg-(--color-bg-primary) border border-solid border-(--color-border-subtle) shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-[8px]"
        >
          {filtered.length === 0 && (
            <li className="px-[16px] py-[12px] text-body-sm text-(--color-text-muted)">
              {stations.length === 0 ? t.loadingStations : t.noMatch(query)}
            </li>
          )}
          {filtered.map((s, idx) => (
            <li key={s.id} role="option" aria-selected={idx === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => selectStation(s)}
                className={cn(
                  "flex w-full items-center gap-[12px] px-[16px] py-[8px] text-start",
                  idx === activeIndex && "bg-(--color-bg-secondary)",
                )}
              >
                <MapPin kind={pinKindFor(s)} className="!size-[20px] shrink-0" />
                <span className="flex-1 min-w-0 flex flex-col">
                  <span className="text-body-sm font-medium text-(--color-text-primary) truncate">
                    {stationName(s, lang)}
                  </span>
                  <span className="text-body-xxs text-(--color-text-muted) truncate">
                    {s.wu_station_id} ·{" "}
                    {/* QA: localize station type; unknown types fall back to the raw value. */}
                    {t.stationTypes[s.station_type.toLowerCase()] ??
                      s.station_type}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
