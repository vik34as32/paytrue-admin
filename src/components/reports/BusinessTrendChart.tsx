"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK, BusinessPointTooltip, PeakDot } from "@/components/reports/ChartTooltip";
import { formatCompactCurrency } from "@/lib/businessReport";
import { BusinessReportPeriod, BusinessReportSummary } from "@/types/monthlyBusiness";

interface BusinessTrendChartProps {
  period: BusinessReportPeriod;
  data?: BusinessReportSummary;
  loading?: boolean;
  error?: boolean;
  fetching?: boolean;
  onRetry?: () => void;
}

const TITLES: Record<BusinessReportPeriod, string> = {
  daily: "Daily business trend",
  weekly: "Weekly business trend",
  monthly: "Monthly business trend",
  yearly: "Yearly business trend",
};

export function BusinessTrendChart({
  period,
  data,
  loading,
  error,
  fetching,
  onRetry,
}: BusinessTrendChartProps) {
  const series = data?.series || [];
  const extra = period === "monthly" || period === "yearly";

  return (
    <ChartCard
      title={TITLES[period]}
      subtitle="Primary view for the selected period"
      loading={loading}
      error={error}
      empty={!series.length}
      onRetry={onRetry}
    >
      <div className={fetching ? "h-[320px] opacity-80 sm:h-[360px]" : "h-[320px] sm:h-[360px]"}>
        <ResponsiveContainer width="100%" height="100%">
          {period === "weekly" || period === "yearly" ? (
            <BarChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={56}
                tickFormatter={(value: number) => formatCompactCurrency(value)}
              />
              <Tooltip content={<BusinessPointTooltip extra={extra} />} />
              <Bar dataKey="business" fill="#4318FF" radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          ) : period === "daily" ? (
            <AreaChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendBusinessFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4318FF" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#4318FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={2} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={56}
                tickFormatter={(value: number) => formatCompactCurrency(value)}
              />
              <Tooltip content={<BusinessPointTooltip extra={extra} />} />
              <Area
                type="monotone"
                dataKey="business"
                stroke="#4318FF"
                strokeWidth={2.5}
                fill="url(#trendBusinessFill)"
                dot={<PeakDot />}
              />
            </AreaChart>
          ) : (
            <LineChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                width={56}
                tickFormatter={(value: number) => formatCompactCurrency(value)}
              />
              <Tooltip content={<BusinessPointTooltip extra={extra} />} />
              <Line
                type="monotone"
                dataKey="business"
                stroke="#4318FF"
                strokeWidth={3}
                dot={<PeakDot />}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
