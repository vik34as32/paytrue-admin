"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { BusinessSummaryCards } from "@/components/reports/BusinessSummaryCards";
import { BusinessTrendChart } from "@/components/reports/BusinessTrendChart";
import { DailyBusinessChart } from "@/components/reports/DailyBusinessChart";
import { WeeklyBusinessChart } from "@/components/reports/WeeklyBusinessChart";
import { MonthlyBusinessChart } from "@/components/reports/MonthlyBusinessChart";
import { YearlyBusinessChart } from "@/components/reports/YearlyBusinessChart";
import { ServiceBusinessChart } from "@/components/reports/ServiceBusinessChart";
import { BusinessTransactionChart } from "@/components/reports/BusinessTransactionChart";
import { TransactionStatusChart } from "@/components/reports/TransactionStatusChart";
import { ServiceDistributionChart } from "@/components/reports/ServiceDistributionChart";
import { ReportFilters } from "@/components/reports/ReportFilters";
import {
  useBusinessReport,
  useYearlyBusinessComparison,
} from "@/hooks/useMonthlyBusiness";
import { useActiveServices } from "@/hooks/service-master/useServiceMaster";
import { BUSINESS_SERVICE_KEYS, labelForBusinessService } from "@/constants/businessServices";
import { BusinessReportPeriod } from "@/types/monthlyBusiness";

const FILTERS_KEY = "paytrue.businessAnalytics.filters";

function currentYear() {
  return new Date().getFullYear();
}

function currentMonth() {
  return new Date().getMonth() + 1;
}

function loadFilters() {
  const defaults = {
    period: "monthly" as BusinessReportPeriod,
    year: currentYear(),
    month: currentMonth(),
    service: "",
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(FILTERS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<typeof defaults>;
    const period = ["daily", "weekly", "monthly", "yearly"].includes(
      String(parsed.period)
    )
      ? (parsed.period as BusinessReportPeriod)
      : defaults.period;
    return {
      period,
      year: Number(parsed.year) || defaults.year,
      month: Math.min(12, Math.max(1, Number(parsed.month) || defaults.month)),
      service: String(parsed.service || ""),
    };
  } catch {
    return defaults;
  }
}

function persistFilters(next: {
  period: BusinessReportPeriod;
  year: number;
  month: number;
  service: string;
}) {
  try {
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

export function BusinessAnalyticsDashboard() {
  const initial = useMemo(() => loadFilters(), []);
  const [period, setPeriod] = useState<BusinessReportPeriod>(initial.period);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [service, setService] = useState(initial.service);
  const { data: activeServices } = useActiveServices();

  const serviceFilter = service || undefined;
  const daily = useBusinessReport({ period: "daily", year, month, service: serviceFilter });
  const weekly = useBusinessReport({ period: "weekly", year, month, service: serviceFilter });
  const monthly = useBusinessReport({ period: "monthly", year, service: serviceFilter });
  const yearly = useBusinessReport({ period: "yearly", year, service: serviceFilter });
  const yearlyYears = [year - 4, year - 3, year - 2, year - 1, year];
  const yearlyComparison = useYearlyBusinessComparison(
    yearlyYears,
    serviceFilter,
    !yearly.isPending && (yearly.data?.series.length || 0) <= 1
  );

  const selected =
    period === "daily"
      ? daily
      : period === "weekly"
        ? weekly
        : period === "yearly"
          ? yearly
          : monthly;

  const lastUpdated = selected.dataUpdatedAt
    ? format(new Date(selected.dataUpdatedAt), "dd MMM yyyy, h:mm a")
    : null;

  const serviceOptions = useMemo(() => {
    const seen = new Set<string>();
    const options = [{ value: "", label: "All Services" }];
    const push = (code: string, label?: string) => {
      const value = code.trim().toUpperCase();
      if (!value || seen.has(value)) return;
      seen.add(value);
      options.push({ value, label: label || labelForBusinessService(value) });
    };
    BUSINESS_SERVICE_KEYS.forEach((item) => push(item.code, item.label));
    (activeServices || [])
      .filter((item) => item.type !== "SUB")
      .forEach((item) => push(item.code, item.name || item.code));
    (monthly.data?.services || []).forEach((item) => push(item.code, item.name));
    return options;
  }, [activeServices, monthly.data?.services]);

  const services =
    selected.data?.services?.length
      ? selected.data.services
      : monthly.data?.services || [];

  const yearlySeries =
    (yearly.data?.series.length || 0) > 1
      ? yearly.data!.series
      : yearlyComparison.series;

  const updateFilters = (patch: Partial<{
    period: BusinessReportPeriod;
    year: number;
    month: number;
    service: string;
  }>) => {
    const next = {
      period: patch.period ?? period,
      year: patch.year ?? year,
      month: patch.month ?? month,
      service: patch.service ?? service,
    };
    if (patch.period) setPeriod(patch.period);
    if (patch.year != null) setYear(patch.year);
    if (patch.month != null) setMonth(patch.month);
    if (patch.service != null) setService(patch.service);
    persistFilters(next);
  };

  const refreshAll = () => {
    void daily.refetch();
    void weekly.refetch();
    void monthly.refetch();
    void yearly.refetch();
    void yearlyComparison.refetch();
  };

  return (
    <section className="space-y-5" aria-label="Business analytics">
      <BusinessSummaryCards
        data={selected.data}
        loading={selected.isPending && !selected.data}
      />

      <ReportFilters
        period={period}
        year={year}
        month={month}
        service={service}
        serviceOptions={serviceOptions}
        lastUpdated={lastUpdated}
        refreshing={selected.isFetching}
        onPeriodChange={(value) => updateFilters({ period: value })}
        onYearChange={(value) => updateFilters({ year: value })}
        onMonthChange={(value) => updateFilters({ month: value })}
        onServiceChange={(value) => updateFilters({ service: value })}
        onRefresh={refreshAll}
      />

      <BusinessTrendChart
        period={period}
        data={selected.data}
        loading={selected.isPending && !selected.data}
        error={selected.isError && !selected.data}
        fetching={selected.isFetching}
        onRetry={() => void selected.refetch()}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <DailyBusinessChart
          data={daily.data}
          loading={daily.isPending && !daily.data}
          error={daily.isError && !daily.data}
          fetching={daily.isFetching}
          onRetry={() => void daily.refetch()}
        />
        <WeeklyBusinessChart
          data={weekly.data}
          loading={weekly.isPending && !weekly.data}
          error={weekly.isError && !weekly.data}
          fetching={weekly.isFetching}
          onRetry={() => void weekly.refetch()}
        />
        <MonthlyBusinessChart
          data={monthly.data}
          loading={monthly.isPending && !monthly.data}
          error={monthly.isError && !monthly.data}
          fetching={monthly.isFetching}
          onRetry={() => void monthly.refetch()}
        />
        <YearlyBusinessChart
          series={yearlySeries}
          loading={
            (yearly.isPending && !yearly.data) ||
            (yearlyComparison.isPending && yearlySeries.length <= 1)
          }
          error={yearly.isError && !yearly.data && yearlyComparison.isError}
          fetching={yearly.isFetching || yearlyComparison.isFetching}
          onRetry={() => {
            void yearly.refetch();
            void yearlyComparison.refetch();
          }}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ServiceBusinessChart
          services={services}
          loading={selected.isPending && !selected.data}
          error={selected.isError && !selected.data}
          onRetry={() => void selected.refetch()}
        />
        <BusinessTransactionChart
          series={selected.data?.series || []}
          loading={selected.isPending && !selected.data}
          error={selected.isError && !selected.data}
          onRetry={() => void selected.refetch()}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <TransactionStatusChart
          breakdown={selected.data?.breakdown}
          loading={selected.isPending && !selected.data}
          error={selected.isError && !selected.data}
          onRetry={() => void selected.refetch()}
        />
        <ServiceDistributionChart
          services={services}
          loading={selected.isPending && !selected.data}
          error={selected.isError && !selected.data}
          onRetry={() => void selected.refetch()}
        />
      </div>
    </section>
  );
}
