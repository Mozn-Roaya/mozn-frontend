import * as React from "react";

import { getDict, localeFor, type Lang } from "@/components/lib/i18n";

import type { Station } from "@/components/api/types";

function formatLastSeen(iso: string | undefined, lang: Lang): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(localeFor(lang), {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StationOffline({
  station,
  lang = "en",
}: {
  station: Station;
  lang?: Lang;
}) {
  const t = getDict(lang);
  const lastSeen = formatLastSeen(station.last_seen_at, lang);

  return (
    <div className="flex flex-col items-center text-center gap-[12px] w-full rounded-[16px] border border-solid border-(--color-border-subtle) bg-(--color-bg-secondary) px-[20px] py-[28px]">
      <span
        className="inline-flex items-center gap-[8px] px-[12px] py-[5px] rounded-full"
        style={{
          backgroundColor: "var(--color-bg-primary)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <span
          className="size-[8px] rounded-full"
          style={{ backgroundColor: "var(--color-status-offline-400)" }}
        />
        <span className="text-label-md font-semibold text-(--color-text-primary) uppercase">
          {t.offline}
        </span>
      </span>

      <p className="text-heading-sm font-bold text-(--color-text-primary) m-0">
        {t.stationUnavailable}
      </p>
      <p className="text-body-sm text-(--color-text-secondary) m-0 max-w-[280px]">
        {t.offlineBody}
      </p>

      {lastSeen && (
        <p className="text-body-xs text-(--color-text-muted) m-0">
          {t.lastSeen} {lastSeen}
        </p>
      )}
    </div>
  );
}
