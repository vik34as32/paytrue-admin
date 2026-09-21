"use client";

import { BUSINESS_SERVICE_KEYS, labelForBusinessService } from "@/constants/businessServices";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { cn } from "@/lib/utils";
import { BusinessReportPeriod } from "@/types/monthlyBusiness";
import { RefreshCw } from "lucide-react";

const PERIODS: { value: BusinessReportPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, index) => ({ value: String(index + 1), label }));

interface ReportFiltersProps {
  period: BusinessReportPeriod;
  year: number;
  month: number;
  service: string;
  serviceOptions: { value: string; label: string }[];
  lastUpdated?: string | null;
  refreshing?: boolean;
  onPeriodChange: (period: BusinessReportPeriod) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onServiceChange: (service: string) => void;
  onRefresh: () => void;
}

export function ReportFilters({
  period,
  year,
  month,
  service,
  serviceOptions,
  lastUpdated,
  refreshing,
  onPeriodChange,
  onYearChange,
  onMonthChange,
  onServiceChange,
  onRefresh,
}: ReportFiltersProps) {
  const yearNow = new Date().getFullYear();
  const years = [yearNow, yearNow - 1, yearNow - 2, yearNow - 3, yearNow - 4].map(
    (value) => ({ value: String(value), label: String(value) })
  );
  const showMonth = period === "daily" || period === "weekly";
  const options =
    serviceOptions.length > 1
      ? serviceOptions
      : [
          { value: "", label: "All Services" },
          ...BUSINESS_SERVICE_KEYS.filter(
            (item, index, list) =>
              list.findIndex((row) => row.label === item.label) === index
          ).map((item) => ({
            value: item.code,
            label: labelForBusinessService(item.code),
          })),
        ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div
          className="inline-flex flex-wrap rounded-xl border border-border bg-background p-1"
          role="tablist"
          aria-label="Report period"
        >
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={period === item.value}
              onClick={() => onPeriodChange(item.value)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold transition",
                period === item.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          {lastUpdated ? `Last updated ${lastUpdated}` : "Live business analytics"}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[120px]">
          <Select
            label="Year"
            options={years}
            value={String(year)}
            onChange={(event) => onYearChange(Number(event.target.value))}
          />
        </div>
        <div className="min-w-[150px]">
          <Select
            label="Month"
            options={MONTHS}
            value={String(month)}
            disabled={!showMonth}
            onChange={(event) => onMonthChange(Number(event.target.value))}
          />
        </div>
        <div className="min-w-[170px]">
          <Select
            label="Service"
            options={options}
            value={service}
            onChange={(event) => onServiceChange(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mb-0.5 h-11"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh business report"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
