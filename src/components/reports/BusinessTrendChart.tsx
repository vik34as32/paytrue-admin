"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK, BusinessPointTooltip } from "@/components/reports/ChartTooltip";
import { formatCompactCurrency } from "@/lib/businessReport";
import { BusinessReportPeriod, BusinessReportSummary } from "@/types/monthlyBusiness";

interface BusinessTrendChartProps {
  period: BusinessReportPeriod;
  data?: BusinessReportSummary;
  year?: number;
  loading?: boolean;
  error?: boolean;
  fetching?: boolean;
  onRetry?: () => void;
}

export function BusinessTrendChart({
  period,
  data,
  year,
  loading,
  error,
  fetching,
  onRetry,
}: BusinessTrendChartProps) {
  const series = data?.series || [];
  const chartYear = year || data?.year || new Date().getFullYear();
  const extra = period === "monthly" || period === "yearly";
  const title =
    period === "yearly"
      ? `Yearly business trend · ${chartYear}`
      : period === "weekly"
        ? "Weekly business trend"
        : period === "daily"
          ? "Daily business trend"
          : `Monthly business trend · ${chartYear}`;
  const subtitle =
    period === "yearly"
      ? `January–December ${chartYear} business amount`
      : period === "weekly"
        ? "Sunday to Saturday business"
        : "Primary view for the selected period";

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      empty={!series.length}
      emptyMessage="No business data available for this period."
      onRetry={onRetry}
    >
      <div className={fetching ? "h-[320px] opacity-80 sm:h-[360px]" : "h-[320px] sm:h-[360px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              interval={0}
            />
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
              name="Business"
              stroke="#4318FF"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
