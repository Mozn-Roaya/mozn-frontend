"use client";

import * as React from "react";

import { cn } from "@/components/lib/cn";
import { localeFor, stationName } from "@/components/lib/i18n";
import { useLang, useT } from "@/components/state/lang-context";

import type { Station } from "@/components/api/types";

type ShareTabProps = {
  station: Station;
};

export function ShareTab({ station }: ShareTabProps) {
  const t = useT();
  const lang = useLang();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const stationUrl = origin
    ? `${origin}/stations/${encodeURIComponent(station.id)}`
    : "";
  const embedSnippet = `<iframe src="${stationUrl}" width="420" height="800" frameborder="0"></iframe>`;

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
    } catch {
      setCopied("error");
    }
  }

  const rows: Array<{ key: string; label: string; value: string }> = [
    { key: "url", label: t.publicLink, value: stationUrl },
    { key: "embed", label: t.embedSnippet, value: embedSnippet },
  ];

  return (
    <div className="flex flex-col gap-[16px] w-full">
      <h3 className="text-heading-sm font-bold text-(--color-text-primary) m-0">
        {t.shareTitle(stationName(station, lang))}
      </h3>

      <div className="flex flex-col gap-[12px]">
        {rows.map((row) => (
          <div key={row.key} className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between">
              <span className="text-body-xs font-medium text-(--color-text-secondary)">
                {row.label}
              </span>
              <button
                type="button"
                onClick={() => copy(row.value, row.key)}
                className={cn(
                  "px-[12px] py-[4px] rounded-[8px] text-body-xxs font-medium",
                  "bg-(--color-interactive-default) text-(--color-text-inverse)",
                  "hover:bg-(--color-interactive-hover) active:bg-(--color-interactive-active)",
                  "transition-colors",
                )}
              >
                {copied === row.key ? t.copied : t.copy}
              </button>
            </div>
            <code className="block px-[12px] py-[8px] rounded-[8px] bg-(--color-bg-secondary) text-body-xxs text-(--color-text-primary) break-all whitespace-pre-wrap font-mono">
              {row.value || "…"}
            </code>
          </div>
        ))}
      </div>

      <div className="rounded-[12px] border border-solid border-(--color-border-subtle) bg-(--color-bg-secondary) p-[16px]">
        <p className="text-body-xxs text-(--color-text-muted) m-0">
          {t.shareStationWord} <strong>{station.wu_station_id}</strong> ·{" "}
          {stationName(station, lang)}
          <br />
          {t.lastSeen}{" "}
          {station.last_seen_at
            ? new Date(station.last_seen_at).toLocaleString(localeFor(lang))
            : t.never}
          .
        </p>
      </div>
    </div>
  );
}
