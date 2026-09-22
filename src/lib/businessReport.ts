import { labelForBusinessService } from "@/constants/businessServices";
import { formatCurrency } from "@/lib/utils";
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

const WEEKDAYS_SUN_SAT = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
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
  const value = Number(amount);
  if (!Number.isFinite(value)) return "₹0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const trim = (n: number) => {
    const text = n >= 10 ? n.toFixed(1) : n.toFixed(2);
    return text.replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1");
  };
  if (abs >= 1_00_00_000) return `${sign}₹${trim(abs / 1_00_00_000)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${trim(abs / 1_00_000)}L`;
  return `${sign}${formatCurrency(abs)}`;
}

export function formatTxnCount(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString("en-IN");
}

export function safeGrowthPercent(today: number, yesterday: number): number | null {
  if (!Number.isFinite(today) || !Number.isFinite(yesterday)) return null;
  if (yesterday === 0) return null;
  return ((today - yesterday) / Math.abs(yesterday)) * 100;
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
    hour: null,
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
  if (typeof raw === "number") {
    return emptyPoint({
      key: String(index),
      label: String(index + 1),
      business: raw,
    });
  }
  const obj = asRecord(raw);
  const nested = asRecord(obj.metrics ?? obj.stats ?? obj.values);
  const src = { ...nested, ...obj };
  const parsed = parseDateParts(
    src.date ?? src.dayDate ?? src.txnDate ?? src.periodStart ?? src.x
  );
  const month =
    Math.round(toNumber(src.month ?? src.monthNumber, 0)) ||
    monthFromName(src.monthName ?? src.name ?? src.label) ||
    parsed.month;
  const year = Math.round(toNumber(src.year, 0)) || parsed.year;
  const day =
    Math.round(toNumber(src.day ?? src.dayOfMonth, 0)) || parsed.day;
  const date = parsed.date || (src.date ? String(src.date) : null);
  const weekdayRaw = src.weekday ?? src.dayOfWeek ?? src.weekDay;
  const weekdayName = String(
    src.dayName ?? src.weekdayName ?? src.weekDayName ?? ""
  ).trim();
  let weekday: number | null = parsed.weekday;
  if (
    typeof weekdayRaw === "number" ||
    (typeof weekdayRaw === "string" && /^\d+$/.test(weekdayRaw))
  ) {
    const n = Number(weekdayRaw);
    weekday = n === 0 ? 7 : n;
  } else if (weekdayName) {
    const sun = WEEKDAYS_SUN_SAT.findIndex(
      (name) => name.toLowerCase() === weekdayName.toLowerCase()
    );
    if (sun >= 0) weekday = sun === 0 ? 7 : sun;
    else {
      const idx = WEEKDAYS.findIndex(
        (name) => name.toLowerCase() === weekdayName.toLowerCase()
      );
      weekday = idx >= 0 ? idx + 1 : weekday;
    }
  }

  let hour: number | null = null;
  const hourRaw = src.hour ?? src.hourOfDay ?? src.hr ?? src.time;
  if (typeof hourRaw === "number" || (typeof hourRaw === "string" && /^\d+$/.test(hourRaw))) {
    const n = Number(hourRaw);
    if (n >= 0 && n <= 23) hour = n;
  } else if (typeof hourRaw === "string") {
    const match = hourRaw.trim().match(/^(\d{1,2})(?::\d{2})?/);
    if (match) {
      const n = Number(match[1]);
      if (n >= 0 && n <= 23) hour = n;
    }
  }

  const business = pickNumber(src, [
    "business",
    "amount",
    "totalBusiness",
    "value",
    "successfulAmount",
    "y",
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
    String(
      src.label ||
        src.monthName ||
        src.name ||
        src.weekLabel ||
        date ||
        `Point ${index + 1}`
    );

  return emptyPoint({
    key: String(
      src.key ?? src.id ?? date ?? `${year ?? ""}-${month ?? ""}-${day ?? index}`
    ),
    label,
    date,
    year,
    month,
    day,
    weekday,
    hour,
    business,
    transactionCount,
    successfulTransactions,
    failedTransactions,
    charges: pickNumber(src, ["charges", "charge", "totalCharges", "fee"]),
    commission: pickNumber(src, [
      "commission",
      "commissionAmount",
      "totalCommission",
    ]),
  });
}

function extractArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length && keys.every((key) => /^\d+$/.test(key))) {
    return keys
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => obj[key]);
  }
  return [];
}

function monthFromName(value: unknown): number | null {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (!text) return null;
  const full = MONTH_FULL.findIndex((name) => name.toLowerCase() === text);
  if (full >= 0) return full + 1;
  const short = MONTH_FULL.findIndex(
    (name) => name.slice(0, 3).toLowerCase() === text.slice(0, 3)
  );
  return short >= 0 ? short + 1 : null;
}

function parseDateParts(value: unknown): {
  date: string | null;
  year: number | null;
  month: number | null;
  day: number | null;
  weekday: number | null;
} {
  if (value === null || value === undefined || value === "") {
    return { date: null, year: null, month: null, day: null, weekday: null };
  }
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  let date: Date | null = null;
  if (iso) date = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`);
  else if (dmy) {
    date = new Date(
      `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}T00:00:00`
    );
  } else {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }
  if (!date || Number.isNaN(date.getTime())) {
    return { date: raw, year: null, month: null, day: null, weekday: null };
  }
  const js = date.getDay();
  return {
    date: raw,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekday: js === 0 ? 7 : js,
  };
}

function seriesHasValues(points: BusinessReportPoint[]): boolean {
  return points.some(
    (point) => point.business > 0 || point.transactionCount > 0
  );
}

function preserveSeries(
  normalized: BusinessReportPoint[],
  mapped: BusinessReportPoint[]
): BusinessReportPoint[] {
  if (seriesHasValues(normalized)) return normalized;
  if (seriesHasValues(mapped)) {
    return markPeak(
      mapped.map((point, index) =>
        emptyPoint({
          ...point,
          key: point.key || String(index),
          label: point.label || String(index + 1),
        })
      )
    );
  }
  return normalized;
}

function extractSeries(payload: Record<string, unknown>): unknown[] {
  const chart = asRecord(payload.chart);
  const fromChartSeries = extractArray(chart.series);
  const labels = extractArray(
    chart.labels ?? chart.categories ?? payload.labels ?? payload.categories
  );
  const dataset = asRecord(extractArray(chart.datasets)[0]);
  const datasetValues = extractArray(dataset.data ?? dataset.values);
  const firstChartSeries = asRecord(fromChartSeries[0]);
  const nestedChartValues = extractArray(firstChartSeries.data ?? firstChartSeries.values);
  if (labels.length && (datasetValues.length || nestedChartValues.length)) {
    const values = datasetValues.length ? datasetValues : nestedChartValues;
    return labels.map((label, index) => ({
      label,
      business: values[index],
    }));
  }
  const candidates = [
    payload.series,
    chart.series,
    payload.months,
    payload.days,
    payload.weeks,
    payload.years,
    payload.hourly,
    payload.hours,
    asRecord(payload.today).hourly,
    asRecord(payload.yesterday).hourly,
    payload.buckets,
    payload.data,
    payload.items,
    fromChartSeries,
  ];
  for (const candidate of candidates) {
    const list = extractArray(candidate);
    if (list.length) return list;
  }
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
    const day = point.day || (fromDate >= 1 && fromDate <= 31 ? fromDate : 0);
    if (day >= 1 && day <= days) {
      const prev = byDay.get(day);
      byDay.set(day, prev ? mergePoints(prev, point) : point);
    }
  }
  const padded = markPeak(
    Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const found = byDay.get(day);
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return emptyPoint({
        ...(found || {}),
        key: iso,
        label: String(day),
        date: found?.date || iso,
        year,
        month,
        day,
      });
    })
  );
  return preserveSeries(padded, points);
}

function mergePoints(
  left: BusinessReportPoint,
  right: BusinessReportPoint
): BusinessReportPoint {
  return {
    ...left,
    business: left.business + right.business,
    transactionCount: left.transactionCount + right.transactionCount,
    successfulTransactions:
      left.successfulTransactions + right.successfulTransactions,
    failedTransactions: left.failedTransactions + right.failedTransactions,
    charges: left.charges + right.charges,
    commission: left.commission + right.commission,
  };
}

export function aggregateByWeekday(
  points: BusinessReportPoint[]
): BusinessReportPoint[] {
  const buckets = WEEKDAYS_SUN_SAT.map((name, index) =>
    emptyPoint({
      key: name,
      label: name.slice(0, 3),
      weekday: index === 0 ? 7 : index,
    })
  );
  for (const point of points) {
    let weekday = point.weekday;
    if (!weekday && point.date) weekday = parseDateParts(point.date).weekday;
    if (!weekday) {
      const idx = WEEKDAYS_SUN_SAT.findIndex(
        (name) =>
          name.toLowerCase() === point.label.toLowerCase() ||
          name.slice(0, 3).toLowerCase() === point.label.toLowerCase()
      );
      weekday = idx >= 0 ? (idx === 0 ? 7 : idx) : null;
    }
    if (!weekday || weekday < 1 || weekday > 7) continue;
    const bucketIndex = weekday === 7 ? 0 : weekday;
    buckets[bucketIndex] = mergePoints(buckets[bucketIndex], {
      ...point,
      key: WEEKDAYS_SUN_SAT[bucketIndex],
      label: WEEKDAYS_SUN_SAT[bucketIndex].slice(0, 3),
      weekday,
    });
  }
  return markPeak(buckets);
}

export function normalizeWeeklyData(points: BusinessReportPoint[]): BusinessReportPoint[] {
  const weekNumbered = points.filter((point) => {
    const week = Number(
      String(point.key).match(/week\s*(\d+)/i)?.[1] ||
        (point.label.match(/^\s*w(?:eek)?\s*(\d+)/i) || [])[1] ||
        0
    );
    return week >= 1 && week <= 6;
  });
  if (weekNumbered.length && seriesHasValues(weekNumbered)) {
    return markPeak(
      weekNumbered.map((point, index) =>
        emptyPoint({
          ...point,
          key: `week-${index + 1}`,
          label: point.label || `Week ${index + 1}`,
        })
      )
    );
  }

  const byWeekday = aggregateByWeekday(points);
  if (seriesHasValues(byWeekday)) return byWeekday;
  return preserveSeries(byWeekday, points);
}

export function normalizeMonthlyData(
  points: BusinessReportPoint[],
  year: number
): BusinessReportPoint[] {
  const byMonth = new Map<number, BusinessReportPoint>();
  for (const point of points) {
    const month = point.month || monthFromName(point.label);
    if (month && month >= 1 && month <= 12) {
      const prev = byMonth.get(month);
      byMonth.set(
        month,
        prev ? mergePoints(prev, { ...point, month }) : { ...point, month }
      );
    }
  }
  if (!byMonth.size && points.length === 12) {
    points.forEach((point, index) => byMonth.set(index + 1, point));
  }
  const padded = markPeak(
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
  return preserveSeries(padded, points);
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
  let list: unknown[] = extractArray(raw);
  if (!list.length && raw && typeof raw === "object" && !Array.isArray(raw)) {
    list = Object.entries(raw as Record<string, unknown>).map(([code, value]) =>
      typeof value === "number" || typeof value === "string"
        ? { code, business: value }
        : { code, ...asRecord(value) }
    );
  }

  const rows = list
    .map((item) => {
      const obj = asRecord(item);
      const code = String(
        obj.code ?? obj.service ?? obj.serviceCode ?? obj.name ?? obj.label ?? ""
      ).trim();
      if (!code) return null;
      const business = pickNumber(obj, [
        "business",
        "amount",
        "totalBusiness",
        "value",
      ]);
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
        commission: pickNumber(obj, [
          "commission",
          "commissionAmount",
          "totalCommission",
        ]),
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
  const nested = asRecord(obj.status ?? obj.statuses ?? obj.byStatus);
  const successful =
    pickNumber(obj, [
      "successful",
      "success",
      "successfulTransactions",
      "successCount",
      "SUCCESS",
    ]) ||
    pickNumber(nested, ["successful", "success", "SUCCESS"]) ||
    totals.successful ||
    points.reduce((sum, point) => sum + point.successfulTransactions, 0);
  const failed =
    pickNumber(obj, [
      "failed",
      "failure",
      "failedTransactions",
      "failedCount",
      "FAILED",
    ]) ||
    pickNumber(nested, ["failed", "failure", "FAILED"]) ||
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
  const root = Array.isArray(raw) ? { series: raw } : asRecord(raw);
  const dataNode = root.data;
  const payload = Array.isArray(dataNode)
    ? { ...root, series: dataNode }
    : asRecord(dataNode ?? root);
  const innerNode = payload.data;
  const inner = Array.isArray(innerNode)
    ? { ...payload, series: innerNode }
    : asRecord(innerNode);
  const source =
    extractSeries(inner).length ||
    inner.totalBusiness != null ||
    inner.services != null
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

export function seriesHasData(points: BusinessReportPoint[]): boolean {
  return seriesHasValues(points);
}

export function averageBusiness(points: BusinessReportPoint[]): number {
  if (!points.length) return 0;
  return points.reduce((sum, point) => sum + point.business, 0) / points.length;
}

const HOUR_SLOTS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] as const;

export function hourSlotLabel(hour: number): string {
  const h = ((Math.floor(hour / 2) * 2) + 24) % 24;
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function pointOnDate(point: BusinessReportPoint, iso: string): boolean {
  const datePart = String(point.date || "").slice(0, 10);
  if (datePart === iso) return true;
  const [year, month, day] = iso.split("-").map(Number);
  return point.year === year && point.month === month && point.day === day;
}

export interface DayCompareSlot {
  hour: number;
  label: string;
  today: number;
  yesterday: number;
}

export interface DayCompareResult {
  todayDate: string;
  yesterdayDate: string;
  todayTotal: number;
  yesterdayTotal: number;
  difference: number;
  growthPercent: number | null;
  hasHourly: boolean;
  slots: DayCompareSlot[];
}

export function buildTodayYesterdayCompare(
  primary: BusinessReportPoint[],
  extra: BusinessReportPoint[] = [],
  now = new Date()
): DayCompareResult {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const todayIso = isoDay(today);
  const yesterdayIso = isoDay(yesterday);
  const all = [...primary, ...extra];
  const todayPts = all.filter((point) => pointOnDate(point, todayIso));
  const yesterdayPts = all.filter((point) => pointOnDate(point, yesterdayIso));
  const hasHourly = [...todayPts, ...yesterdayPts].some((point) => point.hour != null);

  const slots: DayCompareSlot[] = HOUR_SLOTS.map((hour) => ({
    hour,
    label: hourSlotLabel(hour),
    today: 0,
    yesterday: 0,
  }));

  const addToSlots = (
    points: BusinessReportPoint[],
    key: "today" | "yesterday"
  ) => {
    for (const point of points) {
      if (point.hour == null) continue;
      const slotHour = Math.floor(point.hour / 2) * 2;
      const row = slots.find((item) => item.hour === slotHour);
      if (row) row[key] += point.business;
    }
  };
  addToSlots(todayPts, "today");
  addToSlots(yesterdayPts, "yesterday");

  const todayTotal = todayPts.reduce((sum, point) => sum + point.business, 0);
  const yesterdayTotal = yesterdayPts.reduce(
    (sum, point) => sum + point.business,
    0
  );

  return {
    todayDate: todayIso,
    yesterdayDate: yesterdayIso,
    todayTotal,
    yesterdayTotal,
    difference: todayTotal - yesterdayTotal,
    growthPercent: safeGrowthPercent(todayTotal, yesterdayTotal),
    hasHourly,
    slots,
  };
}
