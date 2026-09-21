"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { fetchBusinessReport } from "@/services/monthlyBusinessApi";
import {
  BusinessReportPeriod,
  BusinessReportQuery,
  BusinessReportSummary,
} from "@/types/monthlyBusiness";
import { normalizeYearlyData } from "@/lib/businessReport";

export const monthlyBusinessKeys = {
  all: ["monthly-business"] as const,
  report: (year: number, service: string) =>
    [...monthlyBusinessKeys.all, "monthly", year, service || "ALL"] as const,
  business: (query: BusinessReportQuery) =>
    [
      ...monthlyBusinessKeys.all,
      query.period || "monthly",
      query.year,
      query.month || 0,
      query.service || "ALL",
      query.userId || "",
    ] as const,
};

export function useMonthlyBusiness(year: number, service = "") {
  return useBusinessReport({ period: "monthly", year, service: service || undefined });
}

export function useBusinessReport(query: BusinessReportQuery, enabled = true) {
  return useQuery({
    queryKey: monthlyBusinessKeys.business(query),
    queryFn: () => fetchBusinessReport(query),
    enabled: enabled && Number.isFinite(query.year) && query.year > 0,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useYearlyBusinessComparison(
  years: number[],
  service?: string,
  enabled = true
) {
  const uniqueYears = [...new Set(years.filter((year) => year > 0))].sort(
    (a, b) => a - b
  );

  const queries = useQueries({
    queries: uniqueYears.map((year) => ({
      queryKey: monthlyBusinessKeys.business({
        period: "yearly" as BusinessReportPeriod,
        year,
        service,
      }),
      queryFn: () =>
        fetchBusinessReport({ period: "yearly", year, service }),
      enabled,
      placeholderData: keepPreviousData,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    })),
  });

  const isPending = queries.some((item) => item.isPending);
  const isFetching = queries.some((item) => item.isFetching);
  const isError = queries.every((item) => item.isError) && uniqueYears.length > 0;
  const reports = queries
    .map((item) => item.data)
    .filter((item): item is BusinessReportSummary => Boolean(item));

  const fromSeries = normalizeYearlyData(reports.flatMap((report) => report.series));
  const fromTotals = uniqueYears.map((year) => {
    const report = reports.find((item) => item.year === year);
    const seriesPoint = fromSeries.find((item) => item.year === year);
    return {
      key: String(year),
      label: String(year),
      year,
      month: null,
      day: null,
      weekday: null,
      date: null,
      business: seriesPoint?.business || report?.totalBusiness || 0,
      transactionCount:
        seriesPoint?.transactionCount || report?.totalTransactions || 0,
      successfulTransactions:
        seriesPoint?.successfulTransactions || report?.successfulTransactions || 0,
      failedTransactions:
        seriesPoint?.failedTransactions || report?.failedTransactions || 0,
      charges: seriesPoint?.charges || report?.totalCharges || 0,
      commission: seriesPoint?.commission || report?.totalCommission || 0,
      isPeak: false,
    };
  });

  const series =
    fromSeries.length > 1
      ? fromSeries
      : fromTotals.some((item) => item.business || item.transactionCount)
        ? fromTotals
        : fromSeries;

  return {
    series,
    isPending,
    isFetching,
    isError,
    refetch: () => Promise.all(queries.map((item) => item.refetch())),
  };
}
