"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/components/providers/locale-provider";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  return (
    <div>
      <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-status-warning/10 text-status-warning">
          <TriangleAlert className="size-6" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t("error.title")}</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {error.message || t("error.body")}
          </p>
        </div>
        <Button onClick={reset} variant="outline">
          <RefreshCw className="size-4" />
          {t("common.retry")}
        </Button>
      </Card>
    </div>
  );
}
