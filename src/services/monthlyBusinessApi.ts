import { superAdminClient } from "@/lib/api/client";
import { ApiResponse } from "@/types";
import {
  MonthlyBusinessMonth,
  MonthlyBusinessQuery,
  MonthlyBusinessSummary,
} from "@/types/monthlyBusiness";

const MONTH_NAMES = [
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
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toMonth(raw: unknown, fallbackMonth: number): MonthlyBusinessMonth {
  const obj = asRecord(raw);
  const month = Math.min(
    12,
    Math.max(1, Math.round(toNumber(obj.month ?? obj.monthNumber ?? fallbackMonth)))
  );
  return {
    month,
    monthName:
      String(obj.monthName || obj.name || MONTH_NAMES[month - 1] || "").trim() ||
      MONTH_NAMES[month - 1],
    business: toNumber(
      obj.business ?? obj.amount ?? obj.totalBusiness ?? obj.value
    ),
    transactionCount: toNumber(
      obj.transactionCount ?? obj.transactions ?? obj.count ?? obj.txnCount
    ),
  };
}

function extractMonths(payload: Record<string, unknown>): unknown[] {
  if (Array.isArray(payload.months)) return payload.months;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

export function normalizeMonthlyBusiness(
  raw: unknown,
  requestedYear: number
): MonthlyBusinessSummary {
  const root = asRecord(raw);
  const payload = asRecord(root.data ?? root);
  const inner = asRecord(payload.data ?? {});
  const source =
    Array.isArray(inner.months) || inner.year != null ? inner : payload;

  const year = toNumber(source.year) || requestedYear;
  const months = extractMonths(source).map((item, index) =>
    toMonth(item, index + 1)
  );

  const growthRaw =
    source.growthPercent ??
    source.growth ??
    source.monthOverMonthGrowth ??
    source.momGrowth;

  return {
    year,
    totalBusiness: toNumber(
      source.totalBusiness ?? source.business ?? source.totalAmount
    ),
    totalTransactions: toNumber(
      source.totalTransactions ?? source.transactions ?? source.transactionCount
    ),
    months,
    growthPercent:
      growthRaw === null || growthRaw === undefined || growthRaw === ""
        ? null
        : toNumber(growthRaw),
  };
}

export async function fetchMonthlyBusiness(
  query: MonthlyBusinessQuery
): Promise<MonthlyBusinessSummary> {
  const { data } = await superAdminClient.get<ApiResponse<unknown>>(
    "/reports/monthly-business",
    {
      params: {
        year: query.year,
        service: query.service || undefined,
      },
    }
  );
  return normalizeMonthlyBusiness(data, query.year);
}
