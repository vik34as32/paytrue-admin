import { labelForBusinessService } from "@/constants/businessServices";
import { formatCompactInr, formatCurrency } from "@/lib/utils";
import {
  BusinessReportPeriod,
  BusinessReportPoint,
  BusinessReportSummary,
  BusinessServiceRow,
  MonthlyBusinessMonth,
  TransactionBreakdown,
} from "@/types/monthlyBusiness";

const MONTH_FULL = [
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

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function calculateSuccessRate(successful: number, total: number): number {
  if (!total) return 0;
  return (successful / total) * 100;
}

export function calculateFailureRate(failed: number, total: number): number {
  if (!total) return 0;
  return (failed / total) * 100;
}

export function formatCompactCurrency(amount: number): string {
  return formatCompactInr(amount);
}

export { formatCurrency };

function pickNumber(obj: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return toNumber(obj[key]);
    }
  }
  return 0;
}

function emptyPoint(partial: Partial<BusinessReportPoint> & { key: string; label: string }): BusinessReportPoint {
  return {
    date: null,
    year: null,
    month: null,
    day: null,
    weekday: null,
    business: 0,
    transactionCount: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    charges: 0,
    commission: 0,
    isPeak: false,
    ...partial,
  };
}

function mapPoint(raw: unknown, index: number): BusinessReportPoint {
  const obj = asRecord(raw);
  const nested = asRecord(obj.metrics ?? obj.stats ?? obj.values);
  const src = { ...nested, ...obj };
  const month = Math.round(toNumber(src.month ?? src.monthNumber, 0)) || null;
  const year = Math.round(toNumber(src.year, 0)) || null;
  const day = Math.round(toNumber(src.day ?? src.dayOfMonth, 0)) || null;
  const date = src.date ? String(src.date) : src.label ? String(src.label) : null;
  const weekdayRaw = src.weekday ?? src.dayOfWeek ?? src.weekDay;
  const weekdayName = String(src.dayName ?? src.weekdayName ?? src.name ?? "").trim();
  let weekday: number | null = null;
  if (typeof weekdayRaw === "number" || (typeof weekdayRaw === "string" && /^\d+$/.test(weekdayRaw))) {
    const n = Number(weekdayRaw);
    weekday = n === 0 ? 7 : n;
  } else if (weekdayName) {
    const idx = WEEKDAYS.findIndex(
      (name) => name.toLowerCase() === weekdayName.toLowerCase()
    );
    weekday = idx >= 0 ? idx + 1 : null;
  }

  const business = pickNumber(src, [
    "business",
    "amount",
    "totalBusiness",
    "value",
    "successfulAmount",
  ]);
  const transactionCount = pickNumber(src, [
    "transactionCount",
    "transactions",
    "count",
    "txnCount",
    "totalTransactions",
  ]);
  const successfulTransactions = pickNumber(src, [
    "successfulTransactions",
    "successTransactions",
    "successCount",
    "successful",
    "success",
  ]);
  const failedTransactions = pickNumber(src, [
    "failedTransactions",
    "failureTransactions",
    "failedCount",
    "failed",
    "failure",
  ]);

  const label =
    weekdayName ||
    String(src.label || src.monthName || src.name || date || `Point ${index + 1}`);

  return emptyPoint({
    key: String(src.key ?? src.id ?? date ?? `${year ?? ""}-${month ?? ""}-${day ?? index}`),
    label,
    date,
    year,
    month,
    day,
    weekday,
    business,
    transactionCount,
    successfulTransactions,
    failedTransactions,
    charges: pickNumber(src, ["charges", "charge", "totalCharges", "fee"]),
    commission: pickNumber(src, ["commission", "commissionAmount", "totalCommission"]),
  });
}

function extractSeries(payload: Record<string, unknown>): unknown[] {
  const chart = asRecord(payload.chart);
  if (Array.isArray(payload.series)) return payload.series;
  if (Array.isArray(chart.series)) return chart.series;
  if (Array.isArray(payload.months)) return payload.months;
  if (Array.isArray(payload.days)) return payload.days;
  if (Array.isArray(payload.weeks)) return payload.weeks;
  if (Array.isArray(payload.years)) return payload.years;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function markPeak(points: BusinessReportPoint[]): BusinessReportPoint[] {
  let max = 0;
  for (const point of points) max = Math.max(max, point.business);
  return points.map((point) => ({
    ...point,
    isPeak: max > 0 && point.business === max,
  }));
}

export function normalizeDailyData(
  points: BusinessReportPoint[],
  year: number,
  month: number
): BusinessReportPoint[] {
  const days = new Date(year, month, 0).getDate();
  const byDay = new Map<number, BusinessReportPoint>();
  for (const point of points) {
    const fromDate = point.date ? Number(String(point.date).slice(8, 10)) : 0;
    const day = point.day || fromDate;
    if (day >= 1 && day <= days) byDay.set(day, point);
  }
  return markPeak(
    Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const found = byDay.get(day);
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return emptyPoint({
        ...(found || {}),
        key: iso,
        label: String(day),
        date: iso,
        year,
        month,
        day,
      });
    })
  );
}

export function normalizeWeeklyData(points: BusinessReportPoint[]): BusinessReportPoint[] {
  const byWeekday = new Map<number, BusinessReportPoint>();
  for (const point of points) {
    if (point.weekday && point.weekday >= 1 && point.weekday <= 7) {
      byWeekday.set(point.weekday, point);
      continue;
    }
    const idx = WEEKDAYS.findIndex(
      (name) => name.toLowerCase() === point.label.toLowerCase()
    );
    if (idx >= 0) byWeekday.set(idx + 1, point);
  }
  return markPeak(
    WEEKDAYS.map((name, index) => {
      const weekday = index + 1;
      const found = byWeekday.get(weekday);
      return emptyPoint({
        ...(found || {}),
        key: name,
        label: name.slice(0, 3),
        weekday,
      });
    })
  );
}

export function normalizeMonthlyData(
  points: BusinessReportPoint[],
  year: number
): BusinessReportPoint[] {
  const byMonth = new Map<number, BusinessReportPoint>();
  for (const point of points) {
    if (point.month && point.month >= 1 && point.month <= 12) {
      byMonth.set(point.month, point);
    }
  }
  return markPeak(
    MONTH_FULL.map((name, index) => {
      const month = index + 1;
      const found = byMonth.get(month);
      return emptyPoint({
        ...(found || {}),
        key: `${year}-${month}`,
        label: name.slice(0, 3),
        year,
        month,
      });
    })
  );
}

export function normalizeYearlyData(points: BusinessReportPoint[]): BusinessReportPoint[] {
  const byYear = new Map<number, BusinessReportPoint>();
  for (const point of points) {
    const year = point.year || Number(point.label) || 0;
    if (year >= 2000 && year <= 2100) byYear.set(year, { ...point, year, label: String(year) });
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  if (!years.length) return markPeak(points.map((point) => ({ ...point })));
  return markPeak(years.map((year) => byYear.get(year)!));
}

export function normalizeServiceData(raw: unknown, totalBusiness: number): BusinessServiceRow[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord(raw).items)
      ? (asRecord(raw).items as unknown[])
      : [];

  const rows = list
    .map((item) => {
      const obj = asRecord(item);
      const code = String(obj.code ?? obj.service ?? obj.serviceCode ?? obj.name ?? "").trim();
      if (!code) return null;
      const business = pickNumber(obj, ["business", "amount", "totalBusiness", "value"]);
      return {
        code,
        name: String(obj.name || obj.label || labelForBusinessService(code)),
        business,
        transactionCount: pickNumber(obj, [
          "transactionCount",
          "transactions",
          "count",
          "txnCount",
        ]),
        commission: pickNumber(obj, ["commission", "commissionAmount", "totalCommission"]),
        charges: pickNumber(obj, ["charges", "charge", "totalCharges"]),
        sharePercent: 0,
      } satisfies BusinessServiceRow;
    })
    .filter((row): row is BusinessServiceRow => Boolean(row));

  const total = totalBusiness || rows.reduce((sum, row) => sum + row.business, 0);
  return rows
    .map((row) => ({
      ...row,
      sharePercent: total > 0 ? (row.business / total) * 100 : 0,
    }))
    .sort((a, b) => b.business - a.business);
}

function normalizeBreakdown(
  raw: unknown,
  points: BusinessReportPoint[],
  totals: { successful: number; failed: number; transactions: number }
): TransactionBreakdown {
  const obj = asRecord(raw);
  const successful =
    pickNumber(obj, [
      "successful",
      "success",
      "successfulTransactions",
      "successCount",
    ]) ||
    totals.successful ||
    points.reduce((sum, point) => sum + point.successfulTransactions, 0);
  const failed =
    pickNumber(obj, [
      "failed",
      "failure",
      "failedTransactions",
      "failedCount",
    ]) ||
    totals.failed ||
    points.reduce((sum, point) => sum + point.failedTransactions, 0);
  const pending = pickNumber(obj, ["pending", "processing", "pendingTransactions"]);
  const total =
    pickNumber(obj, ["total", "totalTransactions", "count"]) ||
    totals.transactions ||
    successful + failed + pending;
  return { successful, failed, pending, total };
}

function toLegacyMonths(points: BusinessReportPoint[], year: number): MonthlyBusinessMonth[] {
  return normalizeMonthlyData(points, year).map((point) => ({
    month: point.month || 0,
    monthName: MONTH_FULL[(point.month || 1) - 1],
    business: point.business,
    transactionCount: point.transactionCount,
  }));
}

export function normalizeBusinessReport(
  raw: unknown,
  query: {
    period: BusinessReportPeriod;
    year: number;
    month?: number;
  }
): BusinessReportSummary {
  const root = asRecord(raw);
  const payload = asRecord(root.data ?? root);
  const inner = asRecord(payload.data ?? {});
  const source =
    Array.isArray(inner.series) ||
    Array.isArray(inner.months) ||
    Array.isArray(inner.services) ||
    inner.totalBusiness != null
      ? inner
      : payload;

  const mapped = extractSeries(source).map(mapPoint);
  const month = query.month ?? new Date().getMonth() + 1;

  let series: BusinessReportPoint[];
  if (query.period === "daily") series = normalizeDailyData(mapped, query.year, month);
  else if (query.period === "weekly") series = normalizeWeeklyData(mapped);
  else if (query.period === "yearly") series = normalizeYearlyData(mapped);
  else series = normalizeMonthlyData(mapped, query.year);

  const totalBusiness = pickNumber(source, ["totalBusiness", "business", "totalAmount"]);
  const totalTransactions = pickNumber(source, [
    "totalTransactions",
    "transactions",
    "transactionCount",
  ]);
  const successfulTransactions = pickNumber(source, [
    "successfulTransactions",
    "successTransactions",
    "successCount",
  ]);
  const failedTransactions = pickNumber(source, [
    "failedTransactions",
    "failureTransactions",
    "failedCount",
  ]);
  const totalCharges = pickNumber(source, ["totalCharges", "charges", "charge"]);
  const totalCommission = pickNumber(source, [
    "totalCommission",
    "commission",
    "commissionAmount",
  ]);

  const services = normalizeServiceData(source.services, totalBusiness);
  const breakdown = normalizeBreakdown(source.transactionBreakdown ?? source.breakdown, series, {
    successful: successfulTransactions,
    failed: failedTransactions,
    transactions: totalTransactions,
  });

  const growthRaw =
    source.growthPercent ??
    source.growth ??
    source.monthOverMonthGrowth ??
    source.momGrowth;

  return {
    period: query.period,
    year: toNumber(source.year, query.year) || query.year,
    month: query.period === "daily" || query.period === "weekly" ? month : null,
    totalBusiness: totalBusiness || series.reduce((sum, point) => sum + point.business, 0),
    totalTransactions:
      totalTransactions || series.reduce((sum, point) => sum + point.transactionCount, 0),
    successfulTransactions: breakdown.successful,
    failedTransactions: breakdown.failed,
    totalCharges:
      totalCharges || series.reduce((sum, point) => sum + point.charges, 0),
    totalCommission:
      totalCommission || series.reduce((sum, point) => sum + point.commission, 0),
    series,
    services,
    breakdown,
    months: toLegacyMonths(mapped.length ? mapped : series, query.year),
    growthPercent:
      growthRaw === null || growthRaw === undefined || growthRaw === ""
        ? null
        : toNumber(growthRaw),
  };
}

export function emptyBusinessReport(
  query: { period: BusinessReportPeriod; year: number; month?: number }
): BusinessReportSummary {
  return normalizeBusinessReport({}, query);
}

export function highestPoint(points: BusinessReportPoint[]): BusinessReportPoint | null {
  if (!points.length) return null;
  return points.reduce((best, point) =>
    point.business > best.business ? point : best
  );
}

export function averageBusiness(points: BusinessReportPoint[]): number {
  if (!points.length) return 0;
  return points.reduce((sum, point) => sum + point.business, 0) / points.length;
}
