"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/reports/ChartCard";
import { AXIS_TICK, BusinessPointTooltip } from "@/components/reports/ChartTooltip";
import { formatCompactCurrency } from "@/lib/businessReport";
import { BusinessReportPoint } from "@/types/monthlyBusiness";

interface YearlyBusinessChartProps {
  series: BusinessReportPoint[];
  loading?: boolean;
  error?: boolean;
  fetching?: boolean;
  onRetry?: () => void;
}

export function YearlyBusinessChart({
  series,
  loading,
  error,
  fetching,
  onRetry,
}: YearlyBusinessChartProps) {
  return (
    <ChartCard
      title="Yearly Business"
      subtitle="Calendar-year totals"
      loading={loading}
      error={error}
      empty={!series.length}
      emptyMessage="No business data available for this period."
      onRetry={onRetry}
    >
      <div className={fetching ? "h-[280px] opacity-80" : "h-[280px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={0} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={56}
              tickFormatter={(value: number) => formatCompactCurrency(value)}
            />
            <Tooltip content={<BusinessPointTooltip extra />} />
            <Bar
              dataKey="business"
              name="Business"
              fill="#4318FF"
              radius={[8, 8, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
