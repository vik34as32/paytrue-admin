"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { cn, formatCompactInr, formatCurrency } from "@/lib/utils";
import { useMonthlyBusiness } from "@/hooks/useMonthlyBusiness";
import { useActiveServices } from "@/hooks/service-master/useServiceMaster";
import { MonthlyBusinessMonth } from "@/types/monthlyBusiness";

type ChartType = "line" | "area" | "bar";
type ChartMetric = "business" | "transactions";
type ChartRange = "year" | "ytd" | "last6";

const GRAPH_PREFS_KEY = "paytrue.businessOverview.graph";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

const FALLBACK_SERVICES = [
  { value: "DMT", label: "DMT" },
  { value: "DMT2", label: "DMT2" },
  { value: "DMT3", label: "DMT3" },
  { value: "AEPS", label: "AEPS" },
  { value: "UPI", label: "UPI ATM" },
  { value: "RECHARGE", label: "Recharge" },
  { value: "BBPS", label: "BBPS" },
];

const CHART_TYPE_OPTIONS = [
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "bar", label: "Bar" },
];

const METRIC_OPTIONS = [
  { value: "business", label: "Business amount" },
  { value: "transactions", label: "Transactions" },
];

const RANGE_OPTIONS = [
  { value: "year", label: "Full year" },
  { value: "ytd", label: "Year to date" },
  { value: "last6", label: "Last 6 months" },
];

type ChartPoint = MonthlyBusinessMonth & {
  shortName: string;
  isCurrent: boolean;
};

function loadGraphPrefs(): {
  chartType: ChartType;
  metric: ChartMetric;
  range: ChartRange;
} {
  const defaults = {
    chartType: "line" as ChartType,
    metric: "business" as ChartMetric,
    range: "year" as ChartRange,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(GRAPH_PREFS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<typeof defaults>;
    return {
      chartType: ["line", "area", "bar"].includes(String(parsed.chartType))
        ? (parsed.chartType as ChartType)
        : defaults.chartType,
      metric: ["business", "transactions"].includes(String(parsed.metric))
        ? (parsed.metric as ChartMetric)
        : defaults.metric,
      range: ["year", "ytd", "last6"].includes(String(parsed.range))
        ? (parsed.range as ChartRange)
        : defaults.range,
    };
  } catch {
    return defaults;
  }
}

function currentYear() {
  return new Date().getFullYear();
}

function yearOptions() {
  const year = currentYear();
  return [year, year - 1, year - 2].map((value) => ({
    value: String(value),
    label: String(value),
  }));
}

function applyRange(points: ChartPoint[], range: ChartRange, year: number) {
  const now = new Date();
  const currentMonth =
    year === now.getFullYear() ? now.getMonth() + 1 : 12;
  if (range === "ytd") {
    return points.filter((point) => point.month <= currentMonth);
  }
  if (range === "last6") {
    const start = Math.max(1, currentMonth - 5);
    return points.filter(
      (point) => point.month >= start && point.month <= currentMonth
    );
  }
  return points;
}

function padMonths(
  year: number,
  months: MonthlyBusinessMonth[]
): ChartPoint[] {
  const byMonth = new Map(months.map((item) => [item.month, item]));
  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return MONTH_SHORT.map((shortName, index) => {
    const month = index + 1;
    const found = byMonth.get(month);
    return {
      month,
      monthName: found?.monthName || MONTH_FULL[index],
      shortName,
      business: found?.business ?? 0,
      transactionCount: found?.transactionCount ?? 0,
      isCurrent: isCurrentYear && month === currentMonth,
    };
  });
}

function BusinessTooltip({
  active,
  payload,
  year,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  year: number;
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="min-w-[180px] rounded-xl border border-border bg-card px-3 py-2.5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)]">
      <p className="text-sm font-semibold text-foreground">
        {point.monthName} {year}
        {point.isCurrent ? (
          <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            Current
          </span>
        ) : null}
      </p>
      <p className="mt-2 text-xs text-muted">Business</p>
      <p className="text-sm font-bold tabular-nums text-foreground">
        {formatCurrency(point.business)}
      </p>
      <p className="mt-1.5 text-xs text-muted">Transactions</p>
      <p className="text-sm font-semibold tabular-nums text-foreground">
        {point.transactionCount.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function CurrentDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  if (payload?.isCurrent) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={11} fill="var(--primary)" opacity={0.18} />
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="var(--primary)"
          stroke="#ffffff"
          strokeWidth={2}
        />
      </g>
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--primary)"
      stroke="#ffffff"
      strokeWidth={1.5}
    />
  );
}

function GraphSkeleton() {
  return (
    <div className="flex h-[280px] flex-col justify-end gap-3 rounded-xl bg-muted/20 p-4">
      <div className="h-full animate-pulse rounded-lg bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
      <div className="flex justify-between">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-2 w-8 animate-pulse rounded bg-muted/60"
          />
        ))}
      </div>
    </div>
  );
}

export function BusinessOverviewChart() {
  const prefs = useMemo(() => loadGraphPrefs(), []);
  const [year, setYear] = useState(currentYear);
  const [service, setService] = useState("");
  const [chartType, setChartType] = useState<ChartType>(prefs.chartType);
  const [metric, setMetric] = useState<ChartMetric>(prefs.metric);
  const [range, setRange] = useState<ChartRange>(prefs.range);
  const { data: activeServices } = useActiveServices();
  const {
    data,
    isPending,
    isFetching,
    isError,
    dataUpdatedAt,
    refetch,
  } = useMonthlyBusiness(year, service);

  useEffect(() => {
    window.localStorage.setItem(
      GRAPH_PREFS_KEY,
      JSON.stringify({ chartType, metric, range })
    );
  }, [chartType, metric, range]);

  const serviceOptions = useMemo(() => {
    const activeCodes = new Set(
      (activeServices || []).map((item) => item.code.toUpperCase())
    );
    const fromMaster = (activeServices || [])
      .filter((item) => item.type !== "SUB")
      .map((item) => ({
        value: item.code,
        label: item.name || item.code,
      }));
    const preferred = FALLBACK_SERVICES.filter(
      (item) => !activeCodes.size || activeCodes.has(item.value)
    );
    const merged = [...preferred];
    fromMaster.forEach((item) => {
      if (!merged.some((row) => row.value.toUpperCase() === item.value.toUpperCase())) {
        merged.push(item);
      }
    });
    return [{ value: "", label: "All Services" }, ...merged];
  }, [activeServices]);

  const points = useMemo(
    () => applyRange(padMonths(year, data?.months || []), range, year),
    [data?.months, range, year]
  );

  const currentPoint = points.find((point) => point.isCurrent);
  const previousPoint = currentPoint
    ? points.find((point) => point.month === currentPoint.month - 1)
    : undefined;

  const growthPercent = useMemo(() => {
    if (data?.growthPercent != null && Number.isFinite(data.growthPercent)) {
      return data.growthPercent;
    }
    if (!currentPoint || !previousPoint || previousPoint.business <= 0) {
      return null;
    }
    return (
      ((currentPoint.business - previousPoint.business) /
        previousPoint.business) *
      100
    );
  }, [currentPoint, data?.growthPercent, previousPoint]);

  const dataKey = metric === "business" ? "business" : "transactionCount";
  const hasSeries = points.some((point) => Number(point[dataKey]) > 0);
  const showSkeleton = isPending && !data;
  const lastUpdated = dataUpdatedAt
    ? format(new Date(dataUpdatedAt), "h:mm a")
    : null;

  const yTick = (value: number) =>
    metric === "business"
      ? formatCompactInr(value)
      : value.toLocaleString("en-IN");

  return (
    <Card className="overflow-hidden">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Business Overview</h3>
          <p className="text-sm text-muted">
            Track your monthly business performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className="min-w-[140px]"
            options={CHART_TYPE_OPTIONS}
            value={chartType}
            onChange={(event) => setChartType(event.target.value as ChartType)}
            aria-label="Chart type"
          />
          <Select
            className="min-w-[170px]"
            options={METRIC_OPTIONS}
            value={metric}
            onChange={(event) => setMetric(event.target.value as ChartMetric)}
            aria-label="Metric"
          />
          <Select
            className="min-w-[150px]"
            options={RANGE_OPTIONS}
            value={range}
            onChange={(event) => setRange(event.target.value as ChartRange)}
            aria-label="Range"
          />
          <Select
            className="min-w-[160px]"
            options={serviceOptions}
            value={service}
            onChange={(event) => setService(event.target.value)}
            aria-label="Service"
          />
          <Select
            className="min-w-[110px]"
            options={yearOptions()}
            value={String(year)}
            onChange={(event) => setYear(Number(event.target.value))}
            aria-label="Year"
          />
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          label="Total Business"
          value={formatCompactInr(data?.totalBusiness || 0)}
        />
        <SummaryTile
          label="Transactions"
          value={(data?.totalTransactions || 0).toLocaleString("en-IN")}
        />
        <SummaryTile
          label="Current Month"
          value={formatCompactInr(currentPoint?.business || 0)}
        />
        <SummaryTile
          label="Growth"
          value={
            growthPercent == null
              ? "—"
              : `${growthPercent > 0 ? "+" : ""}${growthPercent.toFixed(1)}%`
          }
          tone={
            growthPercent == null
              ? "muted"
              : growthPercent >= 0
                ? "up"
                : "down"
          }
        />
      </div>

      {showSkeleton ? (
        <GraphSkeleton />
      ) : isError && !data ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/10 px-4 text-center">
          <p className="text-sm font-semibold text-foreground">
            Unable to load business data
          </p>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : !hasSeries ? (
        <div className="flex h-[280px] items-center justify-center rounded-xl border border-border bg-muted/10 px-4 text-center">
          <p className="text-sm text-muted">
            No business data available for this period
          </p>
        </div>
      ) : (
        <div className={cn("h-[280px] sm:h-[320px]", isFetching && "opacity-90")}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={points} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={yTick} width={64} />
                <Tooltip cursor={{ fill: "var(--primary)", fillOpacity: 0.06 }} content={<BusinessTooltip year={year} />} />
                <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} isAnimationActive animationDuration={800}>
                  {points.map((point) => (
                    <Cell
                      key={point.month}
                      fill="var(--primary)"
                      fillOpacity={point.isCurrent ? 1 : 0.55}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === "area" ? (
              <AreaChart data={points} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="businessAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={yTick} width={64} />
                <Tooltip cursor={{ stroke: "var(--primary)", strokeOpacity: 0.2 }} content={<BusinessTooltip year={year} />} />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#businessAreaFill)"
                  dot={<CurrentDot />}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                  isAnimationActive
                  animationDuration={800}
                />
              </AreaChart>
            ) : (
              <LineChart data={points} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={yTick} width={64} />
                <Tooltip cursor={{ stroke: "var(--primary)", strokeOpacity: 0.2 }} content={<BusinessTooltip year={year} />} />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={<CurrentDot />}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                  isAnimationActive
                  animationDuration={800}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>
          {currentPoint ? (
            <>
              Current: {currentPoint.monthName} {year}
            </>
          ) : (
            "Monthly business trend"
          )}
        </span>
        <span>{lastUpdated ? `Last updated: ${lastUpdated}` : "—"}</span>
      </div>
    </Card>
  );
}

function SummaryTile({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "up" | "down";
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 text-lg font-bold tabular-nums",
          tone === "up" && "text-accent-green",
          tone === "down" && "text-accent-red",
          tone === "muted" && "text-foreground"
        )}
      >
        {tone === "up" ? <TrendingUp className="h-4 w-4" /> : null}
        {tone === "down" ? <TrendingDown className="h-4 w-4" /> : null}
        {value}
      </p>
    </div>
  );
}
