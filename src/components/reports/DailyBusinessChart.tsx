"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK, AXIS_TICK_SM, DayCompareTooltip } from "@/components/reports/ChartTooltip";
import {
  buildTodayYesterdayCompare,
  formatCompactCurrency,
  formatCurrency,
} from "@/lib/businessReport";
import { BusinessReportPoint, BusinessReportSummary } from "@/types/monthlyBusiness";
import { cn } from "@/lib/utils";

interface DailyBusinessChartProps {
  data?: BusinessReportSummary;
  extraSeries?: BusinessReportPoint[];
  loading?: boolean;
  error?: boolean;
  fetching?: boolean;
  onRetry?: () => void;
}

export function DailyBusinessChart({
  data,
  extraSeries,
  loading,
  error,
  fetching,
  onRetry,
}: DailyBusinessChartProps) {
  const compare = buildTodayYesterdayCompare(data?.series || [], extraSeries);
  const hasTotals = compare.todayTotal > 0 || compare.yesterdayTotal > 0;
  const hasHourlyValues = compare.slots.some(
    (slot) => slot.today > 0 || slot.yesterday > 0
  );
  const growth =
    compare.growthPercent == null
      ? "—"
      : `${compare.growthPercent >= 0 ? "+" : ""}${compare.growthPercent.toFixed(1)}%`;
  const diffLabel = `${compare.difference >= 0 ? "+" : "−"}${formatCurrency(
    Math.abs(compare.difference)
  )}`;
  const up = compare.difference >= 0;

  return (
    <ChartCard
      title="Daily Business"
      subtitle="Today vs yesterday"
      loading={loading}
      error={error}
      empty={!hasTotals && !hasHourlyValues}
      emptyMessage="No business data available for this period."
      onRetry={onRetry}
      actions={
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right text-xs text-muted sm:grid-cols-4">
          <p>
            Today{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(compare.todayTotal)}
            </span>
          </p>
          <p>
            Yesterday{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(compare.yesterdayTotal)}
            </span>
          </p>
          <p>
            Difference{" "}
            <span className={cn("font-semibold", up ? "text-emerald-600" : "text-rose-600")}>
              {diffLabel}
            </span>
          </p>
          <p>
            Growth{" "}
            <span className={cn("font-semibold", up ? "text-emerald-600" : "text-rose-600")}>
              {growth}
            </span>
          </p>
        </div>
      }
    >
      <div className={fetching ? "h-[280px] opacity-80" : "h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          {hasHourlyValues ? (
            <LineChart data={compare.slots} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK_SM} interval={0} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={56}
                tickFormatter={(value: number) => formatCompactCurrency(value)}
              />
              <Tooltip content={<DayCompareTooltip />} />
              <Legend verticalAlign="top" height={28} iconType="line" />
              <Line
                type="monotone"
                dataKey="today"
                name="Today"
                stroke="#4318FF"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="yesterday"
                name="Yesterday"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <BarChart
              data={[
                { label: "Yesterday", business: compare.yesterdayTotal },
                { label: "Today", business: compare.todayTotal },
              ]}
              margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={56}
                tickFormatter={(value: number) => formatCompactCurrency(value)}
              />
              <Tooltip
                formatter={(value) => [
                  formatCurrency(Number(value ?? 0)),
                  "Business",
                ]}
              />
              <Bar dataKey="business" name="Business" fill="#4318FF" radius={[8, 8, 0, 0]} maxBarSize={72}>
                <LabelList
                  dataKey="business"
                  position="top"
                  formatter={(value) =>
                    formatCompactCurrency(Number(value ?? 0))
                  }
                  style={{ fill: "var(--muted)", fontSize: 11, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
