import { superAdminClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";
import {
  emptyBusinessReport,
  normalizeBusinessReport,
} from "@/lib/businessReport";
import {
  BusinessReportQuery,
  BusinessReportSummary,
  MonthlyBusinessQuery,
  MonthlyBusinessSummary,
} from "@/types/monthlyBusiness";

function buildParams(query: BusinessReportQuery) {
  const period = query.period || "monthly";
  const params: Record<string, string | number> = {
    period,
    year: query.year,
  };
  if (query.month && query.month >= 1 && query.month <= 12) {
    params.month = query.month;
  }
  if (query.service?.trim()) params.service = query.service.trim();
  if (query.userId?.trim()) params.userId = query.userId.trim();
  return params;
}

export async function fetchBusinessReport(
  query: BusinessReportQuery
): Promise<BusinessReportSummary> {
  const period = query.period || "monthly";
  const { data } = await superAdminClient.get<ApiResponse<unknown>>(
    "/reports/monthly-business",
    { params: buildParams(query) }
  );
  return normalizeBusinessReport(data, {
    period,
    year: query.year,
    month: query.month,
  });
}

export async function getBusinessReport(
  query: BusinessReportQuery
): Promise<BusinessReportSummary> {
  return fetchBusinessReport(query);
}

/** Backward-compatible monthly summary used by the older overview chart. */
export async function fetchMonthlyBusiness(
  query: MonthlyBusinessQuery
): Promise<MonthlyBusinessSummary> {
  const report = await fetchBusinessReport({
    period: "monthly",
    year: query.year,
    service: query.service,
  });
  return {
    year: report.year,
    totalBusiness: report.totalBusiness,
    totalTransactions: report.totalTransactions,
    months: report.months,
    growthPercent: report.growthPercent,
  };
}

export function safeBusinessReport(
  query: BusinessReportQuery
): BusinessReportSummary {
  return emptyBusinessReport({
    period: query.period || "monthly",
    year: query.year,
    month: query.month,
  });
}
