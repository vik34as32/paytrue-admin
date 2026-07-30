"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/common/Card";
import type { LucideIcon } from "lucide-react";

export interface ReportStatCardItem {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: string;
}

interface ReportStatsRowProps {
  items: ReportStatCardItem[];
  className?: string;
}

/** Summary cards row matching Wallet Credit History report layout. */
export function ReportStatsRow({ items, className }: ReportStatsRowProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="flex items-center gap-4 border-[#E2E8F0] p-4 shadow-sm dark:border-border"
          >
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                item.iconClassName || "bg-[#4318FF]/10 text-[#4318FF]"
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#64748B]">{item.label}</p>
              <p className="truncate text-xl font-bold text-[#0F172A] dark:text-foreground">
                {item.value}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                {item.hint ? (
                  <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 font-medium text-[#64748B] dark:bg-muted">
                    {item.hint}
                  </span>
                ) : null}
                {item.trend ? (
                  <span className="font-semibold text-emerald-600">
                    {item.trend}
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
