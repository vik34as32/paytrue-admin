"use client";

import { RefreshCw } from "lucide-react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function ReportSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-[260px] flex-col justify-end gap-3 rounded-xl bg-muted/20 p-4",
        className
      )}
    >
      <div className="h-full animate-pulse rounded-lg bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
      <div className="flex justify-between">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-2 w-8 animate-pulse rounded bg-muted/60" />
        ))}
      </div>
    </div>
  );
}

export function ReportEmptyState({
  message = "No business data available for this period.",
}: {
  message?: string;
}) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl border border-border bg-muted/10 px-4 text-center">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  actions,
  loading,
  error,
  empty,
  emptyMessage,
  onRetry,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground sm:text-lg">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {loading ? (
        <ReportSkeleton />
      ) : error ? (
        <div className="flex h-[260px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/10 px-4 text-center">
          <p className="text-sm font-semibold text-foreground">
            Unable to load business report.
          </p>
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : empty ? (
        <ReportEmptyState message={emptyMessage} />
      ) : (
        children
      )}
    </Card>
  );
}
